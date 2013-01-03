var path = require('path')
  , fs = require('fs')
  , http = require('http')
  , httpProxy = require('http-proxy')
  , wbp = require('wbpjs')
  , config = require(wbp.findAppFile('config.js'))
  , webapps = require(wbp.findAppFile('models', 'webapps.js'))
  , proxyRouter = {}
  , appDirs
  , child_process = require('child_process')
  , nodeCmd = path.join(config.nodeBinDir, config.nodeCmdName)
  , pkg = require(wbp.findAppFile('package.json'))

config.proxyRealPort = config.proxyRealPort || config.proxyListenPort;
config.baseDomain = config.baseDomain || 'localdomain';

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

['SIGINT', 'SIGHUP', 'SIGABRT', 'SIGKILL', 'SIGTERM', 'SIGQUIT'].forEach(function(signal){
  process.on(signal, function () {
    onSignal(signal);
  });
});

process.on('exit', function (code) {
    wbp.log('exit with code %s', code);
});

function getAppPort(appConfig) {
  var result;
  if (appConfig.plugins !== undefined && appConfig.plugins['wbpjs-mvc'] !== undefined) {
    result = appConfig.plugins['wbpjs-mvc'].config.port;
  } else {
    result = appConfig.port;
  }
  return result;
}

if (config.appsToScan) {
  appDirs = config.appsToScan;
} else {
  appDirs = fs.readdirSync(config.nodeAppRootPath);
}

for (var i = 0; i < appDirs.length; i++) {
  var appName = appDirs[i]
    , appDir = path.join(config.nodeAppRootPath, appName)
    , stats = fs.lstatSync(appDir);
  if (stats.isDirectory()) {
    var appConfigFile = path.join(appDir, 'config.js')
      , appMainFile = path.join(appDir, 'app.js')
      , appPackageFile = path.join(appDir, 'package.json');
    if (fs.existsSync(appConfigFile) && fs.existsSync(appMainFile)) {
      wbp.log('found app :', appName);
      var packageApp = require(appPackageFile);
      if (packageApp.name === pkg.name) {
        continue;
      }
      var appConfig = require(appConfigFile)
        , webapp = {
          name:appName,
          url:'http://' + appName + '.' + config.baseDomain + ':' + config.proxyRealPort,
          description:packageApp.description,
          sources:packageApp.homepage,
          process:null
        };
      wbp.log('starting app :', appName);
      webapp.process = child_process.spawn(nodeCmd, [ appMainFile ], {
        cwd:appDir,
        detached:true,
        stdio:'inherit',
        uid:process.getuid()
      });
      var thatWbp = wbp
        , onExit = (function (webapp) {
          return function (code, signal) {
            for (var i = 0; i < webapps.length; i++) {
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
      var appPort = getAppPort(appConfig);
      proxyRouter[appName + '.' + config.baseDomain] = '127.0.0.1:' + appPort;
      webapps.push(webapp);
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
  res.writeHead(500, { 'Content-Type':'text/plain' });
  res.end('Oops. Something went wrong.');
});

proxyServer.listen(config.proxyListenPort);
wbp.log('proxy server listening to port :', config.proxyListenPort);