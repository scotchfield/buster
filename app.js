'use strict';

var express = require('express'),
    request = require('request'),
    path = require('path'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),

    headers = {'User-Agent': 'Buster/1.0.0 (by /u/scotchfield)'},

    app = express(), port = 8000,

Link = new mongoose.Schema({
  name: String,
  url: String,
  date: { type: Date, default: Date.now }
}),
LinkModel = mongoose.model('Link', Link),

addLink = function (name, url) {
  LinkModel.find({name: name, url: url}, function (err, docs) {
    if (docs.length === 0) {
      var link = new LinkModel({name: name, url: url});
      link.save(function (err) {});
      console.log('Added: ' + name);
    }
  });
},

doJsonRequest = function (url, headers, dataFunction) {
  request({url: url, headers: headers, json: true},
          function (error, response, body) {
    if (! error && response.statusCode === 200) {
      dataFunction(body);
    }
  });
},

getDataReddit = function (body) {
  var url = 'http://api.reddit.com/hot.json';
  doJsonRequest(url, headers, function (body) {
    body.data.children.forEach(function (result) {
      addLink(result.data.title, result.data.url);
    });
  });
},

sources = [
    getDataReddit,
],

updateDb = function () {
  sources.forEach(function (current) {
    current();
  });
};


mongoose.connect('mongodb://localhost/buster');

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


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

app.listen(port, function() {
  console.log('Express server listening on port %d in %s mode',
              port, app.settings.env );
});

// Update database every 10 minutes.
updateDb();
setInterval(function () {
  updateDb();
}, 1000 * 60 * 10);