'use strict';
require('../helper');
const
  Mailer          = require('../../src/modules/ses_mailer/mailer'),
  nock            = require('nock');

describe('an error should be trown if', function() {

  it('the message does not have a destination (to)', function() {

    var smtp = new Mailer('accessKey', 'secretAccessKey');
    return smtp.sendEmail().should.be.rejectedWith('Destinatário da mensagem não informado.');

  });

  it('the message does not have a subject ', function() {

    var smtp = new Mailer('accessKey', 'secretAccessKey');
    return smtp.sendEmail('rpepato@img.com.br').should.be.rejectedWith('Assunto da mensagem não informado.');

  });

  it('the message does not have a body', function() {

    var smtp = new Mailer('accessKey', 'secretAccessKey');
    return smtp.sendEmail('rpepato@img.com.br', 'Assunto').should.be.rejectedWith('Corpo da mensagem não informado.');

  });

  it('the message format is other than text or html', function() {

    var smtp = new Mailer('accessKey', 'secretAccessKey');
    return smtp.sendEmail('rpepato@img.com.br', 'Assunto', 'Corpo', 'markdown').should
            .be.rejectedWith('Formato de e-mail inválido. Formatos válidos são "text" (padrão) e "html".');

  });

});

describe('with valid credentials ', function() {

  var smtp = new Mailer('validKey', 'validSecret');
  describe('and a valid message', function() {

    let message = {
      'to': 'rpepato@img.com.br',
      'subject': 'Assunto',
      'body': 'Corpo'
    };

    it('an email should be sent successfully', function() {
      nock('https://email.us-east-1.amazonaws.com:443')
       .post('/', 'Action=SendEmail&Destination.ToAddresses.member.1=rpepato%40img.com.br&Message.Body.Text.Data=Corpo&Message.Subject.Data=Assunto&Source=solucoes.cloud%40img.com.br&Version=2010-12-01')
       .reply(200, '<SendEmailResponse xmlns=\"http://ses.amazonaws.com/doc/2010-12-01/\">\n  <SendEmailResult>\n    <MessageId>0000015144b4ac98-4d19f36f-7337-4bad-84cd-f253459fb4e1-000000</MessageId>\n  </SendEmailResult>\n  <ResponseMetadata>\n    <RequestId>e4fca57f-945d-11e5-b164-eb26d865509a</RequestId>\n  </ResponseMetadata>\n</SendEmailResponse>\n');

      let expectedResult = {
        ResponseMetadata: {
          RequestId: 'e4fca57f-945d-11e5-b164-eb26d865509a'
        },
        MessageId: '0000015144b4ac98-4d19f36f-7337-4bad-84cd-f253459fb4e1-000000'
      };

      return smtp.sendEmail(message.to, message.subject, message.body).should
              .eventually.deep.equal(expectedResult);

    });

  })
  ;
});
