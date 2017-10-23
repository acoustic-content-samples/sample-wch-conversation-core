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
const {readFile, readFileSync} = require('fs');
const {homedir} = require('os');
const {cwd} = process;
const readFilePromise = promisify(readFile);
const writeFilePromise = promisify(readFile);
const {publicEncrypt, privateDecrypt} = require('crypto');


const encryptStringWithRsaPublicKey = function(toEncrypt, pathPubKey) {
  console.log(toEncrypt);
  console.log(pathPubKey);
    debug('ENTER encryptStringWithRsaPublicKey(%s, %s)', toEncrypt, pathPubKey);
    let buffer = new Buffer(toEncrypt);
    return Promise.resolve(pathPubKey)
    .then(resolve)
    .then(absolutePath => readFilePromise(absolutePath, 'utf8'))
    .then(publicKey => publicEncrypt(publicKey, buffer))
    .then(encrypted => encrypted.toString('base64'));
};

const decryptStringWithRsaPrivateKey = function(toDecrypt, pathPrivKey) {
    var absolutePath = resolve(pathPrivKey);
    var privateKey = readFileSync(absolutePath, 'utf8');
    var buffer = new Buffer(toDecrypt, 'utf8');
    var decrypted = privateDecrypt(privateKey, '1234', buffer);
    return decrypted.toString('utf8');
};

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup(options, imports, register) {
  let config = {
    pubKPath : options.pubKPath || join(homedir(), '.ssh', 'cert.pem'),
    pathPrivKey: options.pathPrivKey || join(homedir(), '.ssh', 'key.pem'),
    credPath: options.credPath || join(cwd(), 'creds.json'),
    modifiable: options.modifiable || false
  };

  let _getCredentials = function (pathToFile, pathToPrivKey) {
    let _pathToFile = pathToFile || config.pathCreds;
    let _pathToPrivKey = pathToPrivKey || config.pathPrivKey;

    return Promise.all([resolve(_pathToFile), resolve(_pathToPrivKey)])
      .all((filePaths) => filePaths.map(path => readFilePromise(path, 'utf8')))
      .then(console.log);
  }

  let _setCredentials;
  if(config.modifiable) {
    _setCredentials = function ({credentials, pubKPath}) {
      let _credsStr = JSON.stringify(credentials);
      let _pubKPath = pubKPath || config.pubKPath;

      return encryptStringWithRsaPublicKey(_credsStr, _pubKPath)
      .catch(console.log);
    }

    __storeCredentials = function ({credsPath, credentials, pubKPath}) {
      return __storeCredentials({credentials, pubKPath}).
      then(encrypted => writeFilePromise(resolve(credsPath), encrypted));
    }

  }

  register(null, {
    credentials: {
      isModifiable: config.modifiable,
      get: _getCredentials,
      set: _setCredentials,
      store: _storeCredentials
    }
  });
}



// function _encryptPassword(aPassword: string, aKey: NodeRSA): string {
//     return aKey.encrypt(aPassword, 'base64');
// }

// function _decryptPassword(aHash: string, aKey: NodeRSA): string {
//     return aKey.decrypt(aHash, 'buffer').toString('utf-8');
// }

// function _loadCredentials(aApiBase: string): Observable<Credentials> {
//     // credential file name
//     const filename = join(homedir(), '.ibm-wch-sdk-cli', '.credentials');
//     // read the credential
//     const key = _loadPrivateKey();
//     // load the file
//     return readFile(filename)
//         .map(data => JSON.parse(data))
//         .map(data => data[aApiBase])
//         .mergeMap(cred => key.map(k => _decryptPassword(cred.password, k)).map(p => {
//             cred.password = p;
//             return cred;
//         }))
//         .catch(() => Observable.of(_emptyCredentials()));
// }

// function _storeCredentials(aWchToolsOptions: WchToolsOptions): Observable<string> {
//     // target folder
//     const folder = join(homedir(), '.ibm-wch-sdk-cli');
//     const filename = join(folder, '.credentials');
//     // read the credential
//     const key = _loadPrivateKey();
//     // create the directpry
//     return rxMkdirp(folder)
//         .mergeMap(() => readFile(filename).map(data => <any>JSON.parse(data)))
//         .catch(() => Observable.of(<any>{}))
//         .mergeMap(data => key.map(cred => _setCredentials(aWchToolsOptions, cred, data)))
//         .map(canonicalizeJSON)
//         .map(data => JSON.stringify(data))
//         .mergeMap(data => rxWriteFile(filename, data));
// }
