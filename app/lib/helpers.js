/*
* Helpers for various tasks
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');

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

module.exports = helpers;