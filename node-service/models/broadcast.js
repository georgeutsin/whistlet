var connection = require('../models');
var mysql = require('mysql');
const crypto = require('crypto');

function Broadcast () {
  this.broadcastSchema = require('./schemas/broadcasts_schema');
  required = {required: [
      'text',
      'email',
      'password'
  ]};
  this.broadcastCreateSchema = Object.assign({}, this.broadcastSchema, required);
  var broadcastObj = this;

  this.create = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      // params.avatar_hash = crypto.randomBytes(64).toString('hex').substring(0, 32)

      var query = 'INSERT INTO broadcasts SET ?';
      query = mysql.format(query, params);
      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
            console.log('qwewqerqwer');

            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: could not create broadcast'}]});
          } else {
            resolve(broadcastObj.get({ id: result.insertId }));
          }
        }
      });
    });
  };

  this.get = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'SELECT id, text, created_at, metadata, reply_to FROM broadcasts WHERE id = ? LIMIT 1;';
      query = mysql.format(query, params.id);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          resolve({'error': false, 'status': 200, 'broadcast': result[0]});
        }
      });
    });
  };
}

module.exports = new Broadcast();
