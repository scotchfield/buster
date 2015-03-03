'use strict';

var express = require('express'),
    request = require('request'),
    path = require('path'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),

    url = 'http://api.reddit.com/hot.json',
    headers = {'User-Agent': 'Buster/1.0.0 (by /u/scotchfield)'},

    app = express(), port = 8000;

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost/buster');

var Link = new mongoose.Schema({
  name: String,
  url: String,
  date: { type: Date, default: Date.now }
}),
LinkModel = mongoose.model('Link', Link),

getDataReddit = function (body) {
  var data = [];
  body.data.children.forEach(function (result) {
    //console.log(result);
    data.push({name: result.data.title, url: result.data.url});
  });
  return data;
},

doJsonRequest = function (url, headers, dataFunction) {
  request({url: url, headers: headers, json: true},
          function (error, response, body) {
    if (! error && response.statusCode === 200) {
      dataFunction(body).forEach(function (data) {
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
      });
    }
  });
},

updateDb = function () {
  doJsonRequest(url, headers, getDataReddit);
};


app.get('/link', function(req, res) {
  var query_time = {
    'date': {
      '$gte': new Date(new Date() - 1000 * 60 * 60 * 24)
    }
  };
  LinkModel.count(query_time, function (err, n) {
    var r = Math.floor(Math.random() * n);
    var query = LinkModel.find(query_time)
        .limit(1)
        .skip(r)
        .exec(function (err, doc) {
      res.send(doc);
    });
  });
});

app.get('/links', function(req, res) {
  LinkModel.find({}, function (err, docs) {
    res.send(docs);
  });
});

app.get('/update', function(req, res) {
  //doJsonRequest(url, headers, getDataReddit);
  updateDb();
});

app.listen(port, function() {
  console.log('Express server listening on port %d in %s mode',
              port, app.settings.env );
});

// Update database on start, and every 10 minutes afterwards.
updateDb();
setInterval(function () {
  updateDb();
}, 1000 * 60 * 10);