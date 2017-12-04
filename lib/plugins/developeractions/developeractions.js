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

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const {logging, wchsync} = imports;
  const logger = logging('developeractions');
  logger.methodEntry('setup', options, imports);

  let afterAction = function (message, conversationResponse) {
    logger.methodEntry('afterAction', message, conversationResponse);
    return new Promise((resolve, reject) => {
      try {
        logger.debug('!options.modeDev ', !options.modeDev);
        if(!options.modeDev) {
          return resolve(null);
        }
        logger.debug('Developmode enabled');
        let intent = conversationResponse.intents[0] || {};
        logger.debug('intent %o', intent);
        switch (intent.intent) {
            case 'pushwch':
            case 'pushwch_de':
              logger.debug('pushwch called');
              // Do push...
              wchsync.push({
                fromSys: 'WCS',
                toSys: 'WCH',
                type: 'force',
                elements: 'all'
              })
              .then(() => resolve(null))
              .catch(reject);
              break;
            default:
              logger.debug('Not a valid command %s', intent.intent);
              return resolve(null);
              break;
        }
      }
      catch (err) {
        logger.debug('Error in developeractions %o', err);
        reject(err);
      }
    })
    .then(value => logger.methodExit('afterAction', value));
  }

  register(null, {
    developeractions: {},
    developeractionsMiddleware: {
      after: afterAction
    }
  });
  logger.methodExit('setup');
}
