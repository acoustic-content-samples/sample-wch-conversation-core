'use strict'

const conversationCore = require('./conversation-core')
const expect = require('chai').expect

describe('conversationCore module', () => {

  it('should export a function', () => {
    expect(conversationCore).to.be.a('function');
  });

  describe('"conversationCore init"', () => {

  })

});
