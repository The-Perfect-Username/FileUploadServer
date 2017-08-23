var express    = require('express');
var router     = express.Router();
var exec       = require('child_process').exec;
var fileUpload = require('express-fileupload');
var Module     = require('../modules/upload');
var ffmpeg     = require('../lib/ffmpeg');
var directory  = require('../lib/directory');

/* GET home page. */
router.get('/', function(req, res, next) {
    directory.count('./node_modules', function(err, response) {
        res.send(response.toString());
    });
});

router.get('/thumbnail/:videoId\\_:imgId.jpg', function(req, res, next) {
    var videoId = req.params.videoId;
    var imgId = req.params.imgId;
    res.sendFile("c:\\Node\\FileUploadServer\\FileServer\\thumbnails\\" + videoId + "\\" + imgId +".jpg");
});


router.get('/rawr', function(req, res, next) {
    var src = 'C:\\Uploads\\vid.mp4';
    var codes = ['1080', '720', '480', '360', '240', '144'];

    for (var i = 0; i < codes.length; i++) {
        ffmpeg.encode(src, 'C:\\Uploads\\vid_'+ codes[i] +'.mp4', 'libx264 -crf 23', '-vf scale=-2:' + codes[i], function(err, response) {
            console.log(err);
            console.log(response);
        });
        console.log(i);
    }
});

router.post('/submit/information', function(req, res, next) {
    var params = {
        'title': req.body.title,
        'description': req.body.description,
        'category_id': req.body.categoryId,
        'privacy': req.body.privacy
    }

    Module.updateVideoInformation(params, function(err, response) {

        if (response) {

        } else {

        }

    });

});


// Upload a video file to uploads
router.post('/submit', function(req, res) {
    // Throws and error if no files are found
    if (!req.files) {
        res.sendStatus(400).send("No files were selected");
    }

    var             userId = req.body.userId;
    var    uploadDirectory = "uploads/";
    var thumbnailDirectory = "thumbnails/";
    var          videoFile = req.files.video_file;
    var           fileName = (req.files.video_file.name).replace(/\s/g, '_');
    var fileNameWithoutExt = fileName.substr(0, fileName.lastIndexOf('.'));

    var        url = "http://localhost:3001/";
    var thumbnails = [];

    // Create a new video record in the table 'videos'
    Module.createVideoRecord(userId, function(err, recordId) {

        if (err) {
            res.send(err);
        } else {
            // Create the directories in string
            uploadDirectory    = uploadDirectory + recordId.toString();
            thumbnailDirectory = thumbnailDirectory + recordId.toString();

            // Create the upload directory
            directory.create(uploadDirectory, function(err, response) {

                if (response) {
                    //Move video file to target directory
                    videoFile.mv("./" + uploadDirectory + '/' + fileName, function(error) {
                        if (error) {
                            res.status(500).send(error);
                        } else {

                            // Gets the video duration in seconds
                            getVideoDuration(uploadDirectory + '/' + fileName, function(durerr, seconds) {

                                // Round down to the nearest whole integer
                                seconds = Math.floor(seconds);
                                // If the duration is 10 seconds or less, then 1 frame per second
                                if (seconds < 3) {
                                    var fps = 'fps=1';
                                } else {
                                    var fps = 'fps=1/' + Math.floor(seconds / 3);
                                }

                                // Create the thumbnail directory for the video and store the potential thumbnails
                                directory.create(thumbnailDirectory, function(err, response) {

                                    exec("ffmpeg -i " + uploadDirectory + "/" + fileName + " -vf " + fps + ",scale=720:-1 " + thumbnailDirectory + "/%2d.jpg && ls " + thumbnailDirectory, function(err, stdout, stderr) {
                                        if (durerr) {
                                            res.send(durerr);
                                        } else {
                                            if (stdout) {
                                                var array = stdout.split('\n');
                                                array = array.filter(Boolean);
                                                for(var i = 0; i < array.length; i++) {
                                                    array[i] = "http://localhost:3001/upload/thumbnail/" + recordId + "_" + array[i];
                                                }
                                                res.status(200).send(array.filter(Boolean));
                                            } else {
                                                res.send(stderr);
                                            }
                                        }
                                    });
                                });

                            });
                        }
                    });

                } else {
                    console.log(err);
                }
            });
        }
    });

});


function getVideoDuration(file, callback) {
    exec("ffprobe -i " + file + " -show_format -v quiet | sed -n 's/duration=//p'", function(err, stdout, stderr) {
        callback(err, stdout);
    });
}

function createTime(seconds) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
}

module.exports = router;
