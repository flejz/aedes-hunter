'use strict';

const
  url         = 'http://services6.arcgis.com/um4RQnU40VyzFeR6/arcgis/rest/services/pdg_dev_service/FeatureServer/4',

  wagner      = require('wagner-core'),
  request     = wagner.invoke(function (agolRequest) { return agolRequest; }),
  svcOcorr    = require('../minha_rua/consulta_ocorrencia'),

  util        = require('util'),
  tbLookup    = require('../esri_request/table_lookup');

function _formatResp (promise) {
  return promise.then(
    function (r) {
      return Promise.resolve({
        result : 'success',
        data   : r
      });
    },
    function (e) {
      return Promise.reject({
        result : 'error',
        error  : e
      });
    }
  );
}

function _validAndSubmit(vote) {
  return getVoteStatus(vote).then(function (status) {
    if (status === 0) {
      return _send(vote);
    } else {
      return Promise.reject('Usuário já votou neste item');
    }
  });
}

function _send (vote) {
  let body = {
    f: 'json',
    features: JSON.stringify([{
      attributes: vote
    }])
  };
  return request.post(util.format('%s/addFeatures', url), body);
}

function getVoteStatus (voteCandidate) {
  // Check if the user has voted for this item previously
  // 0 = allowed, 1 = has up vote, -1 = has down vote
  let clause = {
    f: 'json',
    outFields: '*',
    where: util.format('EMAIL=\'%s\' AND ITEM=\'%s\' AND MODULO=%s', voteCandidate.EMAIL, voteCandidate.ITEM, voteCandidate.MODULO)
  };
  return request.get(util.format('%s/Query', url), clause).then(function (result) {
    return 'features' in result && result.features.length         ?
              Promise.resolve(result.features[0].attributes.VOTO) :
              Promise.resolve(0);

  });
}

function totalize (model) {
  return _formatResp (
    svcOcorr.find({ 'itemId': model.ITEM, 'moduleId': model.MODULO, 'email': model.EMAIL })
      .then(function (result) {

        let
          item = result.item.feature.features[0],
          op   = 1 == model.VOTO ? 'UPVOTE' : 'DOWNVO';

        item.attributes[op]++;

        return request.post(util.format('%s/updateFeatures',  tbLookup.getUrl(model.MODULO)), {
          f: 'json',
          features: JSON.stringify(item)
        });
      })
  );
}

function submit (vote) {
  return _formatResp (
    _validAndSubmit(vote)
  );
}

exports.getVoteStatus = getVoteStatus;
exports.submit        = submit;
exports.totalize      = totalize;
