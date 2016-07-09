var mysql = require('mysql');
var config = require('../config');

function Connection () {
  this.pool = null;

  this.init = function () {
    this.pool = mysql.createPool(config.database);
  };

  this.acquire = function (callback) {
    var connection = this;
    return new Promise(function (resolve, reject) {
      connection.pool.getConnection(function (err, conn) {
        if (err) {
          return reject({'error': true, 'message': 'Error: ' + err.code});
        } else {
          return callback(conn, resolve, reject);
        }
      });
    });
  };
}

module.exports = new Connection();
