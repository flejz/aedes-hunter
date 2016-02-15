'use strict';

const
  aws             = require('aws-sdk'),
  accessKeyId     = process.env.AWS_KEY,
  secretAccessKey = process.env.AWS_SECRET;

aws.config.accessKeyId = accessKeyId;
aws.config.secretAccessKey = secretAccessKey;
aws.config.region = 'us-east-1';

var doc = new aws.DynamoDB.DocumentClient();

console.log('trying to insert an user');

var users = [
{
  'TableName': 'Users',
  'Item': {
    'email': 'foo@bar.com',
    'nome': 'Foo Bar',
    'telefone': '(18) 25135951',
    'cpf': '26726732845',
    'cartao_sus': '12587654',
    'cargo': 'fiscal',
    'password': 'foo',
    'departamento': 'meioambiente'
  }
},
{
  'TableName': 'Users',
  'Item': {
    'email': 'social@bar.com',
    'nome': 'Social guy',
    'telefone': '(18) 25135951',
    'cpf': '26726732845',
    'cartao_sus': '12587654',
    'token': 'aksidjf834j293js8ah38ah371938237haj382938ay3762',
    'social_network': 'facebook'
  }
}
];

users.forEach(function(user){
  doc.put(user, function(err, data) {
    if (err) {
      console.log('Error adding user');
      console.log(JSON.stringify(err));
    } else {
      console.log('Success');
      console.log(data);
    }
  });  
});
