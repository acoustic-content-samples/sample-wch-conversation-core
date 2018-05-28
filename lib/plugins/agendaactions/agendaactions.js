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
const sanitizeHtml = require('sanitize-html');

module.exports = function setup(options, imports, register) {
  const {logging, wch} = imports;
  let wchDelivery = wch.delivery;
  const logger = logging('agendaactions');
  logger.methodEntry('setup', options, imports);

  let afterAction = function (message, conversationResponse) {
    logger.methodEntry('afterAction', message, conversationResponse);
    return new Promise((resolve, reject) => {
      try {
        let action = conversationResponse.actions[0] || {};
        logger.debug('action %o', action);
        let {name: actionName, type: actionType, result_variable: actionReturnVar} = action;
        if (actionType === 'client' && actionName === 'GetSessionContent') {
          const {entities} = conversationResponse;
          const queryEntities = entities
            .filter(ele => ele.entity === 'mtlagenda2018')
            .map(ele => `+"${ele.value}"`);

          let queryParams = {
            query: `classification:content AND type:Session AND categoryLeaves:(${queryEntities.join(' ')})`,
            facetquery: [
              `locale:"${conversationResponse.context.outputlang || options.defaultLocale}"`
            ],
            fields: ['id', 'name', 'document:[json], score']
          };

          wchDelivery.search.query(queryParams)
            .then(result => {
              let abstract = "";
              if (result.numFound > 0) {
                const document = result.documents[0].document;
                const abstrEle = document.elements.abstract;
                if (abstrEle && abstrEle.value) {
                  abstract = JSON.stringify(sanitizeHtml(abstrEle.value, {allowedTags: []}));
                }
              }
              resolve({[actionReturnVar]: {abstract}});
            });
        }
        else {
          resolve (null);
        }
      }
      catch (err) {
        logger.debug('Error in agendaactions %o', err);
        reject(err);
      }
    })
      .then(value => logger.methodExit('afterAction', value));
  }

  register(null, {
    agendaactions: {},
    agendaactionsMiddleware: {
      after: afterAction
    }
  });
  logger.methodExit('setup');
}
