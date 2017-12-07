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

const credentials = require('./credentials');
const loggingModule = require('../logging');

const expect = require('chai').expect;
const {unlinkSync} = require('fs');
const {join} = require('path');
const {cwd} = process;

const testCredentials = {
  key1: 'supersecred',
  key2: 'secred',
  secretComponent : {
    key1: 'hiddenfromyou',
    arr: ['sec1', 'sec2', 'sec3']
  }
};

describe('credentials plugin', () => {
  let logging;

  before((done)=> {
    let register = (err, logginService) => {
      logging = logginService.logging;
      done();
    };

    loggingModule({}, {}, register);
  });

  describe('setup', () => {
    it('should export a function', () => {
      expect(credentials).to.be.a('function');
    });
  });

});
