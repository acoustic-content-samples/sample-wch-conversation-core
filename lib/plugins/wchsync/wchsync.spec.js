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

const wchsync = require('./wchsync')
const loggingModule = require('../logging');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false
}

describe('wchsync plugin', function () {
  let logging;

  before((done)=> {
    let register = (err, logginService) => {
      logging = logginService.logging;
      done();
    };

    loggingModule({}, {}, register);
  });

  it('should export a function', function () {
    expect(wchsync).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, wchsync) => {
        expect(wchsync).to.be.an('object');
        done();
      };

      wchsync(OPTIONS_DISABLED, {conversation:{get: () => {}}, wch: {}, logging}, register);
    });


  });

  describe('wchsync', () => {


  });

});
