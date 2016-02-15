'use strict';

const
  router        = require('express').Router(),
  comment       = require('../../../../../modules/minha_rua/comentario'),
  consulta      = require('../../../../../modules/minha_rua/consulta_ocorrencia');

router.post('/add', function(req, res) {

  if (!req.body['email']) {
    return res.status(500).send('E-mail não informardo');
  }

  if (!req.body['occurrenceId']) {
    return res.status(500).send('Identificador da ocorrência não informado');
  }

  if (!req.body['comment']) {
    return res.status(500).send('Comentário não informado');
  }

  let
    params = {
      email:          req.body['email'],
      occurrenceId:   req.body['occurrenceId'],
      comment:        req.body['comment']
    };


  return comment.add(params).then(function(response){
    return res.status(200).send(response);
  }, function(err) {
    return res.status(500).send(err);
  });
});

router.get('/:moduleid/:itemid/', function (req, res) {

  if (!( req.query && req.params.itemid && req.params.itemid.length == 36 )) {
    return res.status(400).json({
      result   : 'error',
      error    : 'Invalid Parameters'
    });
  }

  consulta.find({ 'itemId': req.params.itemid, 'moduleId': req.params.moduleid, 'email': req.query.email }).then(
    function (r) {
      return res.status(200).json({
        result : 'success',
        data   : r
      });
    },
    function (e) {
      return res.status(500).send({
        result : 'error',
        error  : e
      });
    }
  );
});

module.exports = router;
