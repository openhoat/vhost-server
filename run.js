var path = require('path')
  , fs = require('fs')
  , http = require('http')
  , httpProxy = require('http-proxy')
  , webapps = require('./models/webapps.js');

try {
  process.setuid('node');
} catch (err) {
  console.log('Error :', err);
}

var config = {
  nodeBinDir:path.dirname(process.execPath),
  nodeCmdName:'node',
  nodeAppRootPath:path.join(__dirname, '..'),
  baseDomain:'valtech-training.fr',
  proxyPort:3000,
  appsToScan:['ifs']
};

var proxyRouter = {}
  , appDirs
  , child_process = require('child_process')
  , nodeCmd = path.join(config.nodeBinDir, config.nodeCmdName);

function killChilds(signal) {
  while (webapps.length > 0) {
    var webapp = webapps[0];
    if (webapp.process !== null) {
      console.log('Stopping app :', webapp.name);
      process.kill(webapp.process.pid, 'SIGTERM');
    }
    webapps.splice(0, 1);
  }
}
;

process.on('SIGHUP', killChilds);
process.on('SIGINT', killChilds);
process.on('SIGTERM', killChilds);
process.on('exit', killChilds);

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
      console.log('Found app :', appName);
      var packageApp = require(appPackageFile)
        , appConfig = require(appConfigFile)
        , webapp = {
          name:appName,
          url:'http://' + appName + '.' + config.baseDomain + ':' + config.proxyPort,
          description:packageApp.description,
          sources:packageApp.homepage,
          process:null
        };
      console.log('Starting app :', appName);
      webapp.process = child_process.spawn(nodeCmd, [ appMainFile ], {
        cwd:appDir,
        detached:true,
        uid:process.getuid()
      });
      var appPort;
      if (appConfig.port === undefined) {
        appPort = appConfig.plugins['wbpjs-mvc'].config.port;
      } else {
        appPort = appConfig.port;
      }
      proxyRouter[appName + '.' + config.baseDomain] = '127.0.0.1:' + appPort;
      webapps.push(webapp);
    }
  }
}

console.log('Create index web app');
var indexWebappConfig = require('./lib/index-webapp/config.js');
proxyRouter[config.baseDomain] = '127.0.0.1:' + indexWebappConfig.port;
require('./lib/index-webapp/app.js');

console.log('Create proxy server');
var proxyServer = httpProxy.createServer({
  hostnameOnly:true,
  router:proxyRouter,
  enable:{
    xforward:true
  }
});

proxyServer.listen(config.proxyPort);
console.log('Proxy server listening to port :', config.proxyPort);

