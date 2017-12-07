/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

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
  const mainWorkspace = generalSettings.defaultLanguage || 'en';
  const convMidConf = conversationMiddleware.config || [
      {workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0',locale: 'en'},
      {workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0',locale: 'de'}
  ];
  const wchCaching = wchService.caching || true;
  const wchCachingTTL = wchService.ttl || 300;

  let architectConfig = [
    {
      packagePath: './lib/plugins/logging',
      packageName: 'conversation-core',
      toFile: generalSettings.debugToFile
    },
    {
      packagePath: './lib/plugins/templating'
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
      consumes: ['env', 'logging', 'clientTypeMiddleware', 'geolocationMiddleware', 'toneanalyzerMiddleware', 'languageTranslatorMiddleware', 'developeractionsMiddleware'],
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

  if (process.env['BX_CREDS'] === 'true') {
    architectConfig.push({
      packagePath: './lib/plugins/credentialsbluemix'
    });
  }
  else {
    architectConfig.push({
      packagePath: './lib/plugins/credentials'
    });
  }

  return architectConfig;
};
