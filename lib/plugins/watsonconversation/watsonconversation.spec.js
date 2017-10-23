'use strict'

const watsonconversation = require('./watsonconversation')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false
}

describe('watsonconversation plugin', function () {

  it('should export a function', function () {
    expect(watsonconversation).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, languageService) => {
        expect(languageService).to.be.an('object');
        done();
      };

      watsonconversation(OPTIONS_DISABLED, null, register)
    });


  });

  describe('watsonconversation', () => {

  });

});
