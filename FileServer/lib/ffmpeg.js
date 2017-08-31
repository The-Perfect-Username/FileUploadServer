var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

module.exports = {

    probe: function(file, callback) {
        exec("ffprobe -i " + file + " -show_format -show_streams -v quiet -print_format json", function(err, stdout, stderr) {
            callback(err, JSON.parse(stdout));
        });
    },

    encode: function(src, dest, scale, api_key, io, callback) {

        var args = ['-i', src, '-vf', scale, '-c:v', 'libx264', '-crf', '23', '-c:a', 'copy', dest];
        var ff = spawn('ffmpeg', args);

        ff.stdout.on('data', (data) => {
            console.log("Stdout: " + data);
        });

        var prev = 0;

        ff.stderr.on('data', (data) => {
            if (data.indexOf('frame=') > -1) {
                var val = parseInt(data.toString().split('=').filter(Boolean)[1].trim());
                var diff = val - prev;
                prev = val;
                io.emit('process_' + api_key, diff);
            }
        });

        ff.on('close', (code) => {
            io.emit('done_' + api_key, {code: code, src: src});
        });

    }

};
