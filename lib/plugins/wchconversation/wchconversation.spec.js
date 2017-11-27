'use strict'

const wchconversation = require('./wchconversation')
const expect = require('chai').expect
const credentials = require('../credentials/credentials');

describe('wchconversation plugin', () => {

  describe('setup', () => {
    let wchconversationService;

    before((done) => {
      let register = (_this, wchconversationironmentService) => {
        wchconversationService = wchconversationironmentService.wchconversation;
        done();
      };

      wchconversation({}, {}, register);
    });

    it('should export a function', () => {
      expect(wchconversation).to.be.a('function');
    });


    it('should init with the stored credentials', () => {
      console.log('wchconversationService ', wchconversationService.getService('bot_config'));
    });

  });

});
