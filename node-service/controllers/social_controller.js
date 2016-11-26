var _ = require('lodash');
var social = require('../models/social');
var eventModel = require('../models/event');
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
      .then(function (cur_user) {
        if(cur_user.id == params.followed_id){
          return Promise.reject({error: true, status: 400, details: "Cannot follow yourself"});
        }
        params.id = cur_user.id;
        return social.follow(params);
      })
      .then(function (user_result) {
        res.status(201);
        user_result.status = 201;

        eventModel.create({
          user_id: params.id,
          notify_user_id: user_result.user.id,
          should_notify: 1,
          type: 'follow',
          description: `{message: 'You were followed by @${user_result.username}!', username: ${user_result.username}}`
        });

        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
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
      .then(function (cur_user) {
        params.id = cur_user.id;
        return social.unfollow(params);
      })
      .then(function (user_result) {
        res.status(user_result.status);

        eventModel.create({
          user_id: params.id,
          notify_user_id: user_result.user.id,
          should_notify: 0,
          type: 'follow'
        });

        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
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
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return social.followers(params);
      })
      .then(function (users_result) {
        res.status(users_result.status);
        return res.json(users_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
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
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return social.following(params);
      })
      .then(function (users_result) {
        res.status(users_result.status);
        return res.json(users_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
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
      .then(function (cur_user) {
        params.user_id = cur_user.id;
        return social.broadcast_owner(params);
      })
      .then(function (user_result) {
        res.status(user_result.status);

        eventModel.create({
          user_id: params.user_id,
          notify_user_id: user_result.user.id,
          should_notify: 0,
          type: 'viewed_broadcast',
          description: `{broadcast_id: ${params.broadcast_id}, rebroadcast_id: ${params.rebroadcast_id}}`
        });

        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
        return res.json(reason);
      });
  }

};
