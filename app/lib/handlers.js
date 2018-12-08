/*
* Request handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');


// Define the handlers
const handlers = {};

handlers.users = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function(data, callback) {
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist
        _data.read('users',phone, function(err, data) {
            if(err) {
                const hashPassword = helpers.hash(password);
                if(hashPassword) {
                    const userObject = {
                        firstName, lastName, phone,
                        hashPassword, tosAgreement: true
                    };
                    _data.create('users', phone, userObject, function(err){
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                Error: 'Could not create the new user'
                            });
                        }
                    });
                } else {
                    callback(500, {
                        Error: 'Could not hash the user\'s password'
                    });
                }
            } else {
                callback(400, {
                    Error: 'A user with that phone aleady exists'
                });
            }
        });
    } else {
        callback(400, {
            Error: 'Missing required fields'
        });
    }

}

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
                _data.read('users', phone, function(err, data){
                    if(!err && data) {
                        // Remove the hashed password from the user before returning it to the request
                        delete data.hashPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            }else{
                callback(403, {Error: 'Missing required token in header, or token is invalid'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password ( at least one must be specified)
handlers._users.put = function(data, callback) {
    // Check for the required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false;

    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false;

    if(phone) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
                if(firstName || lastName || password) {
                    _data.read('users', phone, function(err, userData){
                        if(!err && userData) {
                            if(firstName) {
                                userData.firstName = firstName;
                            }
                            if(lastName) {
                                userData.lastName = lastName;
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            
                            _data.update('users', phone, userData, function(err) {
                                if(!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error': 'Could not update the user'});
                                }
                            });
                        } else {
                            callback(400, {Error: 'The specified user does not exist'});
                        }
                    });
                } else {
                    callback(400, {Error: 'Mising fields to update'});
                }
            }else{
                callback(403, {Error: 'Missing required token in header, or token is invalid'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }

}

// Users - delete
// Required field: phone
// @TODO Cleanup (delete) any other data fields associated with this user
handlers._users.delete = function(data, callback) {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid){
                _data.read('users', phone, function(err, data){
                    if(!err && data) {
                        _data.delete('users', phone, function(err){
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {Error: 'Could not delete the specified user'});
                            }
                        });
                    } else {
                        callback(400, {Error: 'Could not find the specified user'});
                    }
                });
            }else{
                callback(403, {Error: 'Missing required token in header, or token is invalid'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// Tokens
handlers.tokens = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Containers for all the tokens methods
handlers._tokens = {};

// Tokens - post
handlers._tokens.post = function(data, callback) {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false;

    if(phone && password) {
        _data.read('users', phone, function(err, userData){
            if(!err && userData) {
                // Hash the sent password and compare 
                const hashPassword = helpers.hash(password);
                if(hashPassword == userData.hashPassword) {
                    // Create a token and set expiration date 1 hour later
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000*60*60;
                    var tokenObject = {
                        phone: phone,
                        id: tokenId,
                        expires: expires
                    };
                    
                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {Error: 'Could not create the new token'});
                        }
                    });
                } else {
                    callback(400, {Error: 'Password did not match'});
                }
            } else {
                callback(400, {Error: 'Could not find the specified user'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field(s)'});
    }
}

// Tokens - get
//
handlers._tokens.get = function(data, callback) {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('tokens', id, function(err, data){
            if(!err && data) {
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// Tokens - put
handlers._tokens.put = function(data, callback) {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend;
    if(id && extend) {
        _data.read('tokens', id, function(err, data){
            if(!err && data) {
                // Check to the make sure the token isn't already expired
                if(data.expires > Date.now()){
                    data.expires = Date.now() + 1000*60*60;
                    _data.update('tokens', id, data, function(err){
                        if(!err){
                            callback(200);
                        }else {
                            callback(500, {Error: 'Could not update the token\'s expiration'})
                        }
                    });
                } else {
                    callback(400, {Error: 'The token has already expired'});
                }
            } else {
                callback(400, {Error: 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required field(s) or field(s) are invalid'});
    }
}

// Tokens - delete
handlers._tokens.delete = function(data, callback) {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('tokens', id, function(err, data){
            if(!err && data) {
                _data.delete('tokens', id, function(err){
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {Error: 'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400, {Error: 'Could not find the specified token'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// Verify if a given id is currenty valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
    // Lookup the token
    _data.read('tokens', id, function(err, data){
        if(!err){
            if(data.phone == phone && data.expires > Date.now())
                callback(true);
            else callback(false);
        }else {
            callback(false);
        }
    });
}

handlers.ping = function(data, callback) {
    callback(200);
}

handlers.notFound = function(data, callback) {
    callback(404);
}

module.exports = handlers;