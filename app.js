var express = require('express'),
    request = require('request'),
    mongoose = require('mongoose');

var url = 'http://api.reddit.com/hot.json',
    headers = {'User-Agent': 'Buster/1.0.0 (by /u/scotchfield)'};

var app = express(), port = 8000;

mongoose.connect('mongodb://localhost/buster');

var Link = new mongoose.Schema({
  name: String,
  url: String,
  date: { type: Date, default: Date.now }
});
var LinkModel = mongoose.model('Link', Link);

var getDataReddit = function (body) {
  var data = [];
  body.data.children.forEach(
    function (result) {
      console.log(result);
      data.push({name: result.data.title, url: result.data.url});
    }
  );
  return data;
}

var doJsonRequest = function (url, headers, dataFunction) {
  request({url: url, headers: headers, json: true},
          function (error, response, body) {
    if (! error && response.statusCode === 200) {
      dataFunction(body).forEach(
        function (data) {
          LinkModel.find({name: data.name, url: data.url},
                         function (err, docs) {
            if (docs.length === 0) {
              var link = new LinkModel({name: data.name, url: data.url});
              link.save(function (err) {});
              console.log('* Added: ' + data.name);
            } else {
              console.log('Existing: ' + data.name);
            }
          });
        }
      )
    }
  });
};

//doJsonRequest(url, headers, getDataReddit);


app.get('/', function (req, res) {
  res.send('hello world');
});

app.get('/links', function(req, res) {
  LinkModel.find({}, function (err, docs) {
    res.send(docs);
  });
});

app.get('/update', function(req, res) {
  doJsonRequest(url, headers, getDataReddit);
});  

app.listen(port, function() {
  console.log('Express server listening on port %d in %s mode',
              port, app.settings.env );
});
