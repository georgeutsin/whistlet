var connection = require('../models');
var mysql = require('mysql');
var helpers = require('../utils/helpers');
const crypto = require('crypto');
var userObj = require('../models/user');

function Maintenance () {

  this.purge = function () {
    return connection.acquire(function (con, resolve, reject) {
      var query = `
      DELETE FROM broadcasts WHERE created_at < ( UTC_TIMESTAMP() - INTERVAL 1440 MINUTE);
      `;
      query = mysql.format(query);

      var output = {'error': false, 'status': 200}

      con.query(query, function (err, result) {
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          output.broadcasts_deleted = result.affectedRows;
          query = ' DELETE FROM broadcasts WHERE created_at < ( UTC_TIMESTAMP() - INTERVAL 1440 MINUTE); '
          query = mysql.format(query);
          con.query(query, function (err, result) {
            con.release();
            if (err) {
              reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
            } else {
              output.rebroadcasts_deleted = result.affectedRows;
              output.job = "purge";
              resolve(output);
            }
          });
        }
      });
    });
  };

  this.update_amp = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = ``;
      query = mysql.format(query);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          resolve({'error': false, 'status': 200});
        }
      });
    });
  };
}

module.exports = new Maintenance();
