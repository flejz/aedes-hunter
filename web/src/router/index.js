module.exports = function (app) {
  app.use('/', require('./routes/index'));
  app.use('/test', require('./routes/test'));

  app.use('/api/v1',               require('./routes/api/v1/index'));
  app.use('/api/v1/votos',         require('./routes/api/v1/votos/index'));
  app.use('/api/v1/ocorrencia',    require('./routes/api/v1/minha_rua/ocorrencia'));
  app.use('/api/v1/comentario',    require('./routes/api/v1/minha_rua/comentario'));
};
