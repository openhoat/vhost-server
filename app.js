var wbp = require('wbpjs')
  , config = require(wbp.findAppFile('config.js'));

wbp.configure(config);

require(wbp.findAppFile('lib', 'vhost-proxy-server.js'));

wbp.start();
