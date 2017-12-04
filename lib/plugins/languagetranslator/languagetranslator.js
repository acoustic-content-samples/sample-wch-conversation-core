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

const LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const {logging, env} = imports;
  const logger = logging('languagetranslator');
  logger.methodEntry('setup', options, imports);

  let identifyLanguage;
  if (options.enabled) {
    let serviceName = options.serviceName || 'wch-languagetranslator';
    let languageCreds = env.getService(serviceName);
    let config = {
      url: languageCreds.credentials.url,
      username: languageCreds.credentials.username,
      password: languageCreds.credentials.password
    }
    let translationService = new LanguageTranslatorV2(config);
    identifyLanguage = function (message, conversationPayload) {
      logger.methodEntry('identifyLanguage', message, conversationPayload);
      let { text : msgText, type, locale } = message;
      let { context } = conversationPayload;
      return new Promise((resolve, reject) => {
        if(locale && context && context.setoutputlang) {
          logger.methodExit('identifyLanguage', locale.split('-')[0]);
          resolve({outputlang: locale.split('-')[0], setoutputlang: false});
        }
        else if (context && context.setoutputlang) {
          translationService.identify(
            {text: msgText},
            (err, language) => {
              if (err) {
                reject(err);
              }
              else if (language && language.languages && language.languages.length > 0
                && options.supportedLanguages.includes(language.languages[0].language)) {
                logger.methodExit('identifyLanguage', language.languages[0].language);
                resolve({outputlang: language.languages[0].language, setoutputlang: false});
              }
              else {
                logger.debug('Language not supported %o. Fallback to default language', language.languages[0].language);
                logger.methodExit('identifyLanguage', options.defaultLanguage);
                resolve({outputlang: options.defaultLanguage, setoutputlang: false});
              }
            }
          );
        }
        else if (context && context.outputlang) {
          logger.debug('Language already set to %s', context.outputlang);
          logger.methodExit('identifyLanguage', context.outputlang);
          resolve({outputlang: context.outputlang, setoutputlang: false});
        }
        else {
          logger.debug('No context yet! Set default: %s', options.defaultLanguage);
          logger.methodExit('identifyLanguage', options.defaultLanguage);
          resolve({outputlang: options.defaultLanguage, setoutputlang: false});
        }
      });
    };
  }
  else {
    identifyLanguage = () => Promise.resolve({outputlang: options.defaultLanguage, setoutputlang: false});
  }

  register(null, {
    languageTranslator: {
      identify: identifyLanguage
    },
    languageTranslatorMiddleware: {
      before: identifyLanguage
    }
  });
  logger.methodExit('setup');
}
