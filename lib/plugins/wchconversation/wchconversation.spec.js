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

const wchconversation = require('./wchconversation')
const expect = require('chai').expect
const credentials = require('../credentials/credentials');
const loggingModule = require('../logging');

describe('wchconversation plugin', () => {
  let logging;

  before((done)=> {
    let register = (err, logginService) => {
      logging = logginService.logging;
      done();
    };

    loggingModule({}, {}, register);
  });

  describe('setup', () => {
    let wchconversationService;

    before((done) => {
      let register = (_this, wchconversationironmentService) => {
        wchconversationService = wchconversationironmentService.wchconversation;
        done();
      };

      wchconversation({}, {wch:{}, logging}, register);
    });

    it('should export a function', () => {
      expect(wchconversation).to.be.a('function');
    });

  });

});
