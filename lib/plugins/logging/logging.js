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

const {createWriteStream} = require('fs');
const {resolve} = require('path');
const util = require('util');
const debugModule = require('debug');
debugModule.formatters.p = (params) => {
  if (arguments.length === 0) {
    return '()';
  }
  let formatterCtx = {inspectOpts: debugModule.inspectOpts};
  formatterCtx.inspectOpts.colors = debugModule.useColors();

  let {o} = debugModule.formatters;

  let format = ele => {
    let formattedEle = ele || 'nil';
    switch(typeof ele) {
      case 'string':
        formattedEle = ele.toString('utf-8');
      break;
      case 'object':
        formattedEle = o.call(formatterCtx, ele);
      break;
    }
    return formattedEle;
  };
  return `(${params.map(format).join(', ')})`;
}

const debugLoggerMap = new Map();

const initModuleLogger = function(packageName) {
  let _packageName = packageName;
  return function (moduleName) {
    if (!moduleName) {
      // This should not happen. Otherwise we risk that our logging experience is not
      // sufficient enough.
      throw new Error('Missing moduleName for logging.');
    }

    if (debugLoggerMap.get(moduleName)) {
      return debugLoggerMap.get(moduleName);
    }

    let logger = debugModule(`${_packageName}:${moduleName}`);

    let methodEntry = (name, ...params) => {
      logger('ENTER %s %p',name, params);
    };

    let methodExit = (name, value, confidential = false) => {
      if (confidential) {
        logger('RETURN %s (***)', name);
      }
      else {
        logger('RETURN %s (%o)', name, value !== null && value != undefined ? value : 'No Return Value');
      }
      return value;
    };

    let debug = (name) => {
      logger(`DEBUG ${name}`);
    }

    let loggingInst = {
      methodEntry,
      methodExit,
      debug
    };

    debugLoggerMap.set(moduleName, loggingInst);
    return loggingInst;
  };
}

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup (options, imports, register) {
  const packageName = options.packageName || 'conversation-core';
  const defaults = {
    flags: 'a'
  };
  debugModule.useColors = () => (true);

  if (options.toFile) {
    let stdlogFile = createWriteStream(resolve('./stdout.log'), defaults);
    debugModule.log = function ()  {
      process.stderr.write(util.format.apply(util, arguments) + '\n');
      stdlogFile.write(util.format.apply(util, arguments)+'\n');
    }
  }

  register(null, {logging:initModuleLogger(packageName)});
}
