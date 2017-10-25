'use strict';

const {promisify} = require('util');
const {join} = require('path');
const {createApp, resolveConfig} = require('architect');
const createAppAsync = promisify(createApp);
const resolveConfigAsync = promisify(resolveConfig);

const architectConfig = require('./lib/conversation-core')();

resolveConfigAsync(architectConfig, join(__dirname, 'lib'))
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
          get: (userId, cb) => {console.log('userId', userId); cb(null, {context: initialContext})},
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

  app.getService('watsonconversation').get('en').interpret(bot, message, () => {
    console.log('Result ', message.watsonData);
  });


})
.catch(console.log);
