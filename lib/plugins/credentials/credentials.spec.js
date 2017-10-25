'use strict'

const credentials = require('./credentials')
const expect = require('chai').expect

const testCredentials = {
  key1: 'supersecred',
  key2: 'secred',
  secretComponent : {
    key1: 'hiddenfromyou',
    arr: ['sec1', 'sec2', 'sec3']
  }
};

describe('credentials plugin', () => {

  describe('setup', () => {
    it('should export a function', () => {
      expect(credentials).to.be.a('function');
    });

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

      it('should have an get function', () => {
        expect(defaultCredsService.get).to.be.a('function');
      });

      it('should have an encrypt function', () => {
        expect(defaultCredsService.encrypt).to.be.a('function');
      });

      it('should not be modifiable', () => {
        expect(defaultCredsService.isModifiable).to.be.false;
        expect(defaultCredsService.store).to.be.undefined;
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

      describe('store', () => {

        it('should store a JSON object', () => {
          defaultCredsService.store({credentials: testCredentials});
        });

        it('should read the stored credentials file', (done) => {
          expect(defaultCredsService.get())
          .eventually.to.be.an('object')
          .to.have.property('key1', 'supersecred')
          .notify(done);
        });

      });

    });

  })

});
