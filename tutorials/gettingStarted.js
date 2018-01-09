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

const {promisify} = require('util');
const {dirname} = require('path');
const {createApp, resolveConfig, loadConfig} = require('architect');
const createAppAsync = promisify(createApp);
const resolveConfigAsync = promisify(resolveConfig);
const loadConfigAsync = promisify(loadConfig);

const appSettings = {
  "generalSettings": {
    "defaultLanguage": "en",
    "supportedLanguages": [
     "de",
     "en"
    ],
    "developermode": true,
    "confLvl": "0.7",
    "credentialsStore": {
     "path": "./dch_vcap.json",
     "encrypted": true,
     "pathPrivKey": "C:\\Users\\SvenSterbling\\.ssh\\id_rsa"
    }
   },
   "wchService": {
     "enabled": true
   },
   "conversationMiddleware": {
    "config": [
     {
      "workspaceId": "9db75ce4-a059-4f53-988d-de239eed10a0",
      "locale": "en"
     }
    ]
   }
};

// This is the config - you can make changes to the settings either through
// modifying your app_settings.json or changing the architectConfig directly
const architectConfig = require('../lib/conversation-core')(appSettings);
const coreBase = dirname(require.resolve('../'));

resolveConfigAsync(architectConfig, coreBase)
.then(createAppAsync)
.then(wchcore => {
  // Access to your credentials
  const env = wchcore.getService('env');
  // Access to your Watson Conversation Service Instances
  const conversation = wchcore.getService('conversation');
  // Access to Watson Content Hub
  const wchconversation =  wchcore.getService('wchconversation');

  conversation.get('en').sendMessage({message: 'Hello World', context: {}})
  .then(watsonData => wchconversation.getWchConversationResponses(watsonData))
  .then(({conversationResp, locationResp, followupResp}) => {
    // The "general" answer is in the conversationResp
    let text = conversationResp.searchResult.documents[0].document.elements.text.values[0]
    console.log('The textual response from content hub is: ', text);
    // If you have a location specific answer use the locationResp instead of the conversationResp
    // If there are one time actions like asking for the username you have a followupResp as well as a conversationResp
  })
  .catch(err => {
    console.log('Error ', err);
  });

});
