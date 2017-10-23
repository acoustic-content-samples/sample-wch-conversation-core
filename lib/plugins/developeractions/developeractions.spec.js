'use strict'

const developeractions = require('./developeractions')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false
}

describe('developeractions plugin', function () {

  it('should export a function', function () {
    expect(developeractions).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, languageService) => {
        expect(languageService).to.be.an('object');
        done();
      };

      developeractions(OPTIONS_DISABLED, null, register)
    });

  });

  describe('developeractions', () => {

  });

});
