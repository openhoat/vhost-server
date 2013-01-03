var path = require('path')
  , fs = require('fs');

var util = {
  findApps:function (nodeAppRootPath) {
    var result = []
      , appDirs = fs.readdirSync(nodeAppRootPath);
    for (var i = 0; i < appDirs.length; i++) {
      var appName = appDirs[i]
        , appDir = path.join(nodeAppRootPath, appName)
        , stats = fs.lstatSync(appDir);
      if (stats.isDirectory() && util.findAppFile(appDir) !== null) {
        result.push(appName);
      }
    }
    return result;
  },
  findAppFile:function (pathname) {
    var preferredFiles = ['index.js', 'app.js'];
    for (var i = 0; i < preferredFiles.length; i++) {
      var preferredFile = preferredFiles[i]
        , file = path.join(pathname, preferredFile);
      if (fs.existsSync(file)) {
        return file;
      }
    }
    return null;
  },
  getAppPort:function (appConfig) {
    var result;
    if (appConfig.plugins !== undefined && appConfig.plugins['wbpjs-mvc'] !== undefined) {
      result = appConfig.plugins['wbpjs-mvc'].config.port;
    } else {
      result = appConfig.port;
    }
    return result;
  }
}

module.exports = util;
