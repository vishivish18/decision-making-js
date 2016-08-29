'use-strict';

var express = require('express');
var app = express();
app.use('/', require('./app/controllers/static'));

var port = process.env.PORT || 1805;
app.listen(port, function() {
    console.log('Magic begins at port ', port);
});
