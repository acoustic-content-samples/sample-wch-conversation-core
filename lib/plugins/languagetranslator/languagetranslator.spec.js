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

const languagetranslator = require('./languagetranslator')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false
}

describe('languagetranslator plugin', function () {

  it('should export a function', function () {
    expect(languagetranslator).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, languageService) => {
        expect(languageService).to.be.an('object');
        done();
      };

      languagetranslator(OPTIONS_DISABLED, null, register)
    });


  });

  describe('languagetranslator', () => {

    describe('disabled', () => {
      let disabledTranslator;

      before((done) => {
        let register = (_this, languageService) => {
          disabledTranslator = languageService.languageTranslator;
          done();
        };

        languagetranslator(OPTIONS_DISABLED, null, register)
      });

      it('disabledTranslator should return an object', () => {
        expect(disabledTranslator).to.be.an('object');
      });

      it('disabledTranslator should have and identify function', () => {
        expect(disabledTranslator.identify).to.be.a('function');
      });

      it('identify should return a promise', () => {
        let identifyPromise = disabledTranslator.identify();
        expect(identifyPromise.then).to.be.a('function');
        expect(identifyPromise.catch).to.be.a('function');
      });

      it('identify should always resolve an object', function (done) {
        expect(disabledTranslator.identify()).to.eventually.not.be.null.notify(done);
      });

    });

  });

});
