var express    = require('express');
var router     = express.Router();
var exec       = require('child_process').exec;
var fileUpload = require('express-fileupload');
var Module     = require('../modules/upload');
var ffmpeg     = require('../lib/ffmpeg');
var directory  = require('../lib/directory');
var fs   = require('file-system');

var resolutions = ['1080', '720', '480', '360', '240', '144'];

/**
* Finds the closest numeric element in the array rounded down
* Returns a numeric value from the array
*/
Array.prototype.floor = function (element) {
    var array = this;
    element = parseInt(element);
    var i   = 0, index = 0;
    while (i < array.length) {
        var val = parseInt(array[i]);
        var diff = val - element;
        if (diff > 0) {
            index++;
        } else {
            break
        }
        i++;
    }
    return array[index];
};
/* GET home page. */
router.get('/', function(req, res, next) {
    var src = './uploads/00001/11/20170131_175228.mp4';
    var recordId = 11;
    var currentFolder = '00001';
    ffmpeg.encode(src, './uploads/' + currentFolder + '/' + recordId + '/' + resolutions[0] + '.mp4', 'libx264 -crf 23', '-vf scale=-2:' + resolutions[0], function(err, response) {
        console.log(response);
    });

    res.send('hey');
});

router.get('/thumbnail/:videoId\\_:imgId.jpg', function(req, res, next) {
    var videoId = req.params.videoId;
    var imgId = req.params.imgId;
    res.sendFile("c:\\Node\\FileUploadServer\\FileServer\\thumbnails\\" + videoId + "\\" + imgId +".jpg");
});


router.get('/rawr', function(req, res, next) {
    var src = 'C:\\Uploads\\vid.mp4';
    var resolutions = ['1080', '720', '480', '360', '240', '144'];

    for (var i = 0; i < resolutions.length; i++) {
        ffmpeg.encode(src, 'C:\\Uploads\\vid_'+ resolutions[i] +'.mp4', 'libx264 -crf 23', '-vf scale=-2:' + resolutions[i], function(err, response) {
            console.log(err);
            console.log(response);
        });
        console.log(i);
    }
});

router.post('/submit', function(req, res) {
    if (!req.files) {
        res.status(400).send('No files were uploaded');
    }
    var channelId          = req.body.userId;
    var maxNumberOfObjects = 5;
    var          videoFile = req.files.video_file;
    var           fileName = (req.files.video_file.name).replace(/\s/g, '_');
    // Create a video record in the database and return the id
    Module.createVideoRecord(channelId, function(err, recordId) {
        // Read the uploads directory to find the most recent folder
        fs.readdir('./uploads', (err, files) => {
            // Most recently created folder
            var numberOfFolders = files.length;
            var currentFolder = files[files.length - 1];
            // Check if the uploads folder containing video records is full or not
            fs.readdir('./uploads/' + currentFolder, (err, files) => {
                // If the folder is not yet full create a folder for the video, otherwise create a new folder
                // to contain uploads and create a folder for the video.
                if (files.length < maxNumberOfObjects) {
                    try {
                        directory.create('./uploads/' + currentFolder + "/" + recordId, function(direrr, dirres) {
                            if (direrr) {
                                console.log(direrr);
                            } else {
                                // Transfer video file to the newly created folder
                                videoFile.mv("./uploads/" + currentFolder + "/" + recordId + "/" + fileName, function(error) {
                                    if (error) {
                                        res.status(500).send(error);
                                    } else {
                                        // Once transferred begin processing
                                        // Probe video for pixel height
                                        var src = './uploads/' + currentFolder + '/' + recordId + '/' + fileName;

                                        ffmpeg.probe(src, function(err, rs) {

                                            var height = rs.streams[0].height.toString();
                                            var index = resolutions.indexOf(resolutions.floor(height));

                                            // Begin encoding videos to change resolutions
                                            for (var i = index; i < resolutions.length; i++) {
                                                ffmpeg.encode(src, './uploads/' + currentFolder + '/' + recordId + '/' + resolutions[i] + '.mp4', 'libx264 -crf 23', '-vf scale=-2:' + resolutions[i], function(err, response) {
                                                    console.log(response);
                                                });
                                            }

                                        });
                                    }
                                });
                            }
                        });
                    } catch(e) {
                        console.log(e);
                    };
                } else {
                    try {
                        directory.create('./uploads/' + createFolderName(numberOfFolders + 1), function(direrr, dirres) {

                        });
                    } catch(e) {};
                }
            });
        });

    // Once complete, create records for each copy of the processed file

    // Create thumbnails and do the same

    // Send a response back to the client stating the process is complete
    });
});

function createFolderName(videoId) {
    return String("00000" + videoId).slice(-5);
}

function as() {
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


function createTime(seconds) {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
}

module.exports = router;
