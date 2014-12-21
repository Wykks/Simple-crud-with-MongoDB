var http = require('http');

var express = require('express');
var app = express();

var databaseUrl = "hackathon";
var mongojs = require('mongojs');
var db = mongojs(databaseUrl);
var userCol = db.collection('users');
var countryCol = db.collection('countries'); //From https://github.com/johan/world.geo.json

app.use(express.json());

app.listen(8080);

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/user', function(request, response) {
    userCol.save(request.body, function(err, record) {
        response.send({
            _id: record._id
        });
    })
});

app.delete('/user/:id', function(request, response) {
    userCol.remove({
        _id: mongojs.ObjectId(request.params.id)
    }, function(err, result) {
        response.send(result);
    });
});

app.get('/user', function(request, response) {
    userCol.find(function(err, documents) {
        for (var i = 0, len = documents.length; i < len; i++) {
            delete documents[i].pass;
        }
        response.send(documents);
    });
});

app.put('/user/:id', function(request, response) {
    userCol.update({
        _id: mongojs.ObjectId(request.params.id)
    }, {
        $set: request.body
    }, function(err, result) {
        response.send(result);
    });
});

//Unfinished
app.get('/country', function(request, response) {
//    var regex = new RegExp(request.query.name, 'i');
    countryCol.find({
        "$text": {"$search" : request.query.name }
    }, {
        "geometry": 1,
        "properties.name": 1,
        "_id": 0
    }, function(err, documents) {
        response.send(documents);
    });
});
