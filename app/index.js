
// Dependencies
var server = require('./lib/server');
//var workers = require('./lib/workers');

// Declare the app
var app = {};

// Init function
app.init = function() {
    server.init();
    //workers.init();
};
// Execute
app.init();

module.exports = app;