// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start the HTTP serser
httpServer.listen(config.httpPort, () => {
    console.log('The server is listening on ' + config.httpPort + ' in ' + config.envName +' mode');
});

// Instantiate the HTTPS server
const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
    console.log('The server is listening on ' + config.httpsPort + ' in ' + config.envName +' mode');
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res) {
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the http Method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    const queryStringObject = parsedUrl.query;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        // Choose teh handler this request should go to.
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer),
        }

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload) {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            
            const payloadString = JSON.stringify(payload);
            
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            
            // Log the request path
            console.log('Returnning this response: ', statusCode, payloadString);
        });
    });
}

// Define a request router
const router = {
    ping: handlers.ping,
    users: handlers.users,
};