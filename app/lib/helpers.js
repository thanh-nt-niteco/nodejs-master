/*
* Helpers for various tasks
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

const helpers = {};

// Create a SHA256 hash
helpers.hash = function(input) {
    if(typeof(input) == 'string' && input.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(input).digest('hex');
        return hash;
    } else {
        return false;
    }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
}

// Create a string of random alphanumeric character
helpers.createRandomString = function(strLength) {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = "";
        for(i=1;i<=strLength;i++){
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
            str += randomCharacter;
        }
        return str;
    } else {
        return false;
    }
}

// Send an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback) {
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim() : false;
    if(phone && msg) {
        // Configure the request payload
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+1' + phone,
            'Body': msg
        }
        var stringPayload = querystring.stringify(payload);

        // Configure the request details
        var requestDetails = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            auth: config.twilio.accountSid + ':' + config.twilio.authToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        // Instantiate the request object
        var req = https.request(requestDetails, function(res){
            var status = res.statusCode;
            if(status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was ' + status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', function(e) {
            callback(e);
        });

        // Add the paylaod
        req.write(stringPayload);
        req.end();
    } else {
        callback('Given parameters were missing or invalid');
    }
}

module.exports = helpers;