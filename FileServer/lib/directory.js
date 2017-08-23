var fs   = require('file-system');

module.exports = {

    create: function(directory, callback) {

        fs.stat(directory, function(err, stats) {
            if (err) {
                fs.mkdir(directory, function(err) {
                    callback(err, true);
                });
            } else {
                if (stats.isDirectory()) {
                    callback(null, true);
                }
            }

        });
    },

    /**
    * Count the number of objects in the provided directory
    */

    count: function(directory, callback) {
        fs.readdir(directory, (err, files) => {
            callback(err, files.length);
        });
    }

};
