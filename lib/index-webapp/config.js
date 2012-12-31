var config = {
  verbose: false,
  plugins:{
    'wbpjs-mvc':{
      type:'wbpjs-mvc',
      config:{
        port: 3099,
        renderFormats:['html'],
        locales:['en', 'fr']
      }
    }
  }
};

module.exports = config;
