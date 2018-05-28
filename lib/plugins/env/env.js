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

const cfenv = require('cfenv');
const {resolve} = require('path');
const {readFile} = require('fs');
const {homedir} = require('os');
const {cwd} = process;
const {promisify} = require('util');
const readFilePromise = promisify(readFile);

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup (options, imports, register) {
  const {logging, credentials} = imports;
  const logger = logging('env');
  logger.methodEntry('setup', options, imports);
  logger.debug('Use BX credentials: %s',  process.env.BX_CREDS);
  if (process.env.BX_CREDS === 'true') {
    register(null, {
      env: cfenv.getAppEnv()
    });
    logger.methodExit('setup');
  }
  else {
    imports.credentials.get({credsPath: resolve(options.credsPath)})
      .then(credentials => {
        register(null, {
          env: cfenv.getAppEnv({
            vcap: {
              services: credentials
            }
          })
        });
      })
      .catch(err => {
        logger.debug('There was a problem fetching the local credentials. Fallback to bluemix credentials only. Err %o', err);
        register(null, {
          env: cfenv.getAppEnv()
        });
      })
      .then(() => logger.methodExit('setup'));
  }

}
