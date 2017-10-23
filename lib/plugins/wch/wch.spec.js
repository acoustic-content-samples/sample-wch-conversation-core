'use strict'

const wch = require('./wch')
const expect = require('chai').expect

describe('wch plugin', () => {

  describe('setup', () => {
    it('should export a function', () => {
      expect(wch).to.be.a('function');
    });
  })

});
