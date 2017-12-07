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
const {join} = require('path');
const {createApp, resolveConfig} = require('architect');
const createAppAsync = promisify(createApp);
const resolveConfigAsync = promisify(resolveConfig);
const appSettings = require('./app_settings');
const architectConfig = require('./lib/conversation-core')(appSettings);

  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: %o reason: %s', p, reason);
  });

resolveConfigAsync(architectConfig, __dirname)
.then(createAppAsync)
.then(app => {

  let initialContext = {
    clientType: 'slack',
    outputlang: '',
    setoutputlang: true,
    conversation_id: 'a2a7ea69-1452-4bb6-b1c2-a7506d639cc5',
    wchid: '62cb7faa-0773-47e5-848e-4e660c4f3e5a',
    counters: [],
    gotfunky: false,
    username: '',
    chatbotpersona: 'mrwatson',
    askedContactDetails: false,
    nodename: 'Response First Welcome',
    lastIntent: 'welcome'
  }

  let bot =  {
    type: 'slack',
    botkit: {
      storage: {
        users: {
          get: (userId, cb) => {cb(null, {context: initialContext})},
          save: (user_data, cb) => {initialContext = user_data.context; cb();}
        }
      }
    }
  };

  let message = {
    type: 'message',
    channel: 'D5BG9R0VD',
    user: 'W4081DWRF',
    text: 'Hallo',
    ts: '1508942774.000657',
    source_team: 'T02J3DPUE',
    team: 'T02J3DPUE',
    event: 'direct_message',
    match: [ 'Hello', {index: 0}, {input: 'Hello'} ]
  };

  // app.getService('conversation').get('en').getWorkspace();

  app.getService('conversationmiddleware').get('en').interpret(bot, message, () => {
    app.getService('conversationmiddleware').get('en').interpret(bot, message, () => {
        console.log('Result ', message.watsonData);
        console.log('Error ',  message.watsonError);
        app.getService('wchconversation').getWchConversationResponses(message.watsonData)
        .then(result => console.log(result.conversationResp.searchResult.documents))
        .catch(console.log);
    });
  });


})
.catch(console.log);
