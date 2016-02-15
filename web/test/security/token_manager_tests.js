'use strict';
require('../helper');
const
  nock          = require('nock'),
  tokenManager  = require('../../src/modules/security/token_manager');

describe('when acquiring a token', function() {

  let request;

  beforeEach(function() {
    request = nock('https://www.arcgis.com/sharing/rest/oauth2/token');
  });

  describe('with invalid credentials', function() {
    it ('an error should be reported', function() {

      request
        .post('/', 'client_id=fakeUser&client_secret=fakeSecret&grant_type=client_credentials&expiration=7200')
        .reply(200, { error:
                      { code: 400,
                        error: 'invalid_client_id',
                        error_description: 'Invalid client_id',
                        message: 'Invalid client_id',
                        details: []
                      }
                    }
              );

      return tokenManager.getToken('fakeUser', 'fakeSecret').should.be.rejectedWith('Acesso negado ao recurso');

    });
  });

  describe('with valid credentials', function() {
    it ('a token should be returned', function() {
      let access_token = 'oxix4vDRA_J9WcLWopPXBWufCjr72TPu77AJw4r7Ma-M_Dlwy0ZIqtMcpL99RAQ4sXmXsi247jQWjZxRprCKUy08Qr0soc-fi2gu7BUPwOcFeSRfLjS-43uRuXdXHJIm';

      request
        .post('/', 'client_id=validUser&client_secret=validSecret&grant_type=client_credentials&expiration=7200')
        .reply(200, { access_token: access_token,
                      expires_in: 7200 }
              );

      return tokenManager.getToken('validUser', 'validSecret').should
                .eventually.equal(access_token);
    });
  });
});
