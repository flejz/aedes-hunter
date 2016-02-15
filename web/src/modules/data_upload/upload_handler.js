// [avidotto]
'use strict';

const
  Uploader = require('./upload_queue'),
  request  = require('../esri_request/request'),
  util     = require('util'),
  _        = require('lodash');

function upload (dataUpload) {
  return new Promise(function(resolve, reject) {
    try {
      _shallowAnalysis(dataUpload);
      // parse data to feature format
      let features = _parse(dataUpload);
      // if operation is update then set objectids,
      // else resolve immediately
      _fetch(features, dataUpload)
        .then(function(featuresToSend){
          let
            // if more then one batch (set of features) is created,
            // the upload send one batch per time.
            batches = _splitInBatches(features, process.env.BATCH_SIZE_UPLOAD || featuresToSend.length),
            url     = util.format('%s%s', dataUpload.serviceUrl, dataUpload.operationType.toUpperCase() === 'INSERT' ? 'addFeatures' : 'updateFeatures');

          // init uploader
          new Uploader(url, batches, {
            token: dataUpload.token
          })
          // and start sending operation
          .send().then(resolve)
                 .catch(function (errorinfo) {
                   // errorinfo contains partialResults (batches successfully performed) if you need to perform some treatment.
                   // For now, none treatment is done and the error is sent to orchestrator.
                   reject(errorinfo.error);
                 });
        })
        .catch(function (err) {
          // reject with formatted error
          reject(_formatError(err));
        });

    } catch (e) {
      // reject with formatted error
      reject(_formatError(e));
    }
  });
}

function _fetch (features, options) {
  // if operation is update, query features to set objectids.
  // if operations is insert, resolve immediately
  return new Promise(function(resolve, reject) {
    if('UPDATE' === options.operationType.toUpperCase()) {
      _getForUpdate(features, options)
        // search the objectids
        // before sending to uploader.
        .then(function (response) {
          let
            hashMap = _getHashMap(response.features, options.primaryKey);

          _setObjectIds(features, hashMap);
          // after set, release features to uploader
          resolve(features);
        })
        .catch(reject);
    } else {
      resolve(features);
      // IMPORTANT!
      // ONLY WORKS with features without relationship.
      // Make this work when features contains relationship is a hard task.
      // For now, we decide implement this in the future.
    }
  });
}

function _getForInsert (features, options) {
  // TODO(alex):
  // Get service definition from options,
  // from service definition, get informations about related tables
  // Not Implemented.
  function _getClause() {
    return util.format('%s IN(%s)',
      options.primaryKey,
      _.map(features, function (f) { return f.attributes[options.primaryKey]; }).join(',')
    );
  }
  return new Promise(function(resolve, reject) {
    let bodyreq = {
      f: 'json',
      returnGeometry: false,
      outFields: util.format('%s,%s', 'GlobalID,OBJECTID', options.primaryKey),
      where: _getClause()
    };
    if(options.token) {
      bodyreq.token = options.token;
    }
    let action = util.format('%s%s', options.serviceUrl, 'query');
    request.get(action, bodyreq)
           .then(resolve)
           .catch(reject);
  });
}

function _getForUpdate (features, options) {
  // Get objectIds of all features that will be updated.
  function _getClause() {
    let isText = !_.isNumber(features[0].attributes[options.primaryKey]);
    return util.format('%s IN(%s%s%s)', options.primaryKey
      , isText ? '\'' : ''
      , _.map(features, function (f) { return f.attributes[options.primaryKey]; }).join(isText ? '\',\'' : ',')
      , isText ? '\'' : ''
    );
  }
  return new Promise(function(resolve, reject) {
    let
      clause  = _getClause(),
      bodyreq = {
        f: 'json',
        returnGeometry: false,
        outFields: options.primaryKey == 'OBJECTID' ? options.primaryKey : util.format('%s,%s', 'OBJECTID', options.primaryKey),
        where: clause
      };
    if(options.token) {
      bodyreq.token = options.token;
    }

    let action = util.format('%s%s', options.serviceUrl, 'query');
    request.get(action, bodyreq)
           .then(function (response) {
             if (!response.features.length) {
               throw Error('None features to update.');
             }
             if (response.features.length < features.length) {
               let
                 compare   = _.map(response.features, function (feat) { return feat.attributes[options.primaryKey]; }),
                 source    = _.map(features,          function (feat) { return feat.attributes[options.primaryKey]; });

               throw Error(util.format('Unmatch features was found (%s)', _.difference(source, compare).join(',')));
             }
             resolve(response);
           })
           .catch(reject);
  });
}

function _getHashMap (features, primaryKey) {
  // TODO(alex)
  // [ Features] requested and [ features ] to update must have the same length.
  var hash = { pk: primaryKey };
  _.forEach(features, function (feature) {
    let pk = feature.attributes[primaryKey];
    if(pk in hash) {
      throw Error(
       util.format('%s (%s) is not a primary key. Duplicated values was found.', primaryKey, pk));
    }
    hash[pk] = feature.attributes.OBJECTID;
  });
  return hash;
}

function _setObjectIds (features, hashMap) {
  // for each feature, get in hashMap your objectid.
  _.forEach(features, function (feature) {
    let pk = feature.attributes[hashMap.pk];
    feature.attributes.OBJECTID = hashMap[pk];
  });
  return features;
}

function _splitInBatches (data, batchSize) {
  let batches = [];
  while (data.length) {
    batches.push(data.splice(0, batchSize));
  }
  return batches;
}

function _shallowAnalysis (data) {
  let
    requireds = [
      'values',
      'headers',
      'ignoreFields',
      'primaryKey',
      'serviceUrl'
    ]
  ;
  for (let prop in requireds) {
    if (!(requireds[prop] in data)) {
      throw Error(requireds[prop] + ' not found in data. Required: ' + requireds.join(', '));
    }
  }
  let positions = data.headers.length;
  if (!positions) {
    throw Error('data.headers is empty');
  }
  if (!data.values.length){
    throw Error('data.values is empty');
  }
  for (let i = 0, row; row = data.values[i];i++) {
    for (let z = 0, l = positions; z < l; z++) {
      if (positions != row.length){
        throw Error('data.values[' + i + '] has invalid length');
      }
    }
  }
}

function _parse (dataUpload) {
  // Build features objects with the ESRI format expected.

  let
    attrInfo = _getAttributesInfo(dataUpload.headers, dataUpload.ignoreFields),
    // fill the attrs
    features = _fillAttributes(attrInfo, dataUpload.values);
  if (attrInfo.shpIndex) {
    // if has SHAPE column, fill the geometries
    features = _fillGeometries(features, dataUpload.values, attrInfo.shpIndex);
  }
  return features;
}

function _getAttributesInfo (headers, ignore) {
  // Get info of attributes that will be used
  // as base of parser and fill fields.

  let
    attrs = {},
    position = headers.length - 1,
    ignoreMap = null,
    info = {},
    shpIndex;

  // initialize hash to ignore fields, if ignore exists
  if(ignore && ignore.length) {
    ignoreMap = {};
    for (var i in ignore) {
      ignoreMap[ignore[i]] = 1;
    }
  }

  while (~position) {
    let key = headers[position];
    if (key === 'SHAPE') {
      shpIndex = position;
      --position;
      continue;
    }
    if (!ignoreMap || !ignoreMap[key]) {
      attrs[key] = null;
      // map index
      info[key] = position;
    }
    --position;
  }
  return {
    attrs: attrs,
    info: info,
    ignore: ignoreMap,
    shpIndex: shpIndex
  };
}

function _fillAttributes (attrsInfo, values) {
  let
    items = [],
    rows = values.length - 1,
    fill = function (row) {
      if(!~row) return;
      let item = JSON.parse(
        JSON.stringify({
          attributes: attrsInfo.attrs
        })
      );
      for (var attr in attrsInfo.info) {
        item.attributes[attr] = values[row][attrsInfo.info[attr]];
      }
      items.push(item);
      fill(--row);
    };
  fill(rows);
  // keep dataUpload order
  return items.reverse();
}

function _fillGeometries (features, values, shpIndex) {
  if (!shpIndex) throw Error('shpIndex is undefined');
  // Fill geometries based on index of array of SHAPE column.
  for (var i = 0, f; f = features[i]; i++) {
    f.geometry = values[i][shpIndex];
  }
  return features;
}

function _formatError (err) {
  let
    e = null;
  if (err instanceof Error) {
    e = { errors: [ err.message ], result: 'fail', source: err };
  }
  return e || err;
}


exports.upload             = upload;

exports._splitInBatches    = _splitInBatches;
exports._shallowAnalysis   = _shallowAnalysis;
exports._parse             = _parse;
exports._getAttributesInfo = _getAttributesInfo;
exports._fillAttributes    = _fillAttributes;
exports._getForUpdate      = _getForUpdate;
exports._getHashMap        = _getHashMap;
exports._setObjectIds      = _setObjectIds;
exports._fetch             = _fetch;
