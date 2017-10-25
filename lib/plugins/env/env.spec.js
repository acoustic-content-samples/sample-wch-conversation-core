'use strict'

const env = require('./env')
const expect = require('chai').expect
const credentials = require('../credentials/credentials');

describe('env plugin', () => {
  let credsService;

  before((done) => {
    let register = (_this, credentialsService) => {
      credsService = credentialsService.credentials;
      done();
    };

    credentials({modifiable: true}, null, register);
  });

  describe('setup', () => {
    let envService;

    before((done) => {
      let register = (_this, environmentService) => {
        envService = environmentService.env;
        done();
      };

      env({credsPath: './dch_vcap.json'}, {credentials:credsService}, register);
    });

    it('should export a function', () => {
      expect(env).to.be.a('function');
    });


    it('should init with the stored credentials', () => {
      console.log('envService ', envService.getService('bot_config'));
    });

  });

});
