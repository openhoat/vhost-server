var wbp = require('wbpjs')
  , config = wbp.config
  , webapps = require(config.baseDir + '/models/webapps.js');;

module.exports = {
  index:function (req, res) {
    wbp.render(res, function (type) {
      var view = wbp.getWebView(req, 'main/index', type);
      res.render(view, { webapps: webapps });
    });
  }
};