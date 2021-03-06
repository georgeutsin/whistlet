var connection = require('../models');
var mysql = require('mysql');
var helpers = require('../utils/helpers');

function Event () {
  this.notificationSchema = require('./schemas/notifications_schema');
  this.schemas = {};
  for (var endpoint in this.notificationSchema.endpoints) {
    this.schemas[endpoint] = Object.assign({}, this.notificationSchema,
      { required: this.notificationSchema.endpoints[endpoint].required_fields });
  }
  var eventObj = this;

  this.create = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      //user_id, notify_user_id, should_notify, type, description
      var query = 'INSERT INTO events SET ?';
      query = mysql.format(query, params);

      con.query(query, function (err, result) {
        con.release();
        resolve({error: err, result: result});
      });
    });
  };

  this.get = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = `
      SELECT
      events.id, notify_user_id, user_id, username, name, avatar_url,  created_at, read_at, events.type, description
      FROM events
      JOIN
      (SELECT
        users.id, username, users.name, avatar_url FROM users
      ) AS users_join
      WHERE user_id = users_join.id
   		AND notify_user_id = ?
      `;
      values.push(params.cur_user_id);

      if (params.created_at) {
        params.created_at = helpers.mysqlDateString(params.created_at);
        query += ` AND created_at < ? `;
        values.push(params.created_at);
      }
      query += ' ORDER BY created_at DESC LIMIT 20;';
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          resolve({'error': false, 'status': 200, 'notifications': result});
        }
      });
    });
  };

  this.read = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'UPDATE events SET read_at = CURRENT_TIMESTAMP WHERE notify_user_id = ? AND read_at IS NULL';
      query = mysql.format(query, params.cur_user_id);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        }
        output = {'error': false, 'status': 200, 'notifications_read': result.affectedRows };
        resolve(output);
      });
    });
  };

  this.delete = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'DELETE FROM events WHERE id = ? ';
      query = mysql.format(query, params.id);

      con.query(query, function (err, result) {
        con.release();
        resolve({error: err, result: result});
      });
    });
  };

  this.count = function(){
    return connection.acquire(function (con, resolve, reject) {
      var query = 'SELECT COUNT(*) as count FROM events';

      con.query(query, function (err, result) {
        con.release();
        if(err) reject(err);
        resolve(result[0].count);
      });
    });
  };
}

module.exports = new Event();
