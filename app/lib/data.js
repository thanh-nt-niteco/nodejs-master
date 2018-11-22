// Dependencies
const fs = require('fs');
const path = require('path');

const lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir, file, data, callback) {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            const strData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, strData, function(err){
                if(!err) {
                    fs.close(fileDescriptor, function(err){
                        if(!err) {
                            callback(false);
                        } else {
                            callbask('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing a new file');
                }
            });
        } else {
            callback('Could no create new file, it may already exist')
        }
    });
}

// Read data from a file
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json','utf8', function(err, data) {
        callback(err,data);
    });
}

// Update data inside a file
lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            const strData = JSON.stringify(data);
            fs.truncate(fileDescriptor, function(err){
                if(!err){
                    fs.writeFile(fileDescriptor, strData, function(err){
                        if(!err) {
                            fs.close(fileDescriptor, function(err) {
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            })
                        } else {
                            callback('Error writing to existing file')
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exist yet');
        }
    })
}

// Delete a file
lib.delete = function(dir, file, callback) {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting the file');
        }
    });
}

module.exports = lib;