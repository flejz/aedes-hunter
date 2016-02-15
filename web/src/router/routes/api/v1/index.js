const
  express = require('express'),
  router = express.Router(),
  user    = require('../../../../modules/security/user');

router.post('/signin', function(req, res) {
  if (!req.body['email']) {
    res.status(500).send('Identificador de usuário não informado');
    return;
  }

  if (!req.body['password'] && !req.body['provider']) {
    res.status(500).send('Senha ou provider de acesso não informado');
    return;
  }

  var
    email   = req.body['email'],
    pwd     = (req.body['password']) ? req.body['password'] : null,
    params = { };

  user.fields.forEach(function(field){
    if (req.body[field]) {
      params[field] = req.body[field];
    }
  });

  return user.logon(email, pwd, params).then(function(response) {
    return res.status(200).send(response);
  }).catch(function(err) {
    return res.status(500).send(err);
  });

});

router.post('/signup', function(req, res) {

  if (!req.body['email']) {
    return res.status(500).send('Email não informado');
  }

  if (!req.body['password']) {
    return res.status(500).send('Método de autentsicação inválido');
  }

  var params = { };
  user.fields.forEach(function(field){
    if (req.body[field]) {
      params[field] = req.body[field];
    }
  });

  return user.signup(params).then(function(response) {
    return res.status(200).send(response);
  }).catch(function(err) {
    return res.status(500).send(err);
  });
});

module.exports = router;
