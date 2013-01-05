var wbp = require('wbpjs')
  , webapps = require(wbp.findAppFile('models','webapps.js'));

module.exports = {
  index:function (req, res) {
    wbp.render(res, function (type) {
      var view = wbp.getWebView(req, 'main/index', type);
      res.render(view, { webapps: webapps });
    });
  }
};