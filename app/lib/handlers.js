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
// @TODO Only let an authenticated user access their object. Don't let them access anyone elses
handlers._users.get = function(data, callback) {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
        _data.read('users', phone, function(err, data){
            if(!err && data) {
                // Remove the hashed password from the user before returning it to the request
                delete data.hashPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {Error: 'Missing required field'});
    }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password ( at least one must be specified)
// @TODO Only let an authenticated user update their own object. Don't let them update anyone elses
handlers._users.put = function(data, callback) {
    // Check for the required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone.trim() : false;

    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.length > 0 ? data.payload.password.trim() : false;

    if(phone) {
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
    } else {
        callback(400, {Error: 'Missing required field'});
    }

}

// Users - delete
// Required field: phone
// @TODO Only let an authenticated user delete their object. Don't let them delete anyone elses
// @TODO Cleanup (delete) any other data fields associated with this user
handlers._users.delete = function(data, callback) {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
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