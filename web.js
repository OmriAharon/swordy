var express = require('express');
var Datastore = require('nedb');
var bodyParser = require('body-parser')
var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

app.get('/highscore', function(req, res){
    db.find({}).sort( {score: -1}).exec(function (err, docs) {
        res.send(docs.splice(0, 5));
    });
});

app.post('/highscore', function(req, res){
    var doc = req.body;
    doc.score = parseInt(doc.score, 10);
    db.insert(doc);
    res.send(200);
});


var db = new Datastore({ filename: 'datafile', autoload: true });
