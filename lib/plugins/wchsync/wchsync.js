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

const debug = require('debug')('conversation-core:sync');
const syncMethods = require('./v1/syncMethods');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const mainWorkspace = options.mainWorkspace;
  debug('mainWorkspace ', mainWorkspace);
  const conversation = imports.conversation.get(mainWorkspace);
  const wch = imports.wch.authoring;

  if (!conversation) {
    debug('Warn: No conversation instance found.');
  }
  debug('conversation ', conversation);

  let push = function (options) {
    debug('Start Push. Options: %o', options);
    let {fromSys, toSys} = options;
    if (fromSys === 'WCS' && toSys === 'WCH') {
      return new Promise((res, rej) => {
        conversation.getWorkspace()
        .catch(rej)
        .then(syncMethods.transformToTaxonomy)
        .catch(rej)
        .then(values => syncMethods.updateTaxonomies({values, wch, conversation}))
        .then(res);
      });
    }
  }

  register(null, {
    wchsync: {
      push
    }
  });

}
