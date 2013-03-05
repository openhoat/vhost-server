var path = require('path')
  , fs = require('fs')
  , http = require('http')
  , httpProxy = require('http-proxy')
  , wbp = require('wbpjs')
  , config = wbp.requireAppFile('config')
  , webapps = wbp.requireAppFile('models', 'webapps')
  , proxyRouter = {}
  , appDirs
  , child_process = require('child_process')
  , nodeCmd = path.join(config.nodeBinDir, config.nodeCmdName)
  , pkg = wbp.requireAppFile('package.json')
  , i  , appName , appDir, stats , appConfigFile , appMainFile , appPackageFile
  , packageApp , appConfig , webapp, appPort , appDomain , appAddress
  , thatWbp, onExit;

config.proxyListenPort = config.proxyListenPort || process.env['LISTEN_PORT'] || 3000;
config.proxyRealPort = config.proxyRealPort || config.proxyListenPort;
config.baseDomain = config.baseDomain || 'localdomain';
config.proxyListenAddress = config.proxyListenAddress || config.baseDomain;
config.nodeAppUserUid = config.nodeAppUserUid || process.env['NODE_APP_USER_UID'];

function onSignal(signal) {
  wbp.log('received signal : %s', signal);
  while (webapps.length > 0) {
    var webapp = webapps[0];
    if (webapp.process !== null) {
      wbp.log('stopping app : %s (pid : %s)', webapp.name, webapp.process.pid);
      try {
        process.kill(webapp.process.pid, 'SIGTERM');
      } catch (err) {
        wbp.log('error', err);
      }
    }
    webapps.splice(0, 1);
  }
  process.exit(0);
}

['SIGINT', 'SIGHUP', 'SIGABRT', 'SIGKILL', 'SIGTERM', 'SIGQUIT'].forEach(function (signal) {
  process.on(signal, function () {
    onSignal(signal);
  });
});

process.on('exit', function (code) {
  wbp.log('exit with code %s', code);
});

function getAppPort(appConfig) {
  var key, plugin, result = null;
  if (appConfig.plugins !== undefined) {
    for (key in appConfig.plugins) {
      if (appConfig.plugins.hasOwnProperty(key)) {
        plugin = appConfig.plugins[key];
        if (plugin.config !== undefined && plugin.config.port !== undefined) {
          result = plugin.config.port;
          break;
        }
      }
    }
  }
  if (result === null) {
    result = appConfig.port;
  }
  return result;
}

if (config.appsToScan) {
  appDirs = config.appsToScan;
} else {
  appDirs = fs.readdirSync(config.nodeAppRootPath);
}

for (i = 0; i < appDirs.length; i++) {
  appName = appDirs[i];
  appDir = path.join(config.nodeAppRootPath, appName);
  stats = fs.lstatSync(appDir);
  if (stats.isDirectory()) {
    appConfigFile = path.join(appDir, 'config.js');
    appMainFile = path.join(appDir, 'app.js');
    appPackageFile = path.join(appDir, 'package.json');
    if (fs.existsSync(appConfigFile) && fs.existsSync(appMainFile)) {
      wbp.log('found app :', appName);
      packageApp = require(appPackageFile);
      if (packageApp.name !== pkg.name) {
        appConfig = require(appConfigFile);
        webapp = {
          name:appName,
          url:'http://' + appName + '.' + config.baseDomain + ':' + config.proxyRealPort,
          description:packageApp.description,
          sources:packageApp.homepage,
          process:null
        };
        appPort = getAppPort(appConfig);
        appDomain = appName + '.' + config.baseDomain;
        appAddress = '127.0.0.1:' + appPort;
        wbp.log('adding mapping : %s -> %s', appDomain, appAddress);
        proxyRouter[appDomain] = appAddress;
        webapps.push(webapp);
      }
    }
  }
}

wbp.log('add welcome web app virtual host');
var indexWebappPort = getAppPort(config);
proxyRouter[config.baseDomain] = '127.0.0.1:' + indexWebappPort;

wbp.log('create proxy server');
var proxyServer = httpProxy.createServer({
  hostnameOnly:true,
  router:proxyRouter,
  enable:{
    xforward:true
  }
}, function (req, res, proxy) {
  var location = proxy.proxyTable.getProxyLocation(req);
  if (location) {
    proxy.proxyRequest(req, res);
  } else {
    res.writeHead(404, { 'Content-Type':'text/plain' });
    res.end('Oops');
  }
});

proxyServer.proxy.on('proxyError', function (err, req, res) {
  wbp.log('error', err);
  res.writeHead(500, { 'Content-Type':'text/plain' });
  res.end('Oops. Something went wrong.');
});

proxyServer.on('upgrade', function (req, socket, head) {
  proxyServer.proxy.proxyWebSocketRequest(req, socket, head);
});

proxyServer.listen(config.proxyListenPort, config.proxyListenAddress);
wbp.log('proxy server listening to port :', config.proxyListenPort);

wbp.log('starting registered webapps');
for (i = 0; i < webapps.length; i++) {
  webapp = webapps[i];
  appDir = path.join(config.nodeAppRootPath, webapp.name);
  appMainFile = path.join(appDir, 'app.js');
  wbp.log('starting app :', appName);
  webapp.process = child_process.spawn(nodeCmd, [ appMainFile ], {
    cwd:appDir,
    detached:true,
    stdio:'inherit',
    uid:config.nodeAppUserUid || process.getuid()
  });
  thatWbp = wbp;
  onExit = (function (webapp) {
    return function (code, signal) {
      var i;
      for (i = 0; i < webapps.length; i++) {
        if (webapp.process !== null && webapps[i].process !== null && webapps[i].process.pid === webapp.process.pid) {
          webapps[i].process = null;
        }
      }
      if (signal === null) {
        thatWbp.log('app %s stopped with code %s', webapp.name, code);
      } else {
        thatWbp.log('app %s stopped with code %s due to signal %s', webapp.name, code, signal);
      }
    };
  })(webapp);
  webapp.process.on('exit', onExit);
}
