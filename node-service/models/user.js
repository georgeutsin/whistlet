var connection = require('../models');
var mysql = require('mysql');
const crypto = require('crypto');

function User () {
  this.userSchema = require('./schemas/users_schema');
  required = {required: [
      'username',
      'email',
      'password'
  ]};
  this.userCreateSchema = Object.assign({}, this.userSchema, required);
  this.socialSchema = require('./schemas/social_schema');
  var userObj = this;

  this.create = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      const hash = crypto.createHash('sha512');
      params.salt = crypto.randomBytes(64).toString('hex').substring(0, 64);
      params.avatar_hash = crypto.randomBytes(64).toString('hex').substring(0, 32);
      params.password = hash.update(params.salt + params.password).digest('hex');

      var query = `
      INSERT INTO
      users (
        username, name, password, email, avatar_hash, salt
      )
      SELECT ?
      WHERE NOT EXISTS (SELECT id FROM users WHERE email = ? OR username =  ?) `;
      values = [[params.username, params.name, params.password, params.email, params.avatar_hash, params.salt],
        params.email, params.username];
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows === 0) {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: username or email already exists'}]});
          } else {
            resolve(userObj.get({ id: result.insertId }));
          }
        }
      });
    });
  };

  this.get = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var values = [];
      var query = `
      SELECT id, username, name, amp, created_at, avatar_hash,
      followers, following, did_follow, follows_you
      FROM users
      INNER JOIN (
        SELECT COUNT(*) AS followers
        FROM follows
        WHERE followed_id = ?
      ) AS FOLLOWERS
      INNER JOIN (
        SELECT COUNT(*) AS following
        FROM follows
        WHERE user_id = ?
      ) AS FOLLOWING
      INNER JOIN `;
      values.push(params.id, params.id);
      if (params.cur_user_id) {
        query += `
        (SELECT COUNT(*) AS did_follow FROM follows
        WHERE followed_id = ?
        AND user_id= ?) AS DIDFOLLOW
        LEFT JOIN (
          SELECT 1 AS follows_you
          , follows.user_id
          FROM follows
          WHERE follows.followed_id = ?
        ) AS F3 ON F3.user_id = ? `;
        values.push(params.id, params.cur_user_id, params.cur_user_id, params.id);
      } else {
        query += `
        (SELECT 0 AS did_follow) AS DIDFOLLOW
        INNER JOIN (SELECT 0 AS follows_you) AS FOLLOWSYOU `;
      }
      query += 'WHERE id = ?';
      values.push(params.id);
      query = mysql.format(query, values);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          output = result[0];
          output.follows_you = (output.follows_you && output.follows_you > 0) ? true : false;
          output.did_follow = (output.did_follow && output.did_follow > 0) ? true : false;

          resolve({'error': false, 'status': 200, 'user': output});
        }
      });
    });
  };

  this.details_for_user = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'SELECT id, salt FROM users WHERE username = ? OR email = ? LIMIT 1';
      query = mysql.format(query, [params.username, params.email]);
      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result[0]) {
            resolve(result[0]);
          } else {
            reject({'error': true, 'status': 404, 'details': [{'message': 'Error: user not found'}]});
          }
        }
      });
    });
  };

  this.check_user = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      const hash = crypto.createHash('sha512');
      var password = hash.update(params.salt + params.password).digest('hex');

      var query = 'SELECT id FROM users WHERE id = ? AND password = ? LIMIT 1';
      query = mysql.format(query, [params.id, password]);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result[0]) {
            resolve(result[0].id);
          } else {
            reject({'error': true, 'status': 403, 'details': [{'message': 'Error: invalid credentials'}]});
          }
        }
      });
    });
  };

  this.update = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'UPDATE users SET ? WHERE id = ?';
      values = {};
      if (params.username) values.username = params.username;
      if (params.name) values.name = params.name;
      query = mysql.format(query, [values, params.id]);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows == 1) {
            params.cur_user_id = params.id;
            resolve(userObj.get(params));
          } else {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: could not update'}]});
          }
        }
      });
    });
  };

  this.delete = function (params) {
    return connection.acquire(function (con, resolve, reject) {
      var query = 'DELETE FROM users WHERE id = ?';
      // TODO: delete other user data like follows data, auht_tokens, etc
      query = mysql.format(query, params.id);

      con.query(query, function (err, result) {
        con.release();
        if (err) {
          reject({'error': true, 'status': 400, 'details': [{'message': 'Error: ' + err.code}]});
        } else {
          if (result.affectedRows == 1) {
            resolve({'error': false, 'status': 200, 'user': { 'id': params.id, 'deleted': true }});
          } else {
            reject({'error': true, 'status': 400, 'details': [{'message': 'Error: could not update'}]});
          }
        }
      });
    });
  };

  this.follow = function (params) {
    userObj = this;
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
    userObj = this;
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
}

module.exports = new User();
