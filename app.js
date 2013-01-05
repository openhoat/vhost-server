var wbp = require('wbpjs')
  , config = wbp.requireAppFile('config');

wbp.configure(config);

wbp.requireAppFile('lib', 'vhost-proxy-server');

wbp.start();
