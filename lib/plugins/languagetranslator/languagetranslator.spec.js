'use strict'

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

      it('identify should always resolve null', function (done) {
        expect(disabledTranslator.identify()).to.eventually.be.null.notify(done);
      });

    });

  });

});
