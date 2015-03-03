// Buster: Your Twitter Buddy

// When you need some new and interesting content for your feed, Buster
// is there.

// View new tweet-sized pieces of content in the browser window. Use react.js
// to pull new data, or hide old ones. On the server-side, node.js polls
// data sources and stores the results in MongoDB. Clicking on a Buster node
// redirects you to a Twitter intent page, so Buster never needs to know
// your login information. Buster just wants you to post cool stuff.

// Buster is inspired by Buffer, a totally awesome and cool thing.

'use strict';

var express = require('express'),
    request = require('request'),
    path = require('path'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    xml2js = require('xml2js'),

    headers = {'User-Agent': 'Buster/1.0.0 (by /u/scotchfield)'},

    app = express(), port = 8000,

// Regardless of the data source, we abstract every piece of information
// into a name and a url. The date indicates when we retrieved this data,
// and if it's been around too long, we won't serve it to the client.
Link = new mongoose.Schema({
    name: String,
    url: String,
    date: { type: Date, default: Date.now }
}),
LinkModel = mongoose.model('Link', Link),

// Accept a name and a url, and store them in the database. If the link
// already exists, don't write anything.
addLink = function (name, url) {
    LinkModel.find({name: name, url: url}, function (err, docs) {
        if (docs.length === 0) {
            var link = new LinkModel({name: name, url: url});
            link.save(function (err) {});
            console.log('Added: ' + name);
        }
    });
},

// Async request to a JSON data source. If we get valid data in return,
// use the supplied callback.
doJsonRequest = function (url, headers, fun) {
    request({url: url, headers: headers, json: true},
            function (error, response, body) {
        if (! error && response.statusCode === 200) {
            fun(body);
        }
    });
},

// Async request to an XML data source. If we get valid data in return,
// use the supplied callback.
doXmlRequest = function (url, headers, fun) {
    request({url: url, headers: headers}, function (error, response, body) {
        xml2js.parseString(body, function (err, result) {
            fun(result);
        });
    });
},

// A sample JSON data source. For each of the results, identify the name
// and the URL that we want to include in a tweet, and add the link to the
// database.
getDataReddit = function (body) {
    var url = 'http://api.reddit.com/hot.json';
    doJsonRequest(url, headers, function (body) {
        body.data.children.forEach(function (result) {
            addLink(result.data.title, result.data.url);
        });
    });
},

// A sample XML data source. Buster uses xml2js to convert the XML to JSON,
// so this looks very similar to the JSON function above.
getDataLifehacker = function (body) {
    var url = 'http://feeds.gawker.com/lifehacker/full';
    doXmlRequest(url, headers, function (body) {
        var data = body.rss.channel[0].item;
        data.forEach(function (result) {
            addLink(result.title[0], result.link[0]);
        });
    });
},

// Save a list of callbacks that we will periodically poll for new content.
sources = [
    getDataReddit,
    getDataLifehacker,
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

// The client will poll /link when the user hits "One more?" Buster returns
// a single element from the database collection pulled at random. Note that
// we don't delete anything, and we don't store which data has already been
// sent, so the user may see duplicates.
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

app.listen(port, function() {
    console.log('Express server listening on port %d in %s mode',
                port, app.settings.env );
});

// Update database every 10 minutes.
updateDb();
setInterval(function () {
    updateDb();
}, 1000 * 60 * 10);
