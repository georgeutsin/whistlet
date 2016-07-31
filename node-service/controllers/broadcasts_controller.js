var _ = require('lodash');
var broadcast = require('../models/broadcast');
var auth = require('../models/auth');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});

var validateBroadcast = ajv.compile(broadcast.broadcastSchema);

module.exports = {
  create: function (req, res) {
    var params = _.pick(req.body, 'token', 'text', 'metadata', 'reply_to');
    var valid = validateBroadcast(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateBroadcast.errors});
    } else if (!params.text && !params.metadata) {
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
    var params = _.pick(req.body, 'token', 'id');
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
    var params = _.pick(req.query, 'token', 'order_date');

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
    var params = _.pick(req.query, 'token', 'order_date');

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
  }

};
