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

    it('should throw an error when path to public key is wrong', () => {
      expect(() => credentials({pubKPath: '/rand/wrong/path'}, {logging})).to.throw(Error, 'RSA keys');
    });

    it('should throw an error when path to private key is wrong', () => {
      expect(() => credentials({privKPath: './notafile'}, {logging})).to.throw(Error, 'RSA keys');
    });

    describe('credentials default', () => {
      let defaultCredsService;

      before((done) => {
        let register = (_this, credentialsService) => {
          defaultCredsService = credentialsService.credentials;
          done();
        };

        credentials({credsPath: join(cwd(), 'testcreds.json')}, {logging}, register)
      });

      it('should return an object', () => {
        expect(defaultCredsService).not.to.be.null;
        expect(defaultCredsService).to.be.an('object');
      });

      it('should have an get function', () => {
        expect(defaultCredsService.get).to.be.a('function');
      });

      it('should have an encrypt function', () => {
        expect(defaultCredsService.encrypt).to.be.a('function');
      });

      it('should be read only', () => {
        expect(defaultCredsService.isReadOnly).to.be.true;
        expect(defaultCredsService.store).to.be.undefined;
      });

    });

    describe('credentials modifiable', () => {
      let modCredsService;

      before((done) => {
        let register = (_this, credentialsService) => {
          modCredsService = credentialsService.credentials;
          done();
        };

        credentials({readOnly: false, credsPath: join(cwd(), 'testcreds.json')}, {logging}, register)
      });

      it('should return an object', () => {
        expect(modCredsService).not.to.be.null;
        expect(modCredsService).to.be.an('object');
      });

      it('should be modifiable', () => {
        expect(modCredsService.isReadOnly).to.be.false;
        expect(modCredsService.store).to.be.a('function');
      });

      describe('store', () => {

        after((done) => {
          require('fs').unlinkSync(join(cwd(), 'testcreds.json'));
          done();
        });

        it('should store a JSON object', (done) => {
          modCredsService.store({credentials: testCredentials})
          .then(() => done());
        });

        it('should read the stored credentials file', (done) => {
          expect(modCredsService.get())
          .eventually.to.be.an('object')
          .to.have.property('key1', 'supersecred')
          .notify(done);
        });

      });

    });

  })

});
