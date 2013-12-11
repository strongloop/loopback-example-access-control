require('./nodefly').profile();
var express = require('express');


var app = express.createServer();
app.use(express.bodyParser());

app.get('/', function(req, res){

	res.send('hello, world bitches');

});

app.listen(4000);
console.log('Server: on');
