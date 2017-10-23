'use strict'

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

      clientType(OPTIONS_DEFAULT, null, register)
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
