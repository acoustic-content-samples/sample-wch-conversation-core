'use strict'

const templating = require('./templating')
const expect = require('chai').expect

describe('templating plugin', () => {

  describe('setup', () => {
    it('should export a function', () => {
      expect(templating).to.be.a('function');
    });
  })

});
