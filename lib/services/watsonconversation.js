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

/* eslint camelcase: 0 */
'use strict';

const debug = require('debug')('conversation-core:watsonconversation');
const ConversationMiddleware = require('botkit-middleware-watson');

class WatsonConversation {
  constructor({plugins = []}) {
    this.plugins = plugins;
  }


}

function initMiddleware ({configuration, beforeMiddleware, afterMiddleware}) {
  let middleware =  ConversationMiddleware(configuration);

  middleware.before = function (message, conversationPayload, callback) {
    debug('Before Conversation Middleware %s', JSON.stringify(conversationPayload));
    debug('Message %o', message);

    let { text, type, locale } = message;
    let { context } = conversationPayload;

    Promise.all([
      identifyClientType(type),
      identifyLanguage(text, locale, context),
      identifyTone(text, context),
      identifyGeolocation(text, context)
    ])
    .catch(err => debug('Error Before: %o', err))
    .then(([clientTypeObj, languageObj, toneObj, geolocationObj]) => {
      debug("All Promises resolved!");
      debug('languageObj %o', languageObj);

      let _conversationPayload = Object.assign({}, conversationPayload);

      _conversationPayload.context = Object.assign(
        {},
        _conversationPayload.context,
        {
          clienttype: clientTypeObj,
          outputlang: languageObj,
          setoutputlang: languageObj ? false : true,
          tone: toneObj,
          geolocation: geolocationObj
        }
      )
      debug('_conversationPayload %o', _conversationPayload);
      callback(null, _conversationPayload);
    })
    .catch(err => debug('An Error occured in conversationmoddleware before. %o', err));
  }

  middleware.after = function(message, conversationResponse, callback) {
    debug('After Conversation Middleware...');
    debug('Watson Data: %o', conversationResponse);

    // If your want to trigger actions based on the conversation response do it here...

    if (modeDev) {
      debug('Developmode enabled');
      let intent = conversationResponse.intents[0] || {};
      debug('intent %o', intent);
      switch (intent.intent) {
          case 'pushwch':
          case 'pushwch_de':
            debug('pushwch called');
            // Do push...
            syncService.push({
              fromSys: syncService.WCS,
              toSys: syncService.WCH,
              type: 'force',
              elements: 'all',
            })
            .catch(err => debug('An Error Occured %o', err))
            .then(() => callback(null, conversationResponse));
            break;
          default:
            debug('Not a valid command %s', intent.intent);
            return callback(null, conversationResponse);
            break;
      }
    }
    else {
      return callback(null, conversationResponse);
    }
  }


}

module.exports = conversation;
