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

const { join, parse, resolve } = require('path');
const {promisify} = require('util');
const {readFile, writeFile, existsSync} = require('fs');
const {homedir} = require('os');
const {cwd} = process;
const NodeRSA = require('node-rsa');
const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

/* All plugins must export this public signature. Initalizes the credentials module.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const {logging} = imports;
  const logger = logging('credentialsbluemix');
  logger.methodEntry('setup', options, imports);

  register(null, {
    credentials: {
      isReadOnly: true,
      get: () => Promise.resolve({}),
      encrypt: () => Promise.resolve(null),
      decrypt: () => Promise.resolve(null),
      store: () => Promise.resolve({})
    }
  });
  logger.methodExit('setup');
}
