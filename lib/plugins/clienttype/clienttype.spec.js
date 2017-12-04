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

const loggingModule = require('../logging');
const clientType = require('./clienttype')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DEFAULT = {};

const DEFAULT_PAYLOAD = {};
const MESSAGE_UNSUPPORTED = {type:'unsupported'};
const MESSAGE_SLACK = {type:'message'};

describe('clientType plugin', function () {
  let logging;

  before((done)=> {
    let register = (err, logginService) => {
      logging = logginService.logging;
      done();
    };

    loggingModule({}, {}, register);
  });

  it('should export a function', function () {
    expect(clientType).to.be.a('function');
  });

  let clientTypeResult;

  describe('setup', () => {
    it('register should return an object', function (done) {
      let register = (_this, clientTypeSetup) => {
        expect(clientTypeSetup).to.be.an('object');
        clientTypeResult = clientTypeSetup;
        done();
      };

      clientType(OPTIONS_DEFAULT, {logging}, register)
    });
  });

  describe('clientType Service', () => {
    it('clientType service should be an object', function () {
      expect(clientTypeResult.clientType).to.be.an('object');
    });

    describe('identify', () => {
      it('should be a function', function () {
        expect(clientTypeResult.clientType.identify).to.be.a('function');
      });

      it('should return a promise', () => {
        let identifyPromise = clientTypeResult.clientType.identify(MESSAGE_UNSUPPORTED, DEFAULT_PAYLOAD);
        expect(identifyPromise.then).to.be.a('function');
        expect(identifyPromise.catch).to.be.a('function');
      });

      it('should return "unsupported" as the default value', function (done) {
        expect(clientTypeResult.clientType.identify(MESSAGE_UNSUPPORTED, DEFAULT_PAYLOAD))
        .eventually.to.be.an('object')
        .to.have.property('clientType', 'unsupported')
        .notify(done);
      });

      it('should return "slack" if messagetype is "message"', function (done) {
        expect(clientTypeResult.clientType.identify(MESSAGE_SLACK, DEFAULT_PAYLOAD))
        .eventually.to.be.an('object')
        .to.have.property('clientType', 'slack')
        .notify(done);
      });
    });

  });

  describe('clientTypeMiddleware Service', () => {
    it('should be an object', function () {
      expect(clientTypeResult.clientTypeMiddleware).to.be.an('object');
    });

    it('should have an before function', function () {
      expect(clientTypeResult.clientTypeMiddleware.before).to.be.a('function');
    });

    it('should have no after function', function () {
      expect(clientTypeResult.clientTypeMiddleware.after).to.be.undefined;
    });

  });

});
