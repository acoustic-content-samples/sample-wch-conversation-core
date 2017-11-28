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

const debug = require('debug')('conversation-core:geolocation');
const googlemaps = require('@google/maps');

/* All plugins must export this public signature.
 * @options is the hash of options the user passes in when creating an instance
 * of the plugin.
 * @imports is a hash of all services this plugin consumes.
 * @register is the callback to be called when the plugin is done initializing.
 */
module.exports = function setup (options, imports, register) {
  debug('SETUP - Geolocation. Options %o, imports %o', options, imports);
  let identifyGeolocation;
  let mapsClient;
  let serviceName = options.serviceName || 'geo_config';
  let geoCreds = imports.env.getService(serviceName);
  if (options.enabled) {
    let config = {
      key: geoCreds.credentials.key,
      Promise: Promise
    };

    mapsClient = googlemaps.createClient(config);
    identifyGeolocation = function (message, conversationPayload) {
      let { text : msgText } = message;
      let { context } = conversationPayload;
      return new Promise((resolve, reject) => {
        if (context && context.setlocation === true) {
          debug('Looking for geolocation %s', msgText);
          mapsClient.geocode({
            address: msgText
          })
          .asPromise()
          .then(response => {
            debug('Geolocation Response: %o', response.json);
            if (response.json.results && response.json.results.length > 0) {
              resolve({geolocation: response.json.results[0].geometry.location});
            }
            else {
              resolve({geolocation: context.geolocation});
            }
          })
          .catch(reject);
        }
        else if (context) {
          debug('Curent Location: %s.', context.geolocation);
          resolve({geolocation: context.geolocation});
        }
        else {
          debug('No Context for Geolocation');
          resolve(null);
        }
      });
    };
  }
  else {
    identifyGeolocation = () => Promise.resolve(null);
  }

  register(null, {
    geolocation: {
      identify: identifyGeolocation
    },
    geolocationMiddleware: {
      before: identifyGeolocation
    }
  });

}
