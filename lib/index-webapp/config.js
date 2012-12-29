var path = require('path')
  , baseDir = path.join(__dirname, '../..');

// Feel free to match your settings
var config = {
  port:3099,
  baseDir:baseDir,
  controllersDir:path.join(baseDir, 'controllers'),
  viewsDir:path.join(baseDir, 'views'),
  lesscssDir:path.join(baseDir, 'lesscss'),
  publicDir:path.join(baseDir, 'public'),
  cssDir:path.join(baseDir, 'public', 'css'),
  mobileViewSufix:null,
  renderFormats:['html'],
  locales:['en', 'fr'],
  persistence:{ type:'mock' },
  options:{
    verbose:false
  }
};

module.exports = config;
