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

'use strict'

const loggingModule = require('../../logging');
const syncMethodsModule = require('./syncMethods');
const {join} = require('path');
const {promisify} = require('util');
const {readFile, writeFile, existsSync} = require('fs');
const readFilePromise = promisify(readFile);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const pathToMockData = join(__dirname, '..', '..', '..', '..', 'mock', 'wchsync');


describe('syncMethods module', () => {
  let syncMethods;

  before((done)=> {
    let register = (err, logginService) => {
      let logging = logginService.logging;
      syncMethods = syncMethodsModule(logging);
      done();
    };

    loggingModule({}, {}, register);

  });

  it('should export four functions', () => {
    expect(syncMethods.transformToTaxonomy).to.be.a('function');
    expect(syncMethods.cleanUpTaxonomies).to.be.a('function');
    expect(syncMethods.uploadTaxonomies).to.be.a('function');
    expect(syncMethods.updateTaxonomies).to.be.a('function');
  });

  describe('transformToTaxonomy', () => {

    let testworkspace;

    before((done) => {
      readFilePromise(join(pathToMockData, 'mock_workspace_chatbot.json'))
      .then(JSON.parse)
      .then(workspace => {testworkspace = workspace})
      .then(done);
    });

    it('should transform a valid taxonomy', (done) => {
      Promise.all([
        syncMethods.transformToTaxonomy(testworkspace),
        readFilePromise(join(pathToMockData, 'mock_workspace_chatbot_transformedTax.json'))
      ])
      .then(([{workspace, taxonomies}, expectedResult]) => {
        expect(taxonomies).to.be.deep.equal(JSON.parse(expectedResult));
        done();
      });
    });

  });

  describe('updateTaxonomies', function () {

    it('should upload a an updated taxonomy to WCH', (done) => {

      Promise.all([
        readFilePromise(join(pathToMockData, 'mock_workspace_chatbot.json')),
        readFilePromise(join(pathToMockData, 'mock_workspace_chatbot_transformedTax.json')),
        readFilePromise(join(pathToMockData, 'mock_workspace_chatbot_resultwch.json')),
        readFilePromise(join(pathToMockData, 'mock_workspace_chatbot_updated.json'))
      ])
      .then(values => values.map(ele => JSON.parse(ele)))
      .then(([testWorkspace, taxToUpload, wchResult, updatedWorkspace]) => {

        return syncMethods.updateTaxonomies(
        {
          values: {workspace: testWorkspace, taxonomies: taxToUpload},
          wch: {
            taxonomy: {
              updateTaxonomies: (inputTax) => {
                expect(inputTax).to.be.deep.equal(taxToUpload);
                return Promise.resolve(wchResult);
              }
            }
          },
          conversation: {
            conversation: {
              updateWorkspace: (workspace, cb) => {
                expect(workspace).to.be.deep.equal(updatedWorkspace);
                cb.call(null, null, {text:"RESPONSE"});
              }
            }
          }
        });

      })
      .then(result => {
        expect(result).to.be.deep.equal({text:"RESPONSE"});
        done();
      });

    });


  });

});
