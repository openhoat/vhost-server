/**
 * Pre requisite : npm install -g simple-daemon
 */

var path = require('path')
  , daemon = require('simple-daemon')
  , config = require(path.join(__dirname, '..', 'config.js'));

daemon.simple({
  pidfile:path.join(config.pidDir, config.serverName + '.pid'),
  logfile:path.join(config.logDir, config.serverName + '.log'),
  command:process.argv[2],
  runSync:function () {
    try {
      process.setuid('node');
    } catch (err) {
      console.log('Error :', err);
    }
    require(path.join(__dirname, '..', 'app.js'));
  }
});

