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

const { join, parse, resolve } = require('path');
const {promisify} = require('util');
const {readFile, writeFile, existsSync} = require('fs');
const {homedir} = require('os');
const {cwd} = process;
const NodeRSA = require('node-rsa');
const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(writeFile);

/* All plugins must export this public signature. Initalizes the credentials module.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  const {logging} = imports;
  const logger = logging('credentials');
  logger.methodEntry('setup', options, imports);

  const config = {
    pubKPath : options.pubKPath || join(homedir(), '.ssh', 'id_rsa'), // Private Key Contains the Public Key
    privKPath: options.privKPath || join(homedir(), '.ssh', 'id_rsa'),
    encrypted: typeof options.encrypted === 'boolean' ? options.encrypted : true,
    defaultCredPath: options.credsPath || join(cwd(), 'creds.json'),
    readOnly: typeof options.readOnly === 'boolean' ? options.readOnly : true
  };
  logger.debug('Configuration: %o', config);

  if (config.encrypted && (!existsSync(config.pubKPath) || !existsSync(config.privKPath))) {
    throw new Error(`Could not find RSA keys. Check if they exist in the paths: ${config.pubKPath} and ${config.privKPath}.`);
  }

  /**
   * Encrypts a string based on the given public key path.
   * @param  {String} toEncrypt The string representation of the object we want to encrypt.
   * @param  {String} pubKPath  The relative or absolute path to the public RSA key.
   * @return {String}           Base64 encoded and encrypted string
   */
  const _encryptStringWithRsaPublicKey = function(toEncrypt, pubKPath) {
      logger.methodEntry('_encryptStringWithRsaPublicKey', '***', pubKPath);
      let buffer = new Buffer(toEncrypt);
      return Promise.resolve(pubKPath)
        .then(resolve)
        .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
        .then(publicKey => new NodeRSA(publicKey).encrypt(toEncrypt, 'base64'))
        .then(value => logger.methodExit('_encryptStringWithRsaPublicKey', value, true));
  };

  /**
   * Decrypts a given string based on the given private key.
   * @param  {String} toDecrypt Base64 encoded encrypted string to decrypt
   * @param  {String} privKPath The relative or absolute path to the private RSA key.
   * @return {String}           The decrypted string utf-8 encoded.
   */
  const _decryptStringWithRsaPrivateKey = function(toDecrypt, privKPath) {
      logger.methodEntry('_decryptStringWithRsaPrivateKey', '***', privKPath);
      let buffer = new Buffer(toDecrypt);
      return Promise.resolve(privKPath)
        .then(resolve)
        .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
        .then(privateKey => new NodeRSA(privateKey).decrypt(toDecrypt, 'utf8'))
        .then(value => logger.methodExit('_decryptStringWithRsaPrivateKey', value, true));
  };

  /**
   * Decrypts a string based on the private key.
   * @param  {String} options.credentials Credentials string
   * @param  {String} options.privKPath   Optional. Absolute or relative path to the private key
   * @return {String}                     The decrypted string
   */
  const _decryptString = function ({credentials, privKPath}) {
    logger.methodEntry('_decryptString', '***', privKPath);
    const _pathToPrivKey = privKPath || config.privKPath;
    return _decryptStringWithRsaPrivateKey(credentials, _pathToPrivKey)
      .then(value => logger.methodExit('_decryptString', value, true));
  };

  /**
   * Encrypts a string based on the public key.
   * @param  {String} options.credentials The string to encrypt
   * @param  {String} options.pubKPath    Optional. Absolute or relative path to the public key
   * @return {String}                     The base64 encoded and encrypted string
   */
  const _encryptString = function ({credentials, pubKPath}) {
    logger.methodEntry('_encryptString', '***', pubKPath);
    const _credsStr = typeof credentials !== 'string' ? JSON.stringify(credentials) : credentials;
    const _pubKPath = pubKPath || config.pubKPath;
    return _encryptStringWithRsaPublicKey(_credsStr, _pubKPath)
      .then(value => logger.methodExit('_encryptString', value, true));
  };

  /**
   * Getter method to retrieve the encrypted credentials file. Credentials are stored as an object.
   * @param  {String}  options.credsPath   Absolute or relative path to the credentials file
   * @param  {String}  options.privKPath   Absolute or relative path to the private key
   * @param  {Boolean} options.encrypted   True if the file is encrypted. Otherwise credentials are stored in clear text.
   * @return {Object}                      The encrypted credentials object
   */
  const _getCredentials = function ({credsPath, privKPath, encrypted} = {}) {
    logger.methodEntry('_getCredentials', credsPath, privKPath, encrypted);
    let _pathToFile = credsPath || config.defaultCredPath;
    let _pathToPrivKey = privKPath || config.privKPath;
    let _encrypted = encrypted || config.encrypted;
    return Promise.resolve(_pathToFile)
      .then(resolve)
      .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
      .then(fileContent => (_encrypted) ? _decryptString({credentials: fileContent, privKPath: _pathToPrivKey}) : fileContent)
      .then(JSON.parse)
      .then(value => logger.methodExit('_getCredentials', value, true));
  }

  let _storeCredentials;
  if (!config.readOnly) {
    /**
     * Only availabe if the credentials are modifiable. Encrypts and stores the credentials object.
     * @param  {String} options.credsPath   Absolute or relative path to the credentials file
     * @param  {Object} options.credentials The credentials object we want to store
     * @param  {String} options.pubKPath    Absolute or relative path to the public key
     */
    _storeCredentials = function ({credsPath, credentials, pubKPath}) {
      logger.methodEntry('_storeCredentials', credsPath, '***', pubKPath);
      let _credsPath = credsPath || config.defaultCredPath;

      if (!config.encrypted) {
        const _credsStr = typeof credentials !== 'string' ? JSON.stringify(credentials) : credentials;
        return  writeFilePromise(resolve(_credsPath), _credsStr)
        .then(value => logger.methodExit('_storeCredentials', value));
      }
      else {
        return _encryptString({credentials, pubKPath})
        .then(encrypted => writeFilePromise(resolve(_credsPath), encrypted))
        .then(value => logger.methodExit('_storeCredentials', value, true));
      }
    }

  }
  register(null, {
    credentials: {
      isReadOnly: config.readOnly,
      get: _getCredentials,
      encrypt: _encryptString,
      decrypt: _decryptString,
      store: _storeCredentials
    }
  });
  logger.methodExit('setup');
}
