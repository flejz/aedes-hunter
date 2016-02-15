'use strict';

const
  router        = require('express').Router(),
  svc           = require('../../../../../modules/minha_rua/ocorrencia');

router.get('/list', function(req, res) {

  if (!req.query.email) {
    return res.status(500).send('E-mail não informardo');
  }

  svc.list(req.query.email).then(function(response){
    return res.status(200).send(response);
  }, function(err) {
    return res.status(500).send(err);
  });
});

router.post('/insert', function(req, res) {
  let feature = (function () {
    try {
      return JSON.parse(req.body.ocorrencia);
    } catch (e) {
      return;
    }
  }());

  if (!feature) {
    res.status(500).send('feature inválida');
    return;
  }

  let
    isUndef = function (v) { return typeof v === 'undefined'; },
    required_attributes = [
      'titulo'
      ,'comentario'
      ,'idusuario'
      ,'tipoocorrencia'
    ]
    ,errors = required_attributes.filter(function (p) {
      return isUndef(feature['attributes'][p]);
    });

  if (isUndef(feature.geometry) || (isUndef(feature.geometry.x) || isUndef(feature.geometry.y))) {
    errors.push('geometry.x', 'geometry.y');
  }
  if (errors.length) {
    res.status(500).send('Campos obrigatórios não informados: ' + errors.join(', '));
    return;
  }

  let
    attrs = feature['attributes']
    ,ocorrencia = {
      'attributes': {
        'TITULO' : attrs.titulo
        ,'COMENT' : attrs.comentario
        ,'IDUSUA' : attrs.idusuario
        ,'TIPOOCR': attrs.tipoocorrencia
      }
      ,'geometry': feature.geometry
    };

  try {
    svc.insert(ocorrencia).then(function(response) {
      res.status(200).send(response);
    }).catch(function(err) {
      res.status(500).send(err);
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

module.exports = router;
