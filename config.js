var path = require('path')
  , config = {
    serverName:'nodejs-server',
    nodeBinDir:path.dirname(process.execPath),
    nodeCmdName:'node',
    nodeAppRootPath:path.join(__dirname, '..'),
    baseDomain:'labs.valtech-training.fr',
//    proxyListenPort:3000,
//    proxyListenAddress: 'localhost',
//    proxyRealPort:80,
//    appsToScan:['wbpjs-todo'],
    pidDir:'/var/run',
    logDir:'/var/log',
    plugins:{
      'wbpjs-mvc':{
        type:'wbpjs-mvc',
        config:{
          port:3099,
          renderFormats:['html'],
          locales:['en', 'fr']
        }
      }
    }
  };

module.exports = config;
