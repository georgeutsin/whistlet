var connection = require('../models');
var mysql = require('mysql');
const crypto = require('crypto');
const hash = crypto.createHash('sha512');

function Auth () {
  this.create_token = function (params, res) {
    return connection.acquire(function (con, resolve, reject) {
      params.token = crypto.randomBytes(64).toString('hex');
      var query = 'INSERT INTO auth_tokens SET ?';
      query = mysql.format(query, params);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          resolve({'error': false, 'status': 201, 'auth': {
              'token': params.token,
              'user_id': params.user_id
          }});
        }
      });
    });
  };

  this.check_token = function (params) {
    var auth = this;
    return connection.acquire(function (con, resolve, reject) {
      var query = `
      SELECT
      id, username, name, avatar_url
      FROM users
      INNER JOIN
      (SELECT
        user_id FROM auth_tokens
        WHERE token = ?
        LIMIT 1
      ) AS auth_join
      WHERE id = auth_join.user_id
      LIMIT 1`;
      query = mysql.format(query, params.token ? params.token : '');

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result[0] && result[0].id || params.bypass_auth) {
            auth.update_token(params);
            resolve(result[0]);
          } else {
            reject({'error': true, 'status': 403,
              'details': [{'message': 'Error: must be logged in to do that'}]
            });
          }
        }
      });
    });
  };

  this.update_token = function (params) {
    connection.acquire(function (con, resolve, reject) {
      var query = 'UPDATE auth_tokens SET updated_at = CURRENT_TIMESTAMP WHERE `token` = ?';
      query = mysql.format(query, params.token);

      con.query(query, function (err, result) {
        con.release();
        resolve({error: err, result: result});
      });
    });
  };

  this.delete_token = function (params, res) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'DELETE FROM auth_tokens WHERE token = ? ';
      query = mysql.format(query, params.token);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          resolve({'error': false, 'status': 200, 'auth': { 'logged_out': true }});
        }
      });
    });
  };
}

module.exports = new Auth();
