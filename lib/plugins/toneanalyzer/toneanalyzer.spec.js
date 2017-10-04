'use strict'

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
