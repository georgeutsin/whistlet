var connection = require('../models');
var mysql = require('mysql');
var helpers = require('../utils/helpers');
const crypto = require('crypto');

function Broadcast () {
  this.broadcastSchema = require('./schemas/broadcasts_schema');
  this.schemas = {};
  for (var endpoint in this.broadcastSchema.endpoints) {
    this.schemas[endpoint] = Object.assign({}, this.broadcastSchema,
      { required: this.broadcastSchema.endpoints[endpoint].required_fields });
  }
  var broadcastObj = this;
  var select_broadcasts = `
  SELECT broadcasts.id, text, broadcasts.created_at, broadcasts.created_at AS order_date, metadata, reply_to,
  (
    SELECT COUNT(*)
    FROM rebroadcasts
    WHERE broadcasts.id = rebroadcasts.broadcast_id
  ) AS rebroadcast_count,
  did_rebroadcast,
  0 AS is_rebroadcast,
  (SELECT IF(broadcasts.user_id = ?, 1, 0)) AS is_own_broadcast,
  0 AS rebroadcast_id
  FROM broadcasts `;
  var did_rebroadcast = function (num) {
    return `
    LEFT JOIN (
      SELECT id AS did_rebroadcast, broadcast_id
      FROM rebroadcasts
      WHERE rebroadcasts.user_id = ?
    ) AS RB` + num + ` ON broadcasts.id = RB` + num + `.broadcast_id `;
  };

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
          if (result[0]) {
            resolve({'error': false, 'status': 200, 'broadcast': result[0]});
          } else {
            reject({'error': true, 'status': 404, 'details': [{'message': 'Error: broadcast not found'}]});
          }
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
      var query = select_broadcasts + did_rebroadcast(1);
      values.push(params.cur_user_id, params.cur_user_id);
      if (params.order_date) {
        params.order_date = helpers.mysqlDateString(params.order_date);
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

  this.home = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var broadcasts_query = ' UNION ' + select_broadcasts + `
      INNER JOIN (
        SELECT id AS filter_user_id
        FROM users
        LEFT JOIN (
          SELECT followed_id
          FROM follows
          WHERE follows.user_id = ?
        ) AS F1 ON followed_id = users.id
        WHERE followed_id = users.id OR users.id = ?
      ) AS U1 ON (user_id = U1.filter_user_id)
      ` + did_rebroadcast(1);
      var broadcasts_values = [params.cur_user_id, params.cur_user_id, params.cur_user_id, params.cur_user_id];

      var query = `
      SELECT broadcasts.id, text, broadcasts.created_at, order_date, metadata, reply_to,
      (
        SELECT COUNT(*)
        FROM rebroadcasts
        WHERE broadcasts.id = rebroadcasts.broadcast_id
      ) AS rebroadcast_count,
      did_rebroadcast,
      1 AS is_rebroadcast,
      (SELECT IF(broadcasts.user_id = ?, 1, 0)) AS is_own_broadcast,
      rebroadcast_id
      FROM broadcasts
      INNER JOIN (
        SELECT created_at AS order_date, broadcast_id, id AS rebroadcast_id, user_id
        FROM rebroadcasts
      ) AS RB2 ON broadcasts.id = RB2.broadcast_id
      INNER JOIN (
        SELECT id AS filter_user_id
        FROM users
        LEFT JOIN (
          SELECT followed_id
          FROM follows
          WHERE follows.user_id = ?
        ) AS F2 ON followed_id = users.id
        WHERE followed_id = users.id OR users.id = ?
      ) AS U2 ON (RB2.user_id = U2.filter_user_id)
      ` + did_rebroadcast(3);
      values.push(params.cur_user_id, params.cur_user_id, params.cur_user_id, params.cur_user_id);
      if (params.order_date) {
        params.order_date = helpers.mysqlDateString(params.order_date);
        query += ' WHERE order_date < ? AND order_date > DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        values.push(params.order_date);
        query += broadcasts_query;
        values.push.apply(values, broadcasts_values);
        query += ' WHERE created_at < ? AND created_at > DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        values.push(params.order_date);
      } else {
        query += broadcasts_query;
        query += 'WHERE created_at > DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        values.push.apply(values, broadcasts_values);
      }
      query += ' ORDER BY order_date DESC LIMIT 10;';
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

  this.profile = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = `
      SELECT broadcasts.id, text, broadcasts.created_at, order_date, metadata, reply_to,
      (
        SELECT COUNT(*)
        FROM rebroadcasts
        WHERE broadcasts.id = rebroadcasts.broadcast_id
      ) AS rebroadcast_count,
      did_rebroadcast,
      1 AS is_rebroadcast,
      (SELECT IF(broadcasts.user_id = ?, 1, 0)) AS is_own_broadcast,
      rebroadcast_id
      FROM broadcasts
      INNER JOIN (
        SELECT created_at AS order_date, broadcast_id
        FROM rebroadcasts
      ) AS RB2 ON broadcasts.id = RB2.broadcast_id
      INNER JOIN rebroadcasts ON broadcasts.id = rebroadcasts.broadcast_id
      LEFT JOIN (
        SELECT id AS did_rebroadcast, id AS rebroadcast_id, broadcast_id
        FROM rebroadcasts
        WHERE rebroadcasts.user_id = ?
      ) AS RB3 ON broadcasts.id = RB3.broadcast_id
      WHERE rebroadcasts.user_id = ? `;
      values.push(params.cur_user_id, params.cur_user_id, params.id);
      if (params.order_date) {
        params.order_date = helpers.mysqlDateString(params.order_date);
        query += ' AND order_date < ?';
        values.push(params.order_date);
      }
      query += ' UNION ' + select_broadcasts + `
      LEFT JOIN (
        SELECT id AS did_rebroadcast, id, broadcast_id
        FROM rebroadcasts
        WHERE rebroadcasts.user_id = ?
      ) AS RB ON broadcasts.id = RB.broadcast_id
      WHERE broadcasts.user_id = ? `;
      values.push(params.cur_user_id, params.cur_user_id, params.id);
      if (params.order_date) {
        query += ' AND order_date < ?';
        values.push(params.order_date);
      }
      query += 'AND created_at > DATE_SUB(CURDATE(), INTERVAL 1 DAY) ORDER BY order_date DESC LIMIT 10; ';
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

  this.search = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = select_broadcasts + did_rebroadcast(1) + ` WHERE text LIKE ? `;
      values.push(params.cur_user_id, params.cur_user_id, '%' + params.search_query + '%');
      if (params.order_date) {
        params.order_date = helpers.mysqlDateString(params.order_date);
        query += ' AND broadcasts.created_at < ? ';
        values.push(params.order_date);
      }
      query += ' AND created_at > DATE_SUB(CURDATE(), INTERVAL 1 DAY) ORDER BY order_date DESC LIMIT 20; ';
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

  this.rebroadcast = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = `
      INSERT INTO
      rebroadcasts (
        user_id, broadcast_id
      )
      SELECT ?
      WHERE NOT EXISTS (SELECT broadcast_id FROM rebroadcasts WHERE user_id = ? AND broadcast_id = ?) `;
      values = [[params.user_id, params.broadcast_id],
        params.user_id, params.broadcast_id];
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: rebroadcast already exists'}]});
          } else {
            resolve({'error': false, 'status': 201});
          }
        }
      });
    });
  };

  this.unrebroadcast = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = `DELETE FROM rebroadcasts WHERE user_id = ? AND broadcast_id = ?`;
      values = [params.user_id, params.broadcast_id];
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: rebroadcast does not exist'}]});
          } else {
            resolve(broadcastObj.get({id: params.broadcast_id}));
          }
        }
      });
    });
  };
}

module.exports = new Broadcast();
