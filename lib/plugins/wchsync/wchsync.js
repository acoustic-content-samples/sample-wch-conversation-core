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
module.exports = function setup(options, imports, register) {
  const {mainWorkspace} = options;
  const {logging, conversation, wch} = imports;
  const logger = logging('sync');
  logger.methodEntry('setup', options, imports);

  const syncMethods = require('./v1/syncMethods')(logging);

  const wchAuthoring = wch.authoring;
  const mainConversation = conversation.get(mainWorkspace);

  if (!mainConversation) {
    logger.debug('Warn: No conversation instance found.');
  }

  let push = function (options) {
    logger.methodEntry('push', options);
    let {fromSys, toSys} = options;
    if (fromSys === 'WCS' && toSys === 'WCH') {
      return new Promise((res, rej) => {
        mainConversation.getWorkspace()
        .catch(rej)
        .then(syncMethods.transformToTaxonomy)
        .catch(rej)
        .then(values => syncMethods.updateTaxonomies({values, wchAuthoring, conversation}))
        -then(value => logger.methodExit('push', value))
        .then(res);
      });
    }
  }

  register(null, {
    wchsync: {
      push
    }
  });
  logger.methodExit('setup');
}
