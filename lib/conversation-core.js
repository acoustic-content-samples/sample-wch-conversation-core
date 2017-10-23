'use strict';

module.exports = function setupConfig (configuration) {
  let architectConfig = [
    {
      packagePath: './plugins/geolocation'
    },
    {
      packagePath: './plugins/languagetranslator'
    },
    {
      packagePath: './plugins/toneanalyzer'
    },
    {
      packagePath: './plugins/watsonconversation'
    }
  ];

  return architectConfig;
};
