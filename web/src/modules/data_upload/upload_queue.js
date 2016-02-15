// [avidotto]
'use strict';

const
  request  = require('../esri_request/request'),
  Iterator = require('./promise_iterator'),
  _        = require('lodash');

/**
 * @constructor
 */
module.exports =
  function QueueUploader (serviceUrl, features, options) {

  // Shallow validation...
    if (!serviceUrl)
      throw Error('serviceUrl is required');
    if (!features || !features.length)
      throw Error('features is required');

    let
      settings = {
        f             : 'json',  // default response
        stopOnFailure : true,    // by default, any failure will stop the process.
        token         : null     // required for private services
      };

    // Merge settings
    _.assign(settings, options || {});

    /**
     * @return Object
     */
    function _getBodyRequest(features) {
      let body = { f: settings.f };
      if (settings.token) {
        body.token = settings.token;
      }
      if (settings.stopOnFailure) {
        // rollback applies to current batch in execution.
        // this does not rollback previous successfully operations.
        body.rollbackOnFailure = true;
      }
      body.features = _.isString(features) ?
                        features :
                        JSON.stringify(features);
      return body;
    }

    /**
     * @return Boolean
     */
    function _anyFailure (r) {
      return _.some(r[~serviceUrl.toUpperCase().indexOf('/UPDATEFEATURES') ? 'updateResults':'addResults'], function (item) {
        return !item.success;
      });
    }

    /**
     * @return Promise
     */
    function _send (current) {
      return new Promise (function (resolve, reject) {
        try {
          // send request
          let body = _getBodyRequest(current);
          request.post(serviceUrl, body)
            .then(function (response) {
              let
                fail = settings.stopOnFailure ?
                        _anyFailure(response) : false;

              fail ?
                // send errors to iterator
                reject([ 'Upload fails', JSON.stringify(response) ]) :
                resolve(response);
            })
           .catch(function (err) {
             reject(['Post fails', err]);
           });
        } catch (err) {
          reject(['Unexpected error', err]);
        }
      });
    }

    return {
      send: function () {
        let promise =
          new Iterator(features, _send);

        return promise;
      }
    };
  };
