var exec = require('child_process').exec;

module.exports = {

    probe: function(file, callback) {
        exec("ffprobe -i " + file + " -show_format -show_streams -v quiet -print_format json", function(err, stdout, stderr) {
            callback(err, JSON.parse(stdout));
        });
    },

    encode: function(src, dest, codec, scale, callback) {
        var cmd = "ffmpeg -i " + src + " " + scale + " -c:v " + codec + " -c:a copy " + dest;
        exec(cmd, function(err, stdout, stderr) {
            callback(err, stdout);
        });
    }

};
