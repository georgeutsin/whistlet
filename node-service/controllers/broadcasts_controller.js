var _ = require('lodash');
var broadcast = require('../models/broadcast');
var auth = require('../models/auth');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});

var validateBroadcast = ajv.compile(broadcast.broadcastSchema);
var endpoints = broadcast.broadcastSchema.endpoints;

module.exports = {
  create: function (req, res) {
    var params = _.pick(req.body, endpoints.create.permitted_fields);
    var valid = validateBroadcast(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateBroadcast.errors});
    } else if (!params.text && !params.metadata.images[0]) {
      res.status(400);
      return res.json({error: true, details: { message: 'Must have a broadcast or an image' }});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        var bc = _.pick(params, 'text', 'metadata', 'reply_to');
        bc.user_id = cur_user.id;
        return broadcast.create(bc);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (result) {
        res.status(201);
        result.status = 201;
        result.broadcast = _.pick(result.broadcast, 'id', 'text', 'created_at', 'metadata');
        return res.json(result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  delete: function (req, res) {
    var params = _.pick(req.body, endpoints.delete.permitted_fields);
    var valid = validateBroadcast(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateBroadcast.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        return broadcast.get(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcast_result) {
        return broadcast.delete(broadcast_result.broadcast);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (result) {
        res.status(result.status);
        return res.json(result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  explore: function (req, res) {
    var params = _.pick(req.query, endpoints.explore.permitted_fields);

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return broadcast.explore(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcasts_result) {
        res.status(broadcasts_result.status);
        return res.json(broadcasts_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  home: function (req, res) {
    var params = _.pick(req.query, endpoints.home.permitted_fields);

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return broadcast.home(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcasts_result) {
        res.status(broadcasts_result.status);
        return res.json(broadcasts_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  profile: function (req, res) {
    var params = _.pick(req.query, endpoints.profile.permitted_fields);
    // check that profile exists ***********LOL
    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return broadcast.profile(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcasts_result) {
        res.status(broadcasts_result.status);
        return res.json(broadcasts_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  search: function (req, res) {
    var params = _.pick(req.query, endpoints.search.permitted_fields);

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return broadcast.search(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcasts_result) {
        res.status(broadcasts_result.status);
        return res.json(broadcasts_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  rebroadcast: function (req, res) {
    var params = _.pick(req.body, endpoints.rebroadcast.permitted_fields);
    var valid = validateBroadcast(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateBroadcast.errors});
    }
    // check if broadcast exists

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.user_id = cur_user.id;
        return broadcast.rebroadcast(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcast_result) {
        res.status(201);
        broadcast_result.status = 201;
        broadcast_result.broadcast = _.pick(broadcast_result.broadcast, 'id', 'text', 'created_at', 'metadata');
        return res.json(broadcast_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  unrebroadcast: function (req, res) {
    var params = _.pick(req.body, endpoints.unrebroadcast.permitted_fields);
    var valid = validateBroadcast(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateBroadcast.errors});
    }
    // check if broadcast exists
    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.user_id = cur_user.id;
        return broadcast.unrebroadcast(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcast_result) {
        res.status(broadcast_result.status);
        broadcast_result.broadcast = _.pick(broadcast_result.broadcast, 'id', 'text', 'created_at', 'metadata');
        return res.json(broadcast_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  }

};
