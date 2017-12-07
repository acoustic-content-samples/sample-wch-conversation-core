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

const env = require('./env')
const expect = require('chai').expect
const loggingModule = require('../logging');
const credentialsModule = require('../credentials');

describe('env plugin', () => {
  let logging;
  let credentials;

  before((done) => {
    new Promise((resolve, reject) => {
        let registerLogging = (err, logginService) => {
          logging = logginService.logging;
          resolve(logging);
        };

        loggingModule({}, {}, registerLogging);
    })
    .then(logging => {
      return new Promise((resolve, reject) => {
        let registerCreds = (err, credentialsService) => {
          credentials = credentialsService.credentials;
          resolve();
        };

        credentialsModule({modifiable: true}, {logging}, registerCreds);
      });
    })
    .then(done);
  });

  describe('setup', () => {
    let envService;

    before((done) => {
      let register = (_this, environmentService) => {
        envService = environmentService.env;
        done();
      };

      env({credsPath: './dch_vcap.json'}, {credentials, logging}, register);
    });

    it('should export a function', () => {
      expect(env).to.be.a('function');
    });


    it('should init with the stored credentials', () => {
      console.log('envService ', envService.getService('bot_config'));
    });

  });

  describe('setup only bx creds', () => {
      let bxCredsOrig = process.env['BX_CREDS'];

      before((done) => {
        process.env['BX_CREDS'] = 'true';
        done();
      });

      after((done) => {
        process.env['BX_CREDS'] = bxCredsOrig;
        done();
      });


      it('should initalize the env plugin without any credentials module ', (done) => {
        console.log('--------------> process.env.BX_CREDS', process.env.BX_CREDS);

        let register = (_this, environmentService) => {
          console.log('Done')
          done();
        };

        env({credsPath: './dch_vcap.json'}, {logging}, register);

      });

  });

});
