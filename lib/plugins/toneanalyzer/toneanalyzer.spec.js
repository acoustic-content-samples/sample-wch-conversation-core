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

const toneanalyzer = require('./toneanalyzer')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false
}

describe('toneanalyzer plugin', function () {

  it('should export a function', function () {
    expect(toneanalyzer).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, languageService) => {
        expect(languageService).to.be.an('object');
        done();
      };

      toneanalyzer(OPTIONS_DISABLED, null, register)
    });


  });

  describe('toneanalyzer', () => {

    describe('disabled', () => {
      let disabledToneanalyzer;

      before((done) => {
        let register = (_this, languageService) => {
          disabledToneanalyzer = languageService.toneanalyzer;
          done();
        };

        toneanalyzer(OPTIONS_DISABLED, null, register)
      });

      it('disabledToneanalyzer should return an object', () => {
        expect(disabledToneanalyzer).to.be.an('object');
      });

      it('disabledToneanalyzer should have and identify function', () => {
        expect(disabledToneanalyzer.identify).to.be.a('function');
      });

      it('identify should return a promise', () => {
        let identifyPromise = disabledToneanalyzer.identify();
        expect(identifyPromise.then).to.be.a('function');
        expect(identifyPromise.catch).to.be.a('function');
      });

      it('identify should always resolve null', function (done) {
        expect(disabledToneanalyzer.identify()).to.eventually.be.null.notify(done);
      });

    });

  });

});
