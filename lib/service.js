var config = {
  appPath:'/usr/local/nodejs/vhost-server/run.js',
  serverName:'nodejs-server',
  pidDir:'/var/run',
  logDir:'/var/log'
};

var path = require('path')
  , fs = require('fs')
  , daemon = require('simple-daemon');

daemon.simple({
  pidfile:path.join(config.pidDir, config.serverName + '.pid'),
  logfile:path.join(config.logDir, config.serverName + '.log'),
  command:process.argv[3],
  runSync:function () {
    require(config.appPath);
    process.setuid('node');
  }
});

