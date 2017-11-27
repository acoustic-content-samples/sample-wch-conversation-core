'use strict';

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
  let {
    generalSettings = {credentialsStore: {}},
    conversationMiddleware = {},
    wchService = {},
    toneAnalyzerService = {},
    languageTranslationService = {},
    geolocationService = {}
  }  = configuration || {};
  const defaultLanguage = generalSettings.defaultLanguage || 'en';
  const credsPath = generalSettings.credentialsStore.path || './dch_vcap.json';
  const supportedLanguages = generalSettings.supportedLanguages || ['en', 'de'];
  const mainWorkspace = generalSettings.mainWorkspace || 'en';
  const convMidConf = conversationMiddleware.config || [
      {workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0',locale: 'en'},
      {workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0',locale: 'de'}
  ];
  const wchCaching = wchService.caching || true;
  const wchCachingTTL = wchService.ttl || 300;

  let architectConfig = [
    {
      packagePath: './lib/plugins/templating'
    },
    {
      packagePath: './lib/plugins/credentials'
    },
    {
      packagePath: './lib/plugins/env',
      credsPath: credsPath
    },
    {
      packagePath: './lib/plugins/geolocation',
      enabled: geolocationService.enabled ? true : false
    },
    {
      packagePath: './lib/plugins/languagetranslator',
      enabled: languageTranslationService.enabled ? true : false,
      defaultLanguage: defaultLanguage,
      supportedLanguages: supportedLanguages
    },
    {
      packagePath: './lib/plugins/toneanalyzer',
      enabled: toneAnalyzerService.enabled ? true : false,
      defaultLanguage: defaultLanguage
    },
    {
      packagePath: './lib/plugins/clienttype'
    },
    {
      packagePath: './lib/plugins/developeractions',
      modeDev: generalSettings.developermode ? true : false
    },
    {
      packagePath: './lib/plugins/conversationmiddleware',
      consumes: ['env', 'clientTypeMiddleware', 'geolocationMiddleware', 'toneanalyzerMiddleware', 'languageTranslatorMiddleware', 'developeractionsMiddleware'],
      middlewareConfigs: convMidConf
    },
    {
      packagePath: './lib/plugins/wch'
    },
    {
      packagePath: './lib/plugins/wchconversation',
      enableCache: wchCaching,
      ttl: wchCachingTTL
    },
    {
      packagePath: './lib/plugins/conversation',
      workspaceConfigs: convMidConf
    },
    {
      packagePath: './lib/plugins/wchsync',
      mainWorkspace: mainWorkspace
    }
  ];

  return architectConfig;
};
