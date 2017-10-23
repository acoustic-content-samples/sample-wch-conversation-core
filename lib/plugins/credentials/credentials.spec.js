'use strict'

const credentials = require('./credentials')
const expect = require('chai').expect

describe('credentials plugin', () => {

  describe('setup', () => {
    it('should export a function', () => {
      expect(credentials).to.be.a('function');
    });
  })

  describe('credentials default', () => {
    let defaultCredsService;

    before((done) => {
      let register = (_this, credentialsService) => {
        defaultCredsService = credentialsService.credentials;
        done();
      };

      credentials({}, null, register)
    });

    it('should return an object', () => {
      expect(defaultCredsService).not.to.be.null;
      expect(defaultCredsService).to.be.an('object');
    });

    it('should not be modifiable', () => {
      expect(defaultCredsService.isModifiable).to.be.false;
      expect(defaultCredsService.set).to.be.undefined;
    });

  });

  describe('credentials modifiable', () => {
    let defaultCredsService;

    before((done) => {
      let register = (_this, credentialsService) => {
        defaultCredsService = credentialsService.credentials;
        done();
      };

      credentials({modifiable: true}, null, register)
    });

    it('should return an object', () => {
      expect(defaultCredsService).not.to.be.null;
      expect(defaultCredsService).to.be.an('object');
    });

    it('should be modifiable', () => {
      expect(defaultCredsService.isModifiable).to.be.true;
      expect(defaultCredsService.set).to.be.a('function');
      defaultCredsService.set({credentials: {TEST:'TEST'}});
    });

  });

});
