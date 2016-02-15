'use strict';

const
  Amazon        = require('../aws/configured_aws'),
  sender        = 'solucoes.cloud@img.com.br';

module.exports = function(awsKey, awsSecret, awsRegion) {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  let
    messageBody = function(format, body) {
      let
        messageBodyBlock = {},
        key = format.capitalize();

      messageBodyBlock[key] = {
        'Data': body
      };

      return messageBodyBlock;
    },
    aws = new Amazon(awsKey, awsSecret, awsRegion),
    ses = aws.ses();

  return {
    sendEmail: function(to, subject, body, format) {
      return new Promise(function(resolve, reject) {

        let
          messageFormat = format || 'text';

        if (!to) {
          reject(Error('Destinatário da mensagem não informado.'));
        }

        if (!subject) {
          reject(Error('Assunto da mensagem não informado.'));
        }

        if (!body) {
          reject(Error('Corpo da mensagem não informado.'));
        }

        if (['html', 'text'].indexOf(messageFormat.toLowerCase()) === -1) {
          reject(Error('Formato de e-mail inválido. Formatos válidos são "text" (padrão) e "html".'));
        }

        var params = {
          'Source': sender,
          'Destination': {
            'ToAddresses': to.split(';')
          },
          'Message': {
            'Body': messageBody(messageFormat, body),
            'Subject': {
              'Data': subject
            }
          }
        };

        ses.sendEmail(params, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }
  };
};
