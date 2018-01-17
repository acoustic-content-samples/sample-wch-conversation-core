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

'use strict'

const crypto = require('crypto');
const fs = require('fs');
const arrayutils = require('./utils/arrayutils');
const NodeCache = require('node-cache');

/**
 * Method to generate a hash key for the current message state.
 * TODO: For improvement it would be better to filter out irrelevant stuff from the context
 * instead of the current approach of including the elements.
 *
 * @param  {Object} watsonData     The response from the conversation service
 * @param  {String} hashType       The hash method to use. Default type is 'md5'.
 * @param  {String} digestEncoding Encoding to use for the hash. Default is 'base64'.
 * @return {Promise}               When the Promise resolves the hash value as a String is returned.
 */
const generateMD5Key = function (watsonData, hashType, digestEncoding) {
  let {intents, entities, output, context} = watsonData;
  let generalContext = {
    clienttype: context.clienttype,
    wchid: context.wchid,
    username: context.username,
    outputlang: context.outputlang,
    chatbotpersona: context.chatbotpersona,
    askedContactDetails: context.askedContactDetails,
    lastIntent: context.lastIntent,
    nodename: context.nodename,
    setoutputlang: context.setoutputlang
  };

  let _encoding = digestEncoding || 'base64';
  let _hashType = (crypto.getHashes().indexOf(hashType) > -1) ? hashType : 'md5';
  return new Promise((resolve, reject) => {
    try {
      let hash = crypto.createHash(_hashType)
        .update(JSON.stringify({
          intents,
          entities,
          output,
          generalContext
        }), 'utf8')
      .digest(_encoding);
      resolve(hash);
    }
    catch (err) {
      throw new Error('Hash creation failed');
    }
  });
}

/**
 * Method used to filter down for the best search results from WCH. Therefore
 * we first filter for all documents with the highest scoring & afterwards take the most
 * unspecific answer to the question.
 * @param  {Object} searchresult The answer from WCH based on the search query
 * @return {Promise}             When the Promise resolves the filteretd list of searchresults is returned.
 */
const cleanupAndShuffleResults = function (searchresult) {
  return new Promise((resolve, reject) => {
    let {numFound, documents} = searchresult;
    if (numFound > 1) {
      // The highest store is the first element
      let highestScore = documents[0].score;
      let minCount = 9999999;
      let filtered = documents
        .filter(ele => ele.score === highestScore)
        .map(ele => {
          // All elements have the same score now. Filter for content items
          // with the smallest amount of filter categories since that's the
          // most unspecific one...
          let { document: { elements: { filter } } } = ele;
          let length = (filter && filter.categories) ? filter.categories.length : 0;
          if (length < minCount) {
            minCount = length;
          }
          return {origin: ele, transf: length};
        })
        .filter(x => x.transf === minCount)
        .map(ele => ele.origin);

      arrayutils.shuffle(filtered);
      searchresult.documents = filtered;
    }
    resolve(searchresult);
  });
}

/**
 * Searches for location specifc content in WCH to the current conversational state.
 * @param  {Object} watsonData The response from the conversation service
 * @return {Promise}           When the promise resolves the enriched search result from WCH is returned.
 */
const processLocationResponse = function (watsonData, templating, wchDelivery, wchHostUrl, logger, defaultLocale) {
  return new Promise((resolve, reject) => {
    let { context, output, intents, entities, context: {nodename}, output: {required = []} } = watsonData;

    if (!context.geolocation || !context.geolocation.lat || !context.geolocation.lng) {
      logger.debug('No Location yet.');
      return resolve({searchResult: {numFound: 0, documents: []}});
    }

    let filterNodename =  (nodename)?`"${nodename}"^20`:'';

    let requiredEntities = required.reduce((resarry, reqEntitiy) => {
      let entiyValues = entities[reqEntitiy] ? entities[reqEntitiy] : context[reqEntitiy];
      return (entiyValues) ? resarry.concat(entiyValues.map(entity => (`+"${entity.value}"`))) : resarry;
    }, []);

    let optionalEntities = entities
      .filter(entity => !required.includes(entity.entity))
      .map(entity => `"${entity.value}"^10`);

    let operator = (requiredEntities.length > 0)? 'AND' : 'OR';
    let queryEntities = requiredEntities.concat(optionalEntities);
    queryEntities.push(`"${context.chatbotpersona}"^30`); // Persona
    let queryParams = {
      query: `classification:content ${operator} categoryLeaves:(${queryEntities.join(' ')} ${filterNodename})`,
      facetquery: [
        `categoryLeaves:("${output.nodes_visited[output.nodes_visited.length-1]}")`,  // Current Conversation Node
        `locale:"${context.outputlang || defaultLocale}"`
      ],
      spacialsearch: {
        position: context.geolocation,
        distance: 5,
        sort: 'desc'
      },
      fields: ['id', 'name', 'document:[json], score']
    };
    logger.debug('processLocationResponse QueryParams %o', queryParams);
    wchDelivery.search
      .query(queryParams)
      .catch(reject)
      .then(cleanupAndShuffleResults)
      .catch(reject)
      .then(searchResult => templating.parseJSON(watsonData, searchResult))
      .catch(reject)
      .then(searchRes => processAttachments(searchRes, wchDelivery, wchHostUrl, logger))
      .catch(reject)
      .then(respSet => templating.parseJSON(watsonData, respSet))
      .catch(reject)
      .then(resolve);
  });
}

/**
 * Fetches the list of possible responses from WCH based on the current dialog state.
 * @param  {Object} watsonData The response from the conversation service
 * @return {Promise}           When the promise resolves the enriched search result from WCH is returned.
 */
const processConversationResponse = function (watsonData, templating, wchDelivery, wchHostUrl, logger, defaultLocale) {
  logger.methodEntry('processConversationResponse', watsonData, templating, wchDelivery, wchHostUrl);
  return new Promise((resolve, reject) => {
    let { context, output, intents, entities, context: {nodename}, output: {required = []} } = watsonData;

    let filterNodename =  (nodename)?`"${nodename}"^20`:'';
    logger.debug('Required entities %o', required);
    logger.debug('Entities %o', entities);
    let requiredEntities = required.reduce((resarry, reqEntitiy) => {

      let entityValues = entities.filter(ele => ele.entity === reqEntitiy);
      if(entityValues.length === 0) {
        // TODO: Check if typeof context[reqEntitiy] === 'String'
        // Then create the array manually
        entityValues = context[reqEntitiy] || [];
      }
      logger.debug('Required entities for entitiy %s %o', reqEntitiy, entityValues);
      logger.debug('entities[reqEntitiy] %o', entities.filter(ele => ele.entity === reqEntitiy));
      logger.debug('context[reqEntitiy] %o', context[reqEntitiy]);
      return (entityValues) ? resarry.concat(entityValues.map(entity => (`+"${entity.value}"`))) : resarry;
    }, []);

    let optionalEntities = entities
      .filter(entity => !required.includes(entity.entity))
      .map(entity => `"${entity.value}"^10`);

    let operator = (requiredEntities.length > 0) ? 'AND' : 'OR';
    let queryEntities = requiredEntities.concat(optionalEntities);
    queryEntities.push(`"${context.chatbotpersona}"^2`); // Persona
    let queryParams = {
      query: `classification:content ${operator} categoryLeaves:(${queryEntities.join(' ')} ${filterNodename})`,
      facetquery: [
        `categoryLeaves:("${output.nodes_visited[output.nodes_visited.length-1]}")`,  // Current Conversation Node
        '-locations:*', // Exclude location specific items
        `locale:"${context.outputlang || defaultLocale}"`
      ],
      fields: ['id', 'name', 'document:[json], score']
    };
    logger.debug('processConversationResponse QueryParams %o', queryParams);
    wchDelivery.search
      .query(queryParams)
      .catch(reject)
      .then(cleanupAndShuffleResults)
      .catch(reject)
      .then(searchRes => processAttachments(searchRes, wchDelivery, wchHostUrl, logger))
      .catch(reject)
      .then(respSet => templating.parseJSON(watsonData, respSet))
      .catch(reject)
      .then(value => logger.methodExit('processConversationResponse', value))
      .then(resolve);
  });
}

/**
 * In case a follow up action was defined fetch it from WCH.
 * @param  {Object} watsonData The response from the conversation service
 * @return {Promise}           When the promise resolves the enriched search result from WCH is returned.
 */
const processFollowUpResponse = function (watsonData, templating, wchDelivery, wchHostUrl, logger, defaultLocale) {
  logger.methodEntry('processFollowUpResponse', watsonData, templating, wchDelivery, wchHostUrl);
  return new Promise((resolve, reject) => {
    let { context, output, intents, entities, output: {required = []} } = watsonData;

    if (!output.action) {return resolve()};

    let queryEntities = [`"${context.chatbotpersona}"^30`, `+"${output.action}"`];

    let queryParams = {
      query: `classification:content AND categoryLeaves:(${queryEntities.join(' ')})`,
      facetquery: [
        `locale:"${context.outputlang || defaultLocale}"`
      ],
      fields: ['id', 'name', 'document:[json], score']
    };
    logger.debug('processFollowUpResponse QueryParams %o', queryParams);
    wchDelivery
      .search
      .query(queryParams)
      .catch(reject)
      .then(searchRes => processAttachments(searchRes, wchDelivery, wchHostUrl, logger))
      .catch(reject)
      .then(respSet => templating.parseJSON(watsonData, respSet))
      .catch(reject)
      .then(resolve);
  })
    .then(value => logger.methodExit('processFollowUpResponse', value));
}

const processActionButton = function (attachmentButton, wchDelivery, wchHostUrl) {
  return new Promise((resolve, reject) => {
    wchDelivery.send({
        baseUrl: wchHostUrl,
        uri: attachmentButton.url
      })
      .then(attachmentResult => resolve(attachmentResult))
      .catch(reject);
  });
}

const processAttachment = function (attachment, wchDelivery, wchHostUrl, logger) {
  logger.methodEntry('processAttachment', attachment, wchDelivery, wchHostUrl);
  return new Promise((resolve, reject) => {
    wchDelivery.send({
      baseUrl: wchHostUrl,
      uri: attachment.url
    })
    .catch(reject)
    .then(attachmentResult => {
      return new Promise((resolve, reject) => {
        if (attachmentResult.elements.quickreplies
          && attachmentResult.elements.quickreplies.values
          && attachmentResult.elements.quickreplies.values.length > 0) {
          let actionButtonPromises = attachmentResult.elements.quickreplies.values.map(value => processActionButton(value, wchDelivery, wchHostUrl));

          Promise.all(actionButtonPromises)
          .catch(reject)
          .then(actionButtons => {
            logger.debug('actionButtons %o', actionButtons);
            attachmentResult.elements.quickreplies.values = actionButtons;
            resolve(attachmentResult);
          });
        }
        else {
          resolve(attachmentResult);
        }
      });
    })
    .then(attachmentResult => resolve({id: attachmentResult.id, name: attachmentResult.name, document: attachmentResult}));
  })
  .then(value => logger.methodExit('processAttachment', value));
}

const processAttachments = function (searchResult, wchDelivery, wchHostUrl, logger) {
  logger.methodEntry('processAttachments', searchResult, wchDelivery, wchHostUrl);
  return new Promise((resolve, reject) => {
    let { numFound, documents } = searchResult;
    if ( numFound > 0
      && documents[0].document.elements.attachments
      && documents[0].document.elements.attachments.value === true) {
      let {attachmentquery: { value: filterQuery }, attachment: { values: attachments = {} } = {} } = documents[0].document.elements;
      logger.debug('attachments %o', attachments)
      if (attachments.length > 0) {
        let attachmentsPromises = attachments.map(value => processAttachment(value, wchDelivery, wchHostUrl, logger));

        Promise.all(attachmentsPromises)
        .catch(reject)
        .then(attachments => {
          let attachmentsResult = {numFound: attachments.length, documents: attachments};
          resolve({searchResult, attachmentsResult});
        });
      }
      else if (filterQuery) {
        let attachmentsQuery = {
          query: `classification:content AND type:ChatAttachment AND ${filterQuery}`,
          fields: ['id', 'name', 'document:[json]']
        }

        logger.debug('attachmentsQuery %o', attachmentsQuery)
        wchDelivery.search
        .query(attachmentsQuery)
        .catch(reject)
        .then(attachmentsResult => {
          resolve({searchResult, attachmentsResult});
        });
      }
      else {
        resolve({searchResult});
      }
    }
    else {
      resolve({searchResult});
    }
  })
  .then(value => logger.methodExit('processAttachments', value));
}

/**
 * Public Class to get the best response for a current Watson Conversation Service state. Content is retrieved
 * trough a dynamic search against Watson Content Hub.
 */
class WchConversationV1 {
  constructor(templating, wchDelivery, wchHostUrl, {enabled, ttl, logging, defaultLocale='en'}) {
    this.wchResultSetCache = new NodeCache({stdTTL: ttl}); // 5 Minutes of Caching...
    this.setCache = (enabled) ? (key, value) => this.wchResultSetCache.set(key, value) : () => true;
    this.templating = templating;
    this.wchDelivery = wchDelivery;
    this.wchHostUrl = wchHostUrl;
    this.logger = logging('wchconversationV1');
    this.defaultLocale = defaultLocale;
  };

  getWchConversationResponses(watsonData) {
    this.logger.methodEntry('getWchConversationResponses', watsonData);
    return new Promise((resolve, reject) => {
      let startTime = Date.now();

      generateMD5Key(watsonData)
        .then(hashKey => {
          this.logger.debug('Hash %s', hashKey);
          let cachedResultSet = this.wchResultSetCache.get(hashKey);
          if (!cachedResultSet) {
            return {hashKey};
          }
          let {
            conversationResp : {searchResult: convRes = {}} = {},
            locationResp : {searchResult: locRes = {}} = {},
            followupResp : {searchResult: folRes = {}} = {}
          } = cachedResultSet;

          if (convRes.documents) {
            arrayutils.shuffle(convRes.documents);
          }
          if (locRes.documents) {
            arrayutils.shuffle(locRes.documents);
          }
          if (folRes.documents) {
            arrayutils.shuffle(folRes.documents);
          }

          this.logger.debug('cachedResultSet %o', cachedResultSet);
          return {hashKey, cachedResultSet};
        })
        .then(({hashKey, cachedResultSet}) => {
          if (cachedResultSet) {
            return cachedResultSet;
          }

          return Promise.all([
            processLocationResponse(watsonData, this.templating, this.wchDelivery, this.wchHostUrl, this.logger, this.defaultLocale),
            processConversationResponse(watsonData, this.templating, this.wchDelivery, this.wchHostUrl,this.logger, this.defaultLocale),
            processFollowUpResponse(watsonData, this.templating, this.wchDelivery, this.wchHostUrl, this.logger, this.defaultLocale)
          ])
            .then(([locationResp, conversationResp, followupResp]) => {
              this.setCache(hashKey, {locationResp, conversationResp, followupResp});
              return {locationResp, conversationResp, followupResp};
            })
            .catch(reject);
        })
        .then(value => {
          this.logger.debug('WchConversationTime in ms: %s', (Date.now()-startTime));
          this.logger.methodExit('getWchConversationResponses', value);
          resolve(value);
        })
        .catch(err => reject(err));
    });
  }

}

module.exports = WchConversationV1;
