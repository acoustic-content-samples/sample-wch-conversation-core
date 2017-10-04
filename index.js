'use strict';

const {promisify} = require('util');
const {join} = require('path');
const {createApp, resolveConfig} = require('architect');
const createAppAsync = promisify(createApp);
const resolveConfigAsync = promisify(resolveConfig);

const architectConfig = require('./lib/conversation-core')();

resolveConfigAsync(architectConfig, join(__dirname, 'lib'))
.then(createAppAsync)
.then(app => {
  console.log(app);
})
.catch(console.log);
