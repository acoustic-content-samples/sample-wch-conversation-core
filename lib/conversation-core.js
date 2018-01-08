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
    generalSettings = {},
    conversationMiddleware = {},
    wchService = {},
    toneAnalyzerService = {},
    languageTranslationService = {},
    geolocationService = {}
  }  = configuration || {};

  let {
    defaultLanguage = 'en',
    supportedLanguages = ['en', 'de'],
    credentialsStore: {
      encrypted: credsEncrypted,
      path: credsPath = './dch_vcap.json',
      pathPrivKey
    } = {},
    debugToFile,
    developermode
  } = generalSettings;

  let {
    caching: wchCaching,
    ttl: wchCachingTTL = 300,
    enabled: wchEnabled = false
  } = wchService;

  let {
    serviceName: convServiceName,
    config: convMidConf = [{workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0', locale: 'en'}, {workspaceId: '9db75ce4-a059-4f53-988d-de239eed10a0', locale: 'de'}]
  } = conversationMiddleware;

  const mainWorkspace = defaultLanguage;

  let conversationmiddlewareConsumes = ['env', 'logging', 'clientTypeMiddleware', 'geolocationMiddleware', 'toneanalyzerMiddleware', 'languageTranslatorMiddleware'];

  let architectConfig = [
    {
      packagePath: './lib/plugins/logging',
      packageName: 'conversation-core',
      toFile: debugToFile
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
    }
  ];

  if (wchEnabled) {
    const wchPlugins = [{
      packagePath: './lib/plugins/wch'
    },
    {
      packagePath: './lib/plugins/wchconversation',
      enableCache: wchCaching,
      ttl: wchCachingTTL
    },
    {
      packagePath: './lib/plugins/conversation',
      workspaceConfigs: convMidConf,
      serviceName: convServiceName
    },
    {
      packagePath: './lib/plugins/wchsync',
      mainWorkspace: mainWorkspace
    },
    {
      packagePath: './lib/plugins/developeractions',
      modeDev: developermode ? true : false
    }];

    conversationmiddlewareConsumes.push('developeractionsMiddleware');
    architectConfig = architectConfig.concat(wchPlugins);
  }

  architectConfig.push({
    packagePath: './lib/plugins/conversationmiddleware',
    consumes: conversationmiddlewareConsumes,
    middlewareConfigs: convMidConf,
    serviceName: convServiceName
  })

  if (process.env.BX_CREDS === 'true') {
    architectConfig.push({
      packagePath: './lib/plugins/credentialsbluemix'
    });
  }
  else {
    architectConfig.push({
      packagePath: './lib/plugins/credentials',
      encrypted: credsEncrypted
    });
  }

  return architectConfig;
};
