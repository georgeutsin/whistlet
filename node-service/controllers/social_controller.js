var _ = require('lodash');
var social = require('../models/social');
var auth = require('../models/auth');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});

var validates = {};
for (var schema in social.schemas) {
  validates[schema] = ajv.compile(social.schemas[schema]);
}
var endpoints = social.socialSchema.endpoints;

module.exports = {
  follow: function (req, res) {
    var params = _.pick(req.body, endpoints.follow.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.follow(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.follow.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.id = cur_user.id;
        return social.follow(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (user_result) {
        res.status(201);
        user_result.status = 201;
        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  unfollow: function (req, res) {
    var params = _.pick(req.body, endpoints.unfollow.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.unfollow(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.unfollow.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.id = cur_user.id;
        return social.unfollow(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (user_result) {
        res.status(user_result.status);
        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  followers: function (req, res) {
    var params = _.pick(req.query, endpoints.followers.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.followers(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.followers.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return social.followers(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (users_result) {
        res.status(users_result.status);
        return res.json(users_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  following: function (req, res) {
    var params = _.pick(req.query, endpoints.following.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.following(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.following.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return social.following(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (users_result) {
        res.status(users_result.status);
        return res.json(users_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  broadcast_owner: function (req, res) {
    var params = _.pick(req.query, endpoints.broadcast_owner.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.broadcast_owner(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.broadcast_owner.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        return social.broadcast_owner(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (user_result) {
        res.status(user_result.status);
        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  }

};
