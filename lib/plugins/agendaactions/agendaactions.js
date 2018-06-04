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
const moment = require('moment-timezone');

module.exports = function setup(options, imports, register) {
  const {logging, wch} = imports;
  let wchDelivery = wch.delivery;
  const logger = logging('agendaactions');
  logger.methodEntry('setup', options, imports);

  let afterAction = function (message, conversationResponse) {
    logger.methodEntry('afterAction', message, conversationResponse);
    return new Promise((resolve, reject) => {
      try {
        let {actions=[]} = conversationResponse;
        let action = actions[0] || {};
        logger.debug('action %o', action);
        let {name: actionName, type: actionType, parameters: actionParams, result_variable: actionReturnVar} = action;

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
              let title = "";
              if (result.numFound > 0) {
                const document = result.documents[0].document;
                const {titel: titelEle, abstract: abstrEle} = document.elements;
                title = (titelEle && titelEle.value) ? titelEle.value : '';
                if (abstrEle && abstrEle.value) {
                  abstract = sanitizeHtml(abstrEle.value, {allowedTags: [], parser: {
                    decodeEntities: true
                  }}).replace(/\n/gmi, "\\n").toString('utf-8');
                }
              }
              resolve({[actionReturnVar]: {title, abstract}});
            });
        }
        else if (actionType === 'client' && actionName === 'GetTimeSlot') {
          let isoDate;
          if (actionParams.date && actionParams.date.length > 0 && actionParams.time && actionParams.time.length > 0) {
            isoDate = moment.tz(`${actionParams.date[0].value}T${actionParams.time[0].value}`, "Europe/Berlin").toISOString();
          }
          else if (actionParams.time && actionParams.time.length > 0) {
            isoDate =  moment.tz(`2018-06-05T${actionParams.time[0].value}`, "Europe/Berlin").toISOString();
          }
          else {
            const date = new Date();
            date.setDay(6);
            date.setMonth(5);
            isoDate = date.toISOString();
          }
          logger.debug("Input Time %s", actionParams.time[0].value);
          logger.debug("ISO Date %s", isoDate);
          let queryParams = {
            query: `classification:content AND type:Session`,
            facetquery: [
              `locale:"${conversationResponse.context.outputlang || options.defaultLocale}"`,
              `{!frange l=${isoDate}-1DAY/DAY u=${isoDate}}sortableDate1`,
              `{!frange l=${isoDate} u=${isoDate}+1DAY/DAY}sortableDate2`
            ],
            fields: ['id', 'name', 'document:[json]', 'sortableDate1', 'sortableDate2', 'score']
          };
          logger.debug("queryParams %o", queryParams);

          wchDelivery.search.query(queryParams)
            .then(result => {
              let titles = [];
              if (result.numFound > 0) {
                titles = result.documents.map(ele => {
                  const {id, document, sortableDate1: fromDate, sortableDate2: toDate} = ele;
                  const {titel: titelEle} = document.elements;
                  const title = (titelEle && titelEle.value) ? titelEle.value : '';
                  const fromTime = moment.tz(fromDate, "Europe/Berlin").format('HH:mm');
                  const toTime = moment.tz(toDate, "Europe/Berlin").format('HH:mm');
                  return {id, title, fromTime, toTime};
                });
              }
              resolve({[actionReturnVar]: [...titles]});
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
