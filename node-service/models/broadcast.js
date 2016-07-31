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
      var query = 'INSERT INTO broadcasts SET ?';
      query = mysql.format(query, params);
      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
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
      var query = 'SELECT id, user_id, text, created_at, metadata, reply_to FROM broadcasts WHERE id = ? LIMIT 1;';
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

  this.delete = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'DELETE FROM broadcasts WHERE id = ?';
      query = mysql.format(query, params.id);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          resolve({'error': false, 'status': 200, 'broadcast': {id: params.id, deleted: true}});
        }
      });
    });
  };

  this.explore = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = `SELECT id, text, created_at, created_at AS order_date, metadata, reply_to,
        (
          SELECT COUNT(*)
          FROM rebroadcasts
          WHERE broadcasts.id = rebroadcasts.broadcast_id
        ) AS rebroadcast_count,
        did_rebroadcast,
        0 AS is_rebroadcast,
        (SELECT IF(user_id = ?, 1, 0) )AS is_own_broadcast,
        0 AS rebroadcast_id
        FROM broadcasts
        LEFT JOIN (
          SELECT id AS did_rebroadcast, broadcast_id
          FROM rebroadcasts
          WHERE rebroadcasts.user_id = ?
        ) AS RB ON broadcasts.id = RB.broadcast_id `;
      values.push(params.cur_user_id, params.cur_user_id);
      if (params.order_date) {
        query += ' WHERE broadcasts.created_at < ? ';
        values.push(params.order_date);
      }
      query += ' ORDER BY order_date DESC LIMIT 20; ';
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          result = result.map(function (row) {
            row.did_rebroadcast = (row.did_rebroadcast && row.did_rebroadcast > 0) ? true : false;
            row.is_rebroadcast = (row.is_rebroadcast && row.is_rebroadcast > 0) ? true : false;
            row.is_own_broadcast = (row.is_own_broadcast && row.is_own_broadcast > 0) ? true : false;
            return row;
          });
          resolve({'error': false, 'status': 200, 'broadcasts': result});
        }
      });
    });
  };
}

module.exports = new Broadcast();
