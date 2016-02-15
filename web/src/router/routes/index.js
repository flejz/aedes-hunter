var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', {
    title             : 'NÃO ao Aedes Aegypti!'
  });
});

module.exports = router;
