
// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

const workers = {};

// Loookup all checks, get their data, send to a validator
workers.gatherAllChecks = function() {

};

// Timer to execute the worker-process once per minute
workers.loop = function() {
    setInterval(function() {

    }, 1000 * 60 );
};

workers.init = function() {
    workers.gatherAllChecks();
    workers.loop();
};


module.exports = workers;