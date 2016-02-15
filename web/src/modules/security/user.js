'use strict';

const
  wagner  = require('wagner-core'),
  _       = require('lodash');

module.exports = new function() {
  let
    self = this;

  return wagner.invoke(function (amazon) {

    self.exists = function(email) {
      return new Promise(function(resolve, reject) {
        var
          params = {
            'TableName': 'Users',
            'KeyConditionExpression': '#mail = :email',
            'ExpressionAttributeNames': {
              '#mail': 'email'
            },
            'ExpressionAttributeValues': {
              ':email': email.toLowerCase()
            }
          };

        return self.query(params).then(function(res) {
          resolve(res.Items.length > 0);
        }, function(err) {
          reject(err);
        });
      });

    },

    self.query = function(params) {
      return new Promise(function(resolve, reject){
        let
          doc = amazon.dynDbDocumentClient();
        doc.query(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    },

    self.insert = function(params) {
      return new Promise(function(resolve, reject){

        let
          doc = amazon.dynDbDocumentClient();
        doc.put(params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              result: 'success'
            });
          }
        });
      });
    },

    self.ownLogon = function(email, pwd) {
      return new Promise(function(resolve){
        let
          doc = amazon.dynDbDocumentClient(),
          params = {
            TableName: 'Users',
            FilterExpression: '#mail = :email and #pwd = :pwd',
            ExpressionAttributeNames: {
              '#mail': 'email',
              '#pwd': 'password'
            },
            ExpressionAttributeValues: {
              ':email': email.toLowerCase(),
              ':pwd': pwd
            }
          };

        doc.scan(params, function(err, data) {
          if (err) {
            //TODO: What to return and what to log?
            resolve({
              result: 'error',
              error: 'Credenciais inválidas'
            });
          } else {
            if (data.Items.length !== 1) {
              // Too many users returned
              resolve({
                result: 'error',
                error: 'Credenciais inválidas'
              });
            } else {
              resolve({
                result: 'success',
                data: {
                  nome: data.Items[0]['nome']
                }
              });
            }
          }
        });
      });
    },

    self.signup = function(parameters) {
      return new Promise(function(resolve, reject) {
        let
          params = {
            'TableName': 'Users',
            'Item': { }
          };

        _.keysIn(parameters).forEach(function(param) {
          params['Item'][param] = parameters[param];
        });

        self.exists(params['Item']['email']).then(function(exists) {
          if (exists) {
            reject({
              'result': 'error',
              'error': 'Usuário já existente'
            });
          }
          return self.insert(params);

        }).then(function() {
          resolve({
            result: 'success'
          });
        }).catch(function(err) {
          reject(err);
        });
      });
    };

    self.socialLogon = function(email, parameters) {
      return new Promise(function(resolve, reject){
        let
          doc = amazon.dynDbDocumentClient(),
          params = {
            'TableName': 'Users',
            'KeyConditionExpression': '#mail = :email',
            'ExpressionAttributeNames': {
              '#mail': 'email',
              '#provider': 'provider'
            },
            'FilterExpression': 'attribute_exists(#provider)',
            'ExpressionAttributeValues': {
              ':email': email.toLowerCase()
            }
          };

        doc.query(params, function(err, data) {
          if (err) {
            //TODO: What to return and what to log?
            reject(err);
          } else {
            if (data.Items.length !== 1) {
              // Fallback pra signup
              parameters['email'] = email;
              self.signup(parameters).then(function() {
                resolve({
                  result: 'success',
                  data: {
                    nome: parameters['nome']
                  }
                });
              }, function(err) {
                reject(err);
              });
            } else {
              resolve({
                result: 'success',
                data: {
                  nome: data.Items[0]['nome']
                }
              });
            }
          }
        });
      });
    };

    return {
      fields: [
        'email',
        'nome',
        'telefone',
        'cpf',
        'cartao_sus',
        'cargo',
        'password',
        'departamento',
        'provider'
      ],

      logon: function(email, password, params) {
        return new Promise(function(resolve, reject) {
          try {
            let promise;
            if (!!params && !!params['provider']) {
              promise = self.socialLogon(email, params);
            } else {
              promise = self.ownLogon(email, password);
            }
            return promise.then(function(res) {
              resolve(res);
            }).catch(function(err) {
              reject(err);
            });
          } catch (err) {
            reject(err);
          }
        });
      },

      signup: function(params) {
        return new Promise(function(resolve) {
          return self.signup(params).then(function() {
            resolve({
              result: 'success'
            });
          }, function(err) {
            resolve(err);
          });
        });
      }

    };

  });
};
