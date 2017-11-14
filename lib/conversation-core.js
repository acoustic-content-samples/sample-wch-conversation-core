'use strict';

const defaultLanguage = 'en';
const supportedLanguages = ['en', 'de'];
const credsPath = './dch_vcap.json'; // The path to your encrypted credentials file
const convMidConf = [
      {
        workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0',
        locale: 'en'
      },
      {
        workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0',
        locale: 'de'
      }];

module.exports = function setupConfig (configuration) {
  let architectConfig = [
    {
      packagePath: './plugins/templating'
    },
    {
      packagePath: './plugins/credentials'
    },
    {
      packagePath: './plugins/env',
      credsPath: credsPath
    },
    {
      packagePath: './plugins/geolocation'
    },
    {
      packagePath: './plugins/languagetranslator',
      enabled: true,
      defaultLanguage: defaultLanguage,
      supportedLanguages: supportedLanguages
    },
    {
      packagePath: './plugins/toneanalyzer',
      enabled: true,
      defaultLanguage: defaultLanguage
    },
    {
      packagePath: './plugins/clienttype'
    },
    {
      packagePath: './plugins/watsonconversation',
      consumes: ['env', 'clientTypeMiddleware', 'geolocationMiddleware', 'toneanalyzerMiddleware', 'languageTranslatorMiddleware'],
      middlewareConfigs: convMidConf
    }
  ];

  return architectConfig;
};
