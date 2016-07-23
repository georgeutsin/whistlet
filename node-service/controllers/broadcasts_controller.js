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
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        var bc = _.pick(params, 'text', 'metadata', 'reply_to');
        bc.user_id = cur_user.id;
        return broadcast.create(bc);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (broadcast_result) {
        res.status(201);
        broadcast_result.status = 201;
        return res.json(broadcast_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  }
};
