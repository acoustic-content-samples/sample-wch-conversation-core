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
const credentials = require('../credentials/credentials');

describe('env plugin', () => {
  let credsService;

  before((done) => {
    let register = (_this, credentialsService) => {
      credsService = credentialsService.credentials;
      done();
    };

    credentials({modifiable: true}, null, register);
  });

  describe('setup', () => {
    let envService;

    before((done) => {
      let register = (_this, environmentService) => {
        envService = environmentService.env;
        done();
      };

      env({credsPath: './dch_vcap.json'}, {credentials:credsService}, register);
    });

    it('should export a function', () => {
      expect(env).to.be.a('function');
    });


    it('should init with the stored credentials', () => {
      console.log('envService ', envService.getService('bot_config'));
    });

  });

});
