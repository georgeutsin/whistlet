var connection = require('../models');
var mysql = require('mysql');

module.exports = {
  create_old_broadcasts: function () {
    return connection.acquire(function (con, resolve, reject) {
      params = [
        { user_id: 1 , text: "ayy lmao1", created_at: '2016-11-18 00:39:43'},
        { user_id: 2 , text: "ayy lmao2", created_at: '2016-11-18 00:39:43'},
        { user_id: 3 , text: "ayy lmao3", created_at: '2016-11-18 00:39:43'},
      ];
      var query = 'INSERT INTO broadcasts SET ?';
      query = mysql.format(query, params);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject();
        } else {
          resolve();
        }
      });
    });
  }

};
