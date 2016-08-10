var connection = require('../models');
var mysql = require('mysql');
const crypto = require('crypto');
var userObj = require('../models/user');

function Social () {
  this.socialSchema = require('./schemas/social_schema');

  this.follow = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = `
      INSERT INTO
      follows (
        user_id, followed_id
      )
      SELECT ?
      WHERE NOT EXISTS (SELECT user_id FROM follows WHERE user_id = ? AND followed_id = ?) `;
      values = [[params.id, params.followed_id],
        params.id, params.followed_id];
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: follow already exists'}]});
          } else {
            resolve(userObj.get({cur_user_id: params.id, id: params.followed_id}));
          }
        }
      });
    });
  };

  this.unfollow = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = `DELETE FROM follows WHERE user_id = ? AND followed_id = ?`;
      values = [params.id, params.followed_id];
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: follow does not exist'}]});
          } else {
            resolve(userObj.get({cur_user_id: params.id, id: params.followed_id}));
          }
        }
      });
    });
  };

  this.followers = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = `
      SELECT follower_id AS id, username, name, avatar_hash, order_date, did_follow, follows_you
      FROM (
        SELECT follows.user_id AS follower_id, created_at AS order_date
        FROM follows
        WHERE followed_id = ?
      ) AS F
      LEFT JOIN users ON users.id = follower_id `;
      values.push(params.id);
      if (params.cur_user_id) {
        query += `
        LEFT JOIN (
          SELECT followed_id AS did_follow, followed_id
          FROM follows
          WHERE follows.user_id = ?
        ) AS F2 ON F2.followed_id = follower_id
        LEFT JOIN (
          SELECT user_id AS follows_you, user_id
          FROM follows
          WHERE follows.followed_id = ?
        ) AS F3 ON F3.user_id = follower_id `;
        values.push(params.cur_user_id, params.cur_user_id);
      } else {
        query += `
          INNER JOIN (SELECT 0 AS did_follow) AS DIDFOLLOW
          INNER JOIN (SELECT 0 AS follows_you) AS FOLLOWSYOU `;
      }
      if (params.last_date) {
        query += ' WHERE order_date < ? ';
        values.push(params.last_date);
      }
      query += ' ORDER BY order_date DESC LIMIT 20;';
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          result = result.map(function (row) {
            row.follows_you = (row.follows_you && row.follows_you > 0) ? true : false;
            row.did_follow = (row.did_follow && row.did_follow > 0) ? true : false;
            return row;
          });

          resolve({'error': false, 'status': 200, 'users': result});
        }
      });
    });
  };

  this.following = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = `
      SELECT following_id AS id, username, name, avatar_hash, order_date, did_follow, follows_you
      FROM (
        SELECT follows.followed_id AS following_id, created_at AS order_date
        FROM follows
        WHERE user_id = ?
      ) AS F
      LEFT JOIN users ON users.id = following_id `;
      values.push(params.id);
      if (params.cur_user_id) {
        query += `
        LEFT JOIN (
          SELECT followed_id AS did_follow, followed_id
          FROM follows
          WHERE follows.user_id = ?
        ) AS F2 ON F2.followed_id = following_id
        LEFT JOIN (
          SELECT user_id AS follows_you, user_id
          FROM follows
          WHERE follows.followed_id = ?
        ) AS F3 ON F3.user_id = following_id `;
        values.push(params.cur_user_id, params.cur_user_id);
      } else {
        query += `
          INNER JOIN (SELECT 0 AS did_follow) AS DIDFOLLOW
          INNER JOIN (SELECT 0 AS follows_you) AS FOLLOWSYOU `;
      }
      if (params.last_date) {
        query += ' WHERE order_date < ? ';
        values.push(params.last_date);
      }
      query += ' ORDER BY order_date DESC LIMIT 20;';
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          result = result.map(function (row) {
            row.follows_you = (row.follows_you && row.follows_you > 0) ? true : false;
            row.did_follow = (row.did_follow && row.did_follow > 0) ? true : false;
            return row;
          });

          resolve({'error': false, 'status': 200, 'users': result});
        }
      });
    });
  };

  this.broadcast_owner = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      query = 'SELECT id, username, name, ';
      values = [];
      if (params.rebroadcast_id) {
        query += `
        (SELECT username FROM users
          WHERE users.id = (
            SELECT user_id
            FROM rebroadcasts
            WHERE rebroadcasts.id = ? LIMIT 1
          )
        ) AS rebroadcast_username,
        (SELECT created_at FROM rebroadcasts WHERE rebroadcasts.id = ? ) AS order_date, `;
        values.push(params.rebroadcast_id, params.rebroadcast_id);
      } else {
        query += ' NULL AS rebroadcast_username, NULL AS order_date, ';
      }
      query += `
      avatar_hash
      FROM users
      WHERE users.id = (
        SELECT broadcasts.user_id
        FROM broadcasts
        WHERE broadcasts.id = ? LIMIT 1);`;
      values.push(params.broadcast_id);
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result[0]) {
            resolve({'error': false, 'status': 200, 'user': result[0]});
          } else {
            reject({'error': true, 'status': 404, 'details': [{'message': 'Error: user not found'}]});
          }
        }
      });
    });
  };
}

module.exports = new Social();
