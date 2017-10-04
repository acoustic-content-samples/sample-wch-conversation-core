'use strict'

const geolocation = require('./geolocation')
const expect = require('chai').expect

describe('geolocation plugin', () => {

  describe('setup', () => {
    it('should export a function', () => {
      expect(geolocation).to.be.a('function');
    });
  })

});
