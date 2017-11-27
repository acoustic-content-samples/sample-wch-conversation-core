'use strict'

const conversationmiddleware = require('./conversationmiddleware')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false,
  middlewareConfigs: []
}

describe('conversationmiddleware plugin', function () {

  it('should export a function', function () {
    expect(conversationmiddleware).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, languageService) => {
        expect(languageService).to.be.an('object');
        done();
      };

      conversationmiddleware(OPTIONS_DISABLED, {env: {getService: () => ({})}}, register)
    });


  });

  describe('conversationmiddleware', () => {

  });

});
