'use strict';

const
  comments        = require('./comentario'),
  lookup          = require('../esri_request/table_lookup'),
  vote            = require('../votos/voto');

module.exports = new function() {
  let self = this;
  self.find = function(params) {
    return new Promise(function(resolve, reject){
      let
        voteStatusCandidate = {
          EMAIL: params['email'],
          ITEM: params['itemId'],
          MODULO:params['moduleId']
        },
        commentsPromise = comments.findAllForOcurrence(params['itemId']),
        tableLookupPromise = lookup.findOne(params),
        votePromise = vote.getVoteStatus(voteStatusCandidate);

      Promise.all([
        commentsPromise,
        tableLookupPromise,
        votePromise
      ]).then(function(results){
        if (results[0].result !== 'success') {
          reject(results[0]);
        }

        if (results[1].result !== 'success') {
          reject(results[1]);
        }

        resolve({
          comments: results[0].data,
          item: results[1].data,
          upvote: results[2] === 1,
          downvote: results[2] === -1
        });
      }).catch(function(err) {
        reject(err);
      });
    });
  };
  return {
    find: function(params) {
      return self.find(params);
    }
  };
};
