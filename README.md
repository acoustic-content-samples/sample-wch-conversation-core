# WCH Conversation Core
This package contains the essential functionality to create a chatbot based on the combination of the [Watson Conversation Service][watsonconversationurl] and [Watson Content Hub][watsoncontenthuburl]. Each essential part is available as a plugin. The plugin structure is based on the [architect framework][architecturl].

In detail this module contains all necessary server side logic to use the watson conversation service with any channel and framework you want. Additionally it provides an easy configuration to fetch the response the users sees from Watson Content Hub. This allows you to manage the responses across all channels in an easy to use User Interface provided by Watson Content Hub. Additionally you're not limited to text answers only. There is no limitation on rich media like images, pdfs, files, author information, ...

**Note:** This module is part of a tutorial showing how to implement a chatbot solution based on a CMS like [Watson Content Hub][watsoncontenthuburl]. So currently it's discouraged to use this module as is for production use cases without any modifications.

If you fork this repository and want to do end2end tests make sure to run the ```npm run manageCreds``` command. This will setup a local pair of credentials encrypted with your RSA key. If you don't have a RSA key yet follow [these instructions from Github.][generatesshurl]

# Get started

Using this module is pretty easy. The only thing you have to do is put your credentials in place. If you want to run it locally either write your own credentials plugin to fetch your credentials from wherever they are. Or execute the npm command `npm run setupCredentials` to use the default credentials management.

Using the module is as easy as this:
```javascript
  const {promisify} = require('util');
  const {dirname} = require('path');
  const {createApp, resolveConfig, loadConfig} = require('architect');
  const createAppAsync = promisify(createApp);
  const resolveConfigAsync = promisify(resolveConfig);
  const loadConfigAsync = promisify(loadConfig);

  const appSettings = {
    "generalSettings": {
      "defaultLanguage": "en",
      "supportedLanguages": [
       "de",
       "en"
      ],
      "developermode": true,
      "confLvl": "0.7",
      "credentialsStore": {
       "path": "./dch_vcap.json",
       "encrypted": true,
       "pathPrivKey": "C:\\Users\\SvenSterbling\\.ssh\\id_rsa"
      }
     },
     "conversationMiddleware": {
      "config": [
       {
        "workspaceId": "9db75ce4-a059-4f53-988d-de239eed10a0",
        "locale": "en"
       }
      ]
     }
  };

  // This is the config - you can make changes to the settings either by using the 
  // generated app_settings.json (when using the manageCreds command or changing the architectConfig directly
  const architectConfig = require('conversation-core')(appSettings);
  const coreBase = dirname(require.resolve('conversation-core'));

  resolveConfigAsync(architectConfig, coreBase)
  .then(createAppAsync)
  .then(wchcore => {
    // Access to your Watson Conversation Service Instances (This is the general approach to access any defined plugin)
    const conversation = wchcore.getService('conversation');
    // Access to Watson Content Hub
    const wchconversation =  wchcore.getService('wchconversation');

    conversation.get('en').sendMessage({message: 'Hello', context: {}})
    .then(watsonData => wchconversation.getWchConversationResponses(watsonData))
    .then(({conversationResp, locationResp, followupResp}) => {
      // The "general" answer is in the conversationResp
      // If you have a location specific answer use the locationResp instead of the conversationResp
      // If there are one time actions like asking for the username you have a followupResp as well as a conversationResp
      console.log(conversationResp.searchResult.documents[0].document.elements.text.values[0]) // => World
    })
    .catch(err => {
      console.log('Error ', err);
    });

  });
```

# Plugins

The following list give a short overview over all used plugins in the wch-conversation-core. This is mostly interessting if you want to create custom plugins to alter the behavior.

## clienttype

**Description:** A simple plugin that identifies the channel based on the incoming user message. Provides it's functionallity additionally as a conversation service middleware. It takes the message and conversationPayload object as given by the [conversationmiddleware][conversationmiddlewareurl] module before method. This plugin can be used as a simple blueprint on how to write your own middleware plugins for the conversationmiddleware plugin. (e.g. if you want to create custom actions that will call your internal service APIs)

**Requires:** `['logging']`

**Provides:** `['clientType', 'clientTypeMiddleware']`

**Architect Configuration Options:** None

**Methods:**
```javascript
  clientType.identify(message, conversationPayload)
  .then(clientType => {
    // Returns a simple object e.g. {clientType: 'rest'}
  });
```

## conversation

**Description:** Watson Conversation Plugin. Wraps the [watson-developer-cloud module][watsoncloudconversationurl] for ease of use inside of the chatbot core service. The plugin provides a locale specific map of conversation service instances to the correct conversation service instance. Fetches the credentials from the env plugin.

**Requires:** `['env', 'logging']`

**Provides:** `['conversation']`

**Architect Configuration Options:**<br/>
***serviceName*** - Name of the bluemix conversation service instance. The module fetches the credentials for authentication based on the given service name. The default name is *wch-conversation*.<br/>
***workspaceConfigs*** - Locale specific mapping from a locale to a Watson Conversation Service Workspace. See app_settings.json for a sample. 

**Methods:**
```javascript
  conversation.get('de').getWorkspace()
  .then(workspace => {
    // Returns a simple object containing the workspace
  });

  conversation.get('en').getIntents()
  .then(intents => {
    // Returns a simple object containing the intents
  });

  conversation.get('de-DE').getEntities()
  .then(entities => {
    // Returns a simple object containing the entities
  });

  // The conversation parameter provides direct access to the 
  // watson-developer-cloud node SDK. 
  conversation.get('de-DE').conversation.uploadWorkspace(...);
```

## conversationmiddleware

**Description:** Plugin that wraps the [Botkit Conversation Middleware][botkitconversationmiddlewareurl]. As part of this wrapper implementation you can plugin your own middleware where you can plugin custom actions before and after the call made against the conversation server. In order to reguster your middleware create a plugin which provides a before and/or after method and ends on the name 'Middleware' (e.g. clientTypeMiddleware). 

**Requires:** `['env', 'logging', '<yourMiddlewareName>Middleware', ...]`

**Provides:** `['conversationmiddleware']`

**Parameters:**<br/>
***serviceName*** - Name of the bluemix conversation service instance. The module fetches the credentials for authentication based on the given service name. The default name is *wch-conversation*.<br/>
***middlewareConfigs*** - Locale specific mapping from a locale to a Watson Conversation Service Workspace. See app_settings.json for a sample. 

**Methods:**
```javascript
  conversationMiddleware.get(locale).interpret(bot, message, function () {
    // message.watsonData contains the conversation service response
    // message.watsonError contains the error message in case something went wrong
  });
```

## credentials

**Description:** Local credentials plugin. Stores and retrieves the credentials required for all external services used. The current format is based on the bluemix service credentials. The file can optionally be encrypted with your local RSA private key for increased security.

**Requires:** `['logging']`

**Provides:** `['credentials']`

**Parameters:**<br/>
***pubKPath*** - Absolute or relative path to the public RSA key. In case of RSA this can also be the path to the private key.<br/>
***privKPath*** - Absolute or relative path to the private  RSA key.<br/> 
***encrypted*** - Option to decide if the local credentials should get encrypted with the private RSA key. If true the file is encrypted.<br/> 
***credsPath*** - Absolute or relative path to the credentials file to store retrieve the credentials object.<br/> 
***modifiable*** - Option to enable or disable the save/update capabilities of this plugin.<br/> 

**Methods:**
```javascript
  credentials.get({credsPath: resolve(options.credsPath)})
  .then(credentials => {
    // decrypted object with all credentials
  });
  
  credentials.store({credentials: appCredentials});
```

## developeractions

**Description:** Provides a conversationmiddleware plugin. Checks for the wchsync intent and triggers a synchronization between WCS and WCH.

**Requires:** `['logging', 'wchsync']`

**Provides:** `['developeractions', 'developeractionsMiddleware']`

**Parameters:**<br/>
***modeDev*** - If modeDev is true the synchronization will be triggered. Otherwise the synchronization is disabled.

## env

**Description:** Wrapper plugin around the [cfenv module][cfenvurl]. Provides the bluemix credentials for all external services used. While running locally we fetch the credentials through the credentials plugin. When running on bluemixthe credentials are managed through bluemix services.

**Requires:** `['logging', 'credentials']`

**Provides:** `['env']`

**Parameters:**<br/>
***credsPath*** - Relative or absolute path to the credentials file where all bluemix credentials are located. Not used when running on bluemix.

**Methods:**
```javascript
  let conversationCreds = env.getService('wch-conversation');
  let conversation = new ConversationV1({
    workspace_id: workspaceConfig.workspaceId,
    url: conversationCreds.credentials.url,
    username: conversationCreds.credentials.username,
    password: conversationCreds.credentials.password,
    version_date: ConversationV1.VERSION_DATE_2017_04_21
  });
```

## geolocation

**Description:** Wrapper plugin around the [Google Geolocation API][geolocationurl]. Provides location based services for the conversationmiddleware plugin. If the text contains a flag to set a geolocation the user input text is send to the geolocation api to retrieve the lat and long values.

**Requires:** `['logging', 'env']`

**Provides:** `['geolocation, 'geolocationMiddleware']`

**Architect Configuration Options:**<br/>
**serviceName** - Name of the bluemix conversation service instance. The module fetches the credentials for authentication based on the given service name. The default name is *wch-conversation*.<br/>
**enabled** - If true the geolocation service is enabled. Otherwise no geolocation will be set.<br/>

## languagetranslator

**Description:** Wrapper plugin around the [Watson Language Translator][languagetranslationurl]. If the message does not contain any language information this conversationmiddleware plugin will infer the language based on the user input text. This information is stored in the conversation context. If the identified lanugage is not supported we will use the fallback language.

**Requires:** `['logging', 'env']`

**Provides:** `['languageTranslator, 'languageTranslatorMiddleware']`

**Architect Configuration Options:**<br/>
**serviceName** - Name of the bluemix language translator service instance. The module fetches the credentials for authentication based on the given service name. The default name is *wch-conversation*.<br/>
**supportedLanguages** - All supported output languages.<br/>
**defaultLanguage** - The default language in case the user sets an unsupported language or we have no information at all about the language of the user.<br/>

## logging

**Description:** Simple logging module based on [debug][debugurl].

**Requires:** `[]`

**Provides:** `['logging']`

**Parameters:**<br/>
***packageName*** - The name of the package which is used for logging. Identificator that the logging is for a plugin from the wch-conversation-core.<br/>
***toFile*** - If set to true the debug log will also be stored in a file.

**Methods:**
```javascript
  const logger = logging('geolocation');
  logger.methodEntry('setup', options, imports);
  logger.methodExit('setup', returnvalue);
  logger.debug('Some debug message with %o', param);
```

## templating

**Description:** Templating engine based on [handlebars][handlebarsurl]. It uses the complete search result and parses it with the watsonData.

**Requires:** `[]`

**Provides:** `['templating']`

**Parameters:**<br/>
-

**Methods:**
```javascript
  templating.parseJSON(watsonData, searchResult);
```

## toneanalyzer

**Description:** Wrapper to use the [Watson Tone Analyzer][watsoncloudtoneanalyzernurl] inside of the conversationmiddleware. The result is stored in the conversation context before it's called.

**Requires:** `['env', 'logging']`

**Provides:** `['toneanalyzer', 'toneanalyzerMiddleware']`

**Parameters:**<br/>
**serviceName** - Name of the bluemix tone analyzer service instance. The module fetches the credentials for authentication based on the given service name. The default name is *wch-toneanalyzer*.<br/>
**enabled** -If true the geolocation service is enabled. Otherwise no geolocation will be set.<br/>

**Methods:**
```javascript
  toneanalyzer.identify(message, conversationPayload)
  .then(identifiedTone => {
    // Do something with the toneanylzer result
  });
```

## wch

**Description:** [Sample wch node wrapper][wchconnectorurl].

**Requires:** `['env', 'logging']`

**Provides:** `['wch']`

**Parameters:**<br/>
**serviceName** - Name of the bluemix tone analyzer service instance. The module fetches the credentials for authentication based on the given service name. The default name is *wch_config*.<br/>

**Methods:**
```javascript
  // Full access to the sample-wch-node-wrapper
  // Check out the samples over there
```

## wchconversation

**Description:** Plugin which takes a response from the Watson Conversation Service and returns a search result from WCH with the best matching answer/content. Based on the input a SOLR search query is created. Based on that it processes the found results, all attachments and location specific responses.

**Requires:** `['wch', 'logging', 'templating']`

**Provides:** `['wchconversation']`

**Parameters:**<br/>
**enableCache** - If true the response from WCH is cached for simillar requests.<br/>
**ttl** - Time until an element is removed from cache. In seconds. Default is 300 seconds (5 minutes).<br/>

**Methods:**
```javascript
  wchconversation.getWchConversationResponses(watsonData)
    .then(({locationResp, conversationResp, followupResp}) => {
        debug('locationResp %o', locationResp);
        return {respToUse: (locationResp.searchResult.numFound > 0) ? locationResp : conversationResp, followupResp};
    });
```

## wchsync

**Description:** Synchronization plugin of the Watson Conversation Service Structure to Watson Content Hub. The structure of the Conversation Service is represented as multiple taxonomies in WCH. (A taxonomy per concept) Currently the synchronization is one way only. (WCS --> WCH)

**Requires:** `['wch', 'logging', 'conversation']`

**Provides:** `['wchsync']`

**Parameters:**<br/>
**mainWorkspace** - Locale of the main workspace that will be used for the synchronization. Normally should be your default language.<br/>

**Methods:**
```javascript
  wchsync.push({fromSys:'WCS', toSys:'WCH'})
  .then(result => {
    // Sync succesfull
  });
```

[watsonconversationurl]: https://www.ibm.com/watson/services/conversation/
[watsoncontenthuburl]: https://www.ibm.com/de-de/marketplace/cloud-cms-solution
[architecturl]: https://github.com/c9/architect
[conversationmiddlewareurl]: https://github.com/watson-developer-cloud/botkit-middleware
[watsoncloudconversationurl]: https://github.com/watson-developer-cloud/node-sdk/#conversation
[watsoncloudtoneanalyzernurl]: https://github.com/watson-developer-cloud/node-sdk/#tone-analyzer
[generatesshurl]: https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/
[botkitconversationmiddlewareurl]:https://github.com/watson-developer-cloud/botkit-middleware
[cfenvurl]:https://github.com/cloudfoundry-community/node-cfenv
[geolocationurl]:https://developers.google.com/maps/documentation/geolocation/intro?hl=de
[languagetranslationurl]:https://www.ibm.com/watson/services/language-translator/
[debugurl]:https://github.com/visionmedia/debug
[handlebarsurl]:http://handlebarsjs.com/
[wchconnectorurl]:https://github.com/ibm-wch/sample-wch-node-wrapper
