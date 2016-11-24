var connection = require('../models');
var mysql = require('mysql');

module.exports = {
  create_old_broadcasts: function () {
    return connection.acquire(function (con, resolve, reject) {
      var params = [
        [ 1, 'ayy lmao1', '2016-11-18 00:39:43'],
        [ 2, 'ayy lmao2', '2016-11-18 00:39:43'],
        [ 3, 'ayy lmao3', '2016-11-18 00:39:43']
      ];
      var query = 'INSERT INTO broadcasts (user_id, text, created_at) VALUES ?';
      query = mysql.format(query, [params]);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

};
