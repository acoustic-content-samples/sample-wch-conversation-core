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

const debug = require('debug')('conversation-core:watsonconversation');
const {promisify} = require('util');
const ConversationV1 = require('watson-developer-cloud/conversation/v1');
const botkitMiddleware = require('botkit-middleware-watson');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  let config = {};
  let serviceName = options.serviceName || 'wch-conversation';
  let conversationCreds = imports.env.getService(serviceName);
  let middlewareMap = new Map();
  let middlewareBefore = Object.keys(imports)
    .filter(key => key.endsWith('Middleware') && typeof imports[key].before === 'function')
    .map(key => imports[key]);
  let middlewareAfter = Object.keys(imports)
    .filter(key => key.endsWith('Middleware') && typeof imports[key].after === 'function')
    .map(key => imports[key]);

  if (!options.middlewareConfigs) {
    return;
  }

  options.middlewareConfigs
  .forEach(middlewareConfig => {
    let config = {
      workspace_id: middlewareConfig.workspaceId,
      url: conversationCreds.credentials.url,
      username: conversationCreds.credentials.username,
      password: conversationCreds.credentials.password,
      version_date: ConversationV1.VERSION_DATE_2017_04_21
    }
    let middleware =  botkitMiddleware(config);

    middleware.before = function (message, conversationPayload, callback) {
        debug('Before Conversation Middleware %s', JSON.stringify(conversationPayload));
        debug('Message %o', message);

        Promise.all(middlewareBefore.map(middleware => middleware.before(message, conversationPayload)))
        .catch(err => debug('Error Before: %o', err))
        .then(results => {
          debug('All Promises resolved!');
          let _conversationPayload = conversationPayload;

          results.forEach(result => {
            _conversationPayload.context = Object.assign({}, _conversationPayload.context, result);
          });

          debug('New Conversation Payload %o', _conversationPayload);
          callback(null, _conversationPayload);
        })
        .catch(err => debug('An Error occured in conversationmiddleware.before: %o', err));
      }

      middleware.after = function(message, conversationResponse, callback) {
        debug('After Conversation Middleware...');
        debug('Watson Data: %o', conversationResponse);

        Promise.all(middlewareAfter.map(middleware => middleware.after(message, conversationResponse)))
        .then(results => {
          callback(null, conversationResponse);
        })
        .catch(err => {
          debug('Error Before: %o', err);
          callback(null, conversationResponse);
        });

      }

    middlewareMap.set(middlewareConfig.locale, middleware);
  });

  register(null, {
    watsonconversation: middlewareMap
  });

}
