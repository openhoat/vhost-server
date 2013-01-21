var path = require('path')
  , config = {
    serverName:'nodejs-server',
    nodeBinDir:path.dirname(process.execPath),
    nodeCmdName:'node',
    nodeAppRootPath:path.join(__dirname, '..'),
//    nodeAppUserUid:506,
    baseDomain:'labs.valtech-training.fr',
//    baseDomain:'localdomain',
//    proxyListenPort:3000,
//    proxyListenAddress: 'localhost',
//    proxyRealPort:80,
//    appsToScan:['wbpjs-todo','wbpjs-chat'],
    pidDir:'/var/run',
    logDir:'/var/log',
    plugins:{
      'mvc':{
        type:'mvc',
        config:{
          port:3099,
          renderFormats:['html'],
          locales:['en', 'fr']
        }
      }
    }
  };

module.exports = config;
