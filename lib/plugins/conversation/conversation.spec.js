'use strict'

const conversation = require('./conversation')
const expect = require('chai').expect

describe('conversation plugin', () => {

  describe('setup', () => {
    it('should export a function', () => {
      expect(conversation).to.be.a('function');
    });
  })

});
