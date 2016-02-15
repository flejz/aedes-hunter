'use strict';

const
  dependencies    = require('../src/modules/factories/factory'),
  chai            = require('chai'),
  util            = require('util'),
  nock            = require('nock'),
  chaiAsPromised  = require('chai-as-promised');

dependencies.register();
chai.should();
chai.use(chaiAsPromised);

beforeEach(function() {
  nock.cleanAll();
});

let
  message = 'Variável de ambiente "%s" não configurada.\n' +
            'Adicione a linha "export %s=\'Valor da Variável Aqui\'" ' +
            'no seu arquivo ~/.zshrc e execute o comando \'source ~/.zshrc\'',
  envVars = ['AWS_KEY', 'AWS_SECRET', 'AWS_REGION', 'AGOL_APPID', 'AGOL_APPSECRET'];

envVars.forEach(function(item) {
  if (!process.env[item]) {
    throw Error(util.format(message, item, item));
  }
});
