// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the http Method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        // Send the response
        res.end("Hello world\n");

        // Log the request path
        console.log('Request received with payload: ' + buffer);
    });
});

server.listen(3000, () => {
    console.log('The server is listening on 3000 now');
});

// Define the handlers
const handlers = {};

handlers.sample = function(data, callback) {}

handlers.notFound = function(data, callback) {}

// Define a request router
const router = {
    'sample': handlers.sample
};