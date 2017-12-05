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

const Handlebars = require('handlebars');

/**
 * Helpers to create conditional statements in content.
 */
Handlebars.registerHelper({
  eq: function (v1, v2) {
    return v1 === v2;
  },
  ne: function (v1, v2) {
    return v1 !== v2;
  },
  lt: function (v1, v2) {
    return v1 < v2;
  },
  gt: function (v1, v2) {
    return v1 > v2;
  },
  lte: function (v1, v2) {
    return v1 <= v2;
  },
  gte: function (v1, v2) {
    return v1 >= v2;
  },
  and: function (v1, v2) {
    return v1 && v2;
  },
  or: function (v1, v2) {
    return v1 || v2;
  }
});

const WchConversationTemplatingV1 = function (logger) {
  this.logger = logger;
};

/**
 * If we already have a template string use this method to call the compile method.
 * @param  {Object} watsonData     Result of a call against the conversation service
 * @param  {String} templateString The template string were we want to insert content form the conversation service
 * @return {String}                The parsed template string
 */
WchConversationTemplatingV1.prototype.parseString = function (watsonData, templateString) {
  this.logger.methodEntry('parseString', watsonData, templateString);
  return new Promise((resolve, reject) => {
    let template = Handlebars.compile(templateString);
    // Here we just pass the watsonData Object in. We could make this easier for
    // the Content Author by extracting the most used values.
    let result = template({watsonData});
    this.logger.methodExit('parseString', result);
    resolve(result);
  });
}

/**
 * If we have a handlebars template as an JavaScript object.
 * @param  {Object} watsonData     Result of a call against the conversation service
 * @param  {Object} templateObject The handlebar template as an object
 * @return {Object}                The parsed template as an object
 */
WchConversationTemplatingV1.prototype.parseJSON = function (watsonData, templateObject) {
  this.logger.methodEntry('parseJSON', watsonData, templateObject);
  return new Promise((resolve, reject) => {
    if (!templateObject && typeof templateObject !== 'object') {
      this.logger('templateObject not an object', templateObject);
      return resolve(templateObject);
    }
    let template = Handlebars.compile(JSON.stringify(templateObject));
    // Here we just pass the watsonData Object in. We could make this easier for
    // the Content Author by extracting the most used values.
    let result = template({watsonData});
    this.logger.methodExit('parseJSON', result);
    resolve(JSON.parse(result));
  });
}

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup (options, imports, register) {
  const {logging, env} = imports;
  const logger = logging('templating');
  logger.methodEntry('setup', options, imports);
  register(null, {
    templating: new WchConversationTemplatingV1(logger)
  });
  logger.methodExit('setup');
}
