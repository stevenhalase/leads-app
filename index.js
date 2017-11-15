const express = require('express');
const app = express();
var request = require('request');
var rp = require('request-promise');
var bodyParser = require('body-parser');

const path = require('path');
const port = process.env.PORT || 3090;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + '/www'))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/www/index.html'));
});

app.post('/api/fullcontact/domain', function(req, res) {

  if (typeof req.body.businessURL !== 'undefined') {
    var businessURL = encodeURIComponent(req.body.businessURL);

    var fullContactUrl = 'https://api.fullcontact.com/v2/company/lookup.json?domain=' + businessURL;

    var fullContactOptions = {
        method: 'GET',
        uri: fullContactUrl,
        headers: {
          'X-FullContact-APIKey': '29ecdaae61bf307a'
        }
    };
    
    rp(fullContactOptions)
      .then(function(data) {
        console.log(data)
        res.json(data);
      })
      .catch(function(err) {
        console.log(err);
        res.json(err);
      })
  }

})

app.post('/api/hunter/domain', function(req, res) {

  if (typeof req.body.businessURL !== 'undefined') {
    var businessURL = encodeURIComponent(req.body.businessURL);

    var hunterUrl = 'https://api.hunter.io/v2/domain-search?domain=' + businessURL + '&api_key=ae2f419b22fcf725379b54db12a63212d008c72d&limit=50';

    var hunterOptions = {
        method: 'GET',
        uri: hunterUrl
    };
    
    rp(hunterOptions)
      .then(function(data) {
        console.log(data)
        res.json(data);
      })
      .catch(function(err) {
        console.log(err);
        res.json(err);
      })
  }

})

app.post('/api/anymail/domain', function(req, res) {

  if (typeof req.body.businessURL !== 'undefined') {
    var businessURL = req.body.businessURL;

    var anymailUrl = 'https://api.anymailfinder.com/v3.1/search/domain.json';

    var anymailOptions = {
        method: 'POST',
        uri: anymailUrl,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-Api-Key': '92e943a739f8bb3f648d7273f75e7273c6b6d08e'
        },
        form: { domain: businessURL }
    };
    
    rp(anymailOptions)
      .then(function(data) {
        console.log(data)
        res.json(data);
      })
      .catch(function(err) {
        console.log(err);
        res.json(err);
      })
  }

})

app.post('/api/pipl', function(req, res) {

  if (typeof req.body.emailAddress !== 'undefined') {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var emailAddress = req.body.emailAddress;

    var formData = {
      key: 'x8vc6vjl0eykr67j1swdc5m3'
    };

    if (firstName && firstName !== '' && lastName && lastName !== '') {
      formData.first_name = firstName;
      formData.last_name = lastName;
    }

    if (emailAddress && emailAddress !== '') {
      formData.email = emailAddress;
    }

    var piplUrl = 'http://api.pipl.com/search';

    var piplOptions = {
        method: 'POST',
        uri: piplUrl,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        form: formData
    };
    
    rp(piplOptions)
      .then(function(data) {
        console.log(data)
        res.json(data);
      })
      .catch(function(err) {
        console.log(err);
        res.json(err);
      })
  }

})

app.listen(port, () => {
    console.log('Server started at http://localhost:' + port);
})