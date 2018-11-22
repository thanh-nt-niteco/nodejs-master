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
            payload: buffer
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
});

server.listen(3000, () => {
    console.log('The server is listening on 3000 now');
});

// Define the handlers
const handlers = {};

handlers.sample = function(data, callback) {
    callback(406, {
        name: 'sample handler'
    });
}

handlers.notFound = function(data, callback) {
    callback(404);
}

// Define a request router
const router = {
    'sample': handlers.sample
};