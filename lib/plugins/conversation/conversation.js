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

const debug = require('debug')('conversation-core:conversation');
const ConversationV1 = require('watson-developer-cloud/conversation/v1');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup (options, imports, register) {
  let serviceName = options.serviceName || 'wch-conversation';
  let conversationCreds = imports.env.getService(serviceName);

  let conversationServiceMap = new Map();
  options.workspaceConfigs.forEach(workspaceConfig => {
    let conversation = new ConversationV1({
      workspace_id: workspaceConfig.workspaceId,
      url: conversationCreds.credentials.url,
      username: conversationCreds.credentials.username,
      password: conversationCreds.credentials.password,
      version_date: ConversationV1.VERSION_DATE_2017_04_21
    });

    const getWorkspace = function () {
      debug('Retrieving workspace');
      return new Promise((res, rej) => {
        conversation.getWorkspace({
          workspace_id: workspaceConfig.workspaceId, // eslint-disable-line camelcase
          export: true
        },
        (err, resp) => {
          if (err) {
            debug('An error occured retrieving the workspace %o', err);
            rej(err);
          }
          debug('Retrieved workspace');
          res(resp);
        });
      });
    }

    const getIntents = function () {
      debug('Retrieving intents');
      return new Promise((res, rej) => {
        conversation.getIntents({
          workspace_id: workspaceConfig.workspaceId, // eslint-disable-line camelcase
          export: true
        },
        (err, resp) => {
          if (err) {
            debug(err);
            rej(err);
          }
          debug('Retrieved intents');
          res(resp);
        });
      });
    }

    const getEntities = function () {
      debug('Retrieving entities');
      return new Promise((res, rej) => {
        conversation.getEntities({
          workspace_id: workspaceConfig.workspaceId, // eslint-disable-line camelcase
          export: true
        },
        (err, resp) => {
          if (err) {
            debug('An error occured retrieving the entities ', err);
            rej(err);
          }
          debug('Retrieved entities');
          res(resp);
        });
      });
    }

    let conversationInstance = {
      conversation,
      getIntents,
      getEntities,
      getWorkspace
    }

    conversationServiceMap.set(workspaceConfig.locale, conversationInstance);
  });

  register(null, {
    conversation: conversationServiceMap
  });

}
