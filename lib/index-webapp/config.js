var config = {
  verbose: false,
  plugins:{
    'wbpjs-mvc':{
      type:'wbpjs-mvc',
      config:{
        renderFormats:['html'],
        locales:['en', 'fr']
      }
    }
  }
};

module.exports = config;
