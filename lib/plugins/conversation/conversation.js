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

const ConversationV1 = require('watson-developer-cloud/conversation/v1');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup (options, imports, register) {
  const {env, logging} = imports;
  const logger = logging('conversation');
  logger.methodEntry('setup', options, imports);
  let serviceName = options.serviceName || 'wch-conversation';
  let conversationCreds = env.getService(serviceName);

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
      logger.methodEntry('getWorkspace');
      return new Promise((resolve, reject) => {
        conversation.getWorkspace({
          workspace_id: workspaceConfig.workspaceId, // eslint-disable-line camelcase
          export: true
        },
        (err, resp) => {
          if (err) {
            logger.debug('An error occured retrieving the workspace %o', err);
            reject(err);
          }
          logger.debug('Retrieved workspace');
          resolve(resp);
        });
      })
      .then(value => logger.methodExit('getWorkspace', value));
    }

    const getIntents = function () {
      logger.methodEntry('getIntents');
      return new Promise((resolve, reject) => {
        conversation.getIntents({
          workspace_id: workspaceConfig.workspaceId, // eslint-disable-line camelcase
          export: true
        },
        (err, resp) => {
          if (err) {
            logger.debug(err);
            reject(err);
          }
          logger.debug('Retrieved intents');
          resolve(resp);
        });
      })
      .then(value => logger.methodExit('getIntents', value));
    }

    const getEntities = function () {
      logger.methodEntry('getEntities');
      return new Promise((resolve, reject) => {
        conversation.getEntities({
          workspace_id: workspaceConfig.workspaceId, // eslint-disable-line camelcase
          export: true
        },
        (err, resp) => {
          if (err) {
            logger.debug('An error occured retrieving the entities ', err);
            reject(err);
          }
          logger.debug('Retrieved entities');
          resolve(resp);
        });
      })
      .then(value => logger.methodExit('getEntities', value));
    }

    const sendMessage = function ({message, context}) {
      logger.methodEntry('sendMessage');
      return new Promise((resolve, reject) => {
        conversation.message(
          {
            input: { text: message },
            workspace_id: workspaceConfig.workspaceId,
            context
          },
          (err, resp) => {
            if (err) {
              logger.debug('An error occured retrieving the entities ', err);
              reject(err);
            }
            if (resp.context && !resp.context.outputlang) {
              resp.context.outputlang = workspaceConfig.locale;
            }
            logger.debug('Retrieved Conversation Response');
            resolve(resp);
          });
      })
      .then(value => logger.methodExit('sendMessage', value));
    }

    let conversationInstance = {
      conversation,
      getIntents,
      getEntities,
      getWorkspace,
      sendMessage
    }

    conversationServiceMap.set(workspaceConfig.locale, conversationInstance);
  });

  logger.methodExit('setup', '');
  register(null, {
    conversation: conversationServiceMap
  });

}
