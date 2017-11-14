'use strict'

const credentials = require('./credentials');
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

        credentials({credsPath: join(cwd(), 'testcreds.json')}, null, register)
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

        credentials({modifiable: true, credsPath: join(cwd(), 'testcreds.json')}, null, register)
      });

      it('should return an object', () => {
        expect(defaultCredsService).not.to.be.null;
        expect(defaultCredsService).to.be.an('object');
      });

      describe('store', () => {

        after((done) => {
          require('fs').unlinkSync(join(cwd(), 'testcreds.json'));
          done();
        });

        it('should store a JSON object', (done) => {
          defaultCredsService.store({credentials: testCredentials})
          .then(() => done());
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
