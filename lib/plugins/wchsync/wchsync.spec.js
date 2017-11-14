'use strict'

const wchsync = require('./wchsync')

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const OPTIONS_DISABLED = {
  enabled: false
}

describe('wchsync plugin', function () {

  it('should export a function', function () {
    expect(wchsync).to.be.a('function');
  });

  describe('setup', () => {

    it('register should return an object', function (done) {
      let register = (_this, languageService) => {
        expect(languageService).to.be.an('object');
        done();
      };

      wchsync(OPTIONS_DISABLED, null, register)
    });


  });

  describe('wchsync', () => {


  });

});
