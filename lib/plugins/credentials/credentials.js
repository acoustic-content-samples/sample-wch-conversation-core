/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const debug = require('debug')('conversation-core:credentials');
const { join, parse, resolve } = require('path');
const {promisify} = require('util');
const {readFile, writeFile} = require('fs');
const {homedir} = require('os');
const {cwd} = process;
const NodeRSA = require('node-rsa');
const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

const encryptStringWithRsaPublicKey = function(toEncrypt, pubKPath) {
    debug('ENTER encryptStringWithRsaPublicKey(%s, %s)', toEncrypt, pubKPath);
    let buffer = new Buffer(toEncrypt);
    return Promise.resolve(pubKPath)
      .then(resolve)
      .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
      .then(publicKey => new NodeRSA(publicKey).encrypt(toEncrypt, 'base64'));
};

const decryptStringWithRsaPrivateKey = function(toDecrypt, privKPath) {
    debug('ENTER decryptStringWithRsaPrivateKey(%s, %s)', toDecrypt, privKPath);
    let buffer = new Buffer(toDecrypt);
    return Promise.resolve(privKPath)
      .then(resolve)
      .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
      .then(privateKey => new NodeRSA(privateKey).decrypt(toDecrypt, 'utf8'));
};

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const config = {
    pubKPath : options.pubKPath || join(homedir(), '.ssh', 'id_rsa'), // Private Key Contains the Public Key
    privKPath: options.privKPath || join(homedir(), '.ssh', 'id_rsa'),
    encrypted: options.encrypted || true,
    defaultCredPath: options.credsPath || join(cwd(), 'creds.json'),
    modifiable: options.modifiable || false
  };

  const _decryptString = function ({credentials, privKPath}) {
    const _pathToPrivKey = privKPath || config.privKPath;
    return decryptStringWithRsaPrivateKey(credentials, _pathToPrivKey)
    .catch(console.log);
  };

  const _encryptString = function ({credentials, pubKPath}) {
    const _credsStr = typeof credentials !== 'string' ? JSON.stringify(credentials) : credentials;
    const _pubKPath = pubKPath || config.pubKPath;
    return encryptStringWithRsaPublicKey(_credsStr, _pubKPath)
    .catch(console.log);
  };

  const _getCredentials = function ({credsPath, privKPath} = {}) {
    let _pathToFile = credsPath || config.defaultCredPath;
    let _pathToPrivKey = privKPath || config.privKPath;
    return Promise.resolve(_pathToFile)
      .then(resolve)
      .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
      .then(fileContent => (config.encrypted) ? _decryptString({credentials: fileContent, privKPath: _pathToPrivKey}) : fileContent)
      .then(JSON.parse);
  }

  let _storeCredentials;
  if (config.modifiable) {
    _storeCredentials = function ({credsPath, credentials, pubKPath}) {
      let _credsPath = credsPath || config.defaultCredPath;

      if (!config.encrypted) {
        return  writeFilePromise(resolve(_credsPath), credentials)
        .catch(console.log);
      }
      else {
        return _encryptString({credentials, pubKPath})
        .then(encrypted => writeFilePromise(resolve(_credsPath), encrypted))
        .catch(console.log);
      }
    }

  }

  register(null, {
    credentials: {
      isModifiable: config.modifiable,
      get: _getCredentials,
      encrypt: _encryptString,
      decrypt: _decryptString,
      store: _storeCredentials
    }
  });
}
