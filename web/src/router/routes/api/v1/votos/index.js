'use strict';

const
  express       = require('express'),
  router        = express.Router(),
  svc           = require('../../../../../modules/votos/voto'),

  modules       = {
    0: 'Minha Rua',
    1: 'Ações do Município',
    2: 'Serviços ao Cidadão'
  },

  voteValue     = {
    up: 1,
    down: -1
  };

function insert (req, res, vote) {

  let
    module_id    = req.params.moduleid,
    item_id      = req.params.itemid,
    user         = req.body.email;

  if (!user || !(module_id in modules && item_id.length == 36 /* guid with hyphens */ )) {
    return res.status(400).json({
      result   : 'error',
      error    : 'Invalid Parameters'
    });
  }

  let
    model = {
      EMAIL  : user,
      MODULO : module_id,
      ITEM   : item_id,
      DATA   : (new Date()).toJSON(),
      VOTO   : vote
    };

  Promise.resolve().then(function () {
    return svc.submit(model);
  }).then(function () {
    return svc.totalize(model);
  }).then(function (r) {
    res.status(200).json(r);
  }).catch(function (e) {
    res.status(200).json(e);
  });
}

router.post('/:moduleid/:itemid/up', function (req, res) {
  insert(req, res, voteValue.up);
});

router.post('/:moduleid/:itemid/down', function (req, res) {
  insert(req, res, voteValue.down);
});

module.exports = router;
