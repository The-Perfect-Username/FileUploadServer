var express    = require('express');
var router     = express.Router();
var exec       = require('child_process').exec;
var fileUpload = require('express-fileupload');
var fs         = require('file-system');
var Module     = require('../modules/upload');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.send('hey');
});


router.post('/submit/information', function(err, res) {
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

    var userId             = req.body.userId;
    var uploadDirectory    = "uploads/";
    var thumbnailDirectory = "thumbnails/";
    var videoFile          = req.files.video_file;
    var fileName           = (req.files.video_file.name).replace(/\s/g, '_');
    var fileNameWithoutExt = fileName.substr(0, fileName.lastIndexOf('.'));

    var url = "http://localhost:3001/";
    var thumbnails = [];

    Module.createVideoRecord(userId, function(err, recordId) {
        if (err) {
            res.send(err);
        } else {
            uploadDirectory    = uploadDirectory + recordId.toString();
            thumbnailDirectory = thumbnailDirectory + recordId.toString();

            createDirectory(uploadDirectory, function(err, response) {

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
                                if (seconds < 11) {
                                    var fps = 'fps=1';
                                } else {
                                    var fps = 'fps=1/' + Math.floor(seconds / 9);
                                }

                                // Create the thumbnail directory for the video and store the potential thumbnails
                                createDirectory(thumbnailDirectory, function(err, response) {

                                    exec("ffmpeg -i " + uploadDirectory + "/" + fileName + " -vf " + fps + ",scale=720:-1 " + thumbnailDirectory + "/" + fileNameWithoutExt + "_%03d.jpg && ls " + thumbnailDirectory, function(err, stdout, stderr) {
                                        if (durerr) {
                                            res.send(durerr);
                                        } else {
                                            if (stdout) {
                                                res.send((stdout.split('\n').pop()));
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

    // directoryExists(uploadDirectory, function(err, response) {
    //     if (response) {
    //         //Move video file to target directory
    //         videoFile.mv(target, function(error) {
    //             if (error) {
    //                 res.status(500).send(error);
    //             } else {
    //                 getVideoDuration(uploadDirectory + '/' + fileName, function(durerr, seconds) {
    //
    //                     seconds = Math.floor(seconds);
    //
    //                     if (seconds < 11) {
    //                         var fps = 'fps=1';
    //                     } else {
    //                         var fps = 'fps=1/' + Math.floor(seconds / 9);
    //                     }
    //
    //                     directoryExists(thumbnailDirectory, function(err, response) {
    //                         exec("ffmpeg -i " + uploadDirectory + "/" + fileName + " -vf " + fps + ",scale=-1:240 " + thumbnailDirectory + "/" + fileName + "_%03d.jpg", function(err, stdout, stderr) {
    //                             if (durerr) {
    //                                 res.send(durerr);
    //                             } else {
    //                                 if (stderr) {
    //                                     res.send(stderr);
    //                                 } else {
    //                                     res.send(stdout);
    //                                 }
    //                             }
    //                         });
    //                     });
    //
    //                 });
    //             }
    //         });
    //
    //     } else {
    //         console.log(err);
    //     }
    // });

});

function createDirectory(directory, callback) {

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
};

function getVideoDuration(file, callback) {
    exec("ffprobe -i " + file + " -show_format -v quiet | sed -n 's/duration=//p'", function(err, stdout, stderr) {
        callback(err, stdout);
    });
}

function createTime(seconds) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
}

module.exports = router;
