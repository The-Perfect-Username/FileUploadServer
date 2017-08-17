var db = require('../config/database');

module.exports = {

    createVideoRecord: function(channelId, callback) {
        var sql = "INSERT INTO videos (channel_id) VALUES (?)";

        db.query(sql, [channelId], function (err, result) {

            if (err) {
                callback(err, null);
            } else {
                callback(null, result.insertId);
            }
        });

    },

    updateVideoInformation: function(params, callback) {
        var sql = "UPDATE videos (title, description, category_id) SET ?";
        db.query(sql, params, function (err, result) {
            if (err) {
                callback(err, false);
            } else {
                callback(null, true);
            }
        });
    },

    setScheduleDate: function(params, callback) {
        var sql = "INSERT INTO scheduled_publicaton (video_id, date_time, creation_time)";
        db.query(sql, params, function (err, result) {
            if (err) {
                callback(err, false);
            } else {
                callback(null, true);
            }
        });
    }

}
