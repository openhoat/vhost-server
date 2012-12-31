var wbp = require('wbpjs')
  , config = wbp.config
  , webapps = require(wbp.findAppFile('models','webapps.js'))
  , mvcPlugin = wbp.findPlugin('wbpjs-mvc')
  , viewsPlugin = mvcPlugin.viewsPlugin;

module.exports = {
  index:function (req, res) {
    viewsPlugin.render(res, function (type) {
      var view = viewsPlugin.getWebView(req, 'main/index', type);
      res.render(view, { webapps: webapps });
    });
  }
};