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

    }

}
