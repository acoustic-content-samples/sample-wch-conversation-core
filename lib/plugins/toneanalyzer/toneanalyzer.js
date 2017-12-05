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

const {promisify} = require('util');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const {logging, env} = imports;
  const logger = logging('toneanalyzer');
  logger.methodEntry('setup', options, imports);

  let identifyTone;
  if (options.enabled) {
    let serviceName = options.serviceName || 'wch-toneanalyzer';
    let toneCreds = imports.env.getService(serviceName);
    let config = {
      url: toneCreds.credentials.url,
      username: toneCreds.credentials.username,
      password: toneCreds.credentials.password,
      version_date: options.version_date || '2016-05-19'
    };
    let toneanalyzerService = new ToneAnalyzerV3(config);
    identifyTone = function (message, conversationPayload) {
      logger.methodEntry('identifyTone', message, conversationPayload);
      let { text : msgText } = message;
      let { context } = conversationPayload;
      let lang = (context && context.outputlang) ? context.outputlang : options.defaultLanguage;
      return new Promise((resolve, reject) => {
        toneanalyzerService.tone({text: msgText, language: lang},
        (err, tone) => {
          if (err) {
            logger.debug('Error during tone analyzer %o', err);
            return reject(err)
          };
          let toneObjs = tone.document_tone.tone_categories.reduce((obj, category) => {
            let categoryTonesObj = category.tones.reduce((toneObjs, tone) => {
              toneObjs[tone.tone_name] = tone.score;
              return Object.assign({}, toneObjs);
            }, {});
            return Object.assign({}, obj, {[category.category_name]: categoryTonesObj});
          }, {});
          logger.methodExit('identifyTone', toneObjs);
          resolve({tone: toneObjs});
        });
      });
    };
  }
  else {
    identifyTone = () => Promise.resolve(null);
  }

  register(null, {
    toneanalyzer: {
      identify: identifyTone
    },
    toneanalyzerMiddleware: {
      before: identifyTone
    }
  });
  logger.methodExit('setup');
}
