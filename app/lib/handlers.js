/*
* Request handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');


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
                                // Delete each of the checks associated with the user
                                const userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                                if(userChecks.length > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    userChecks.forEach(function(checkId){
                                        _data.delete('checks', checkId, function(err){
                                            if(err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            
                                            if(checksDeleted = userChecks.length) {
                                                if(!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {Error: 'Errors encountered while attempting to delete all of the user\' checks. All checks may not have been deleted from the system successfully'});
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
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

// Checks
handlers.checks = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
}

handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = function(data, callback) {
    const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds) {
        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens', token, function(err, tokenData){
            if(!err && data) {
                var userPhone = tokenData.phone;

                _data.read('users', userPhone, function(err, userData) {
                    if(!err && userData) {
                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // Verify that the user has less than the number of max-checks-per-user
                        if(userChecks.length < config.maxChecks) {
                            // Create a random id for the check
                            const checkId = helpers.createRandomString(20);
                            // Create the check object, and include the user's phone
                            const checkObject = {
                                id: checkId,
                                userPhone: userPhone,
                                protocol: protocol,
                                url: url,
                                method: method,
                                successCodes: successCodes,
                                timeoutSeconds: timeoutSeconds
                            };

                            _data.create('checks', checkId, checkObject, function(err){
                                if(!err) {
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users', userPhone, userData, function(err){
                                        if(!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {Error: 'Could not update the user with the new check'})
                                        }
                                    });
                                } else {
                                    callback(500, {Error: 'Could not create the new check'});
                                }
                            });
                        } else {
                            callback(400, {Error: 'The user already has the maximum number of checks(' + config.maxChecks+ ')'})
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        })
    } else {
        callback(400, {Error: 'Missing required inputs, or inputs are invalid'})
    }
}

// Checks - get
handlers._checks.get = function(data, callback) {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('checks', id, function(err, checkData) {
            if(!err && checkData) {
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        callback(200, checkData);
                    }else{
                        callback(403, {Error: 'Missing required token in header, or token is invalid'})
                    }
                });
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// Checks - put
// Required data: id
handlers._checks.put = function(data, callback) {
    const id = typeof(data.payload.id) == 'string' && data.payload.id.length == 20 ? data.payload.id.trim() : false;
    const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds : false;

    if(id) {
        if(protocol || url || method || successCodes || timeoutSeconds) {
            _data.read('checks', id, function(err, checkData){
                if(!err && checkData) {
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                        if(tokenIsValid) {
                            if(protocol) {
                                checkData.protocol = protocol;
                            }
                            if(url) {
                                checkData.url = url;
                            }
                            if(method) {
                                checkData.method = method;
                            }
                            if(successCodes){
                                checkData.successCodes = successCodes;
                            }
                            if(timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('checks', id, checkData, function(err){
                                if(!err) {
                                    callback(200);
                                } else {
                                    callback(500, {Error: 'Could not update the check'})
                                }
                            });
                        } else {
                            callback(403)
                        }
                    })
                } else {
                    callback(404, {Error: 'Check ID is not exist'})
                }
            })
        } else {
            callback(400, {Error: 'Missing fields to update'})
        }
    } else {
        callback(400, {Error: 'Missing required field(s) or field(s) are invalid'});
    }
}

// Checks - delete
handlers._checks.delete = function(data, callback) {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData) {
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        _data.delete('checks', id, function(err){
                            if(!err) {
                                _data.read('users', checkData.userPhone, function(err, userData){
                                    if(!err && userData) {
                                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        
                                        const checkPosition = userChecks.indexOf(id);
                                        if(checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            _data.update('users', checkData.userPhone, userData, function(err){
                                                if(!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {Error: 'Could not update the user'})
                                                }
                                            });
                                        } else {
                                            callback(500, {Error: 'Could not find the check on the user object'})
                                        }
                                    } else {
                                        callback(400, {Error: 'Could not find the user who created the check'});
                                    }
                                });
                            } else {
                                callback(500, {Error: 'Could not delete the check data'})
                            }
                        })
                    }else{
                        callback(403, {Error: 'Missing required token in header, or token is invalid'})
                    }
                });
            } else {
                callback(400, {Error: 'The specified check ID is not exist'})
            }
        })
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

handlers.ping = function(data, callback) {
    callback(200);
}

handlers.notFound = function(data, callback) {
    callback(404);
}

module.exports = handlers;