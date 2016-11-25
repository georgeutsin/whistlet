var _ = require('lodash');
var eventModel = require('../models/event');
var auth = require('../models/auth');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});

var validates = {};
for (var schema in eventModel.schemas) {
  validates[schema] = ajv.compile(eventModel.schemas[schema]);
}
var endpoints = eventModel.notificationSchema.endpoints;

module.exports = {
  get: function (req, res) {
    var params = _.pick(req.query, endpoints.get.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.get(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.get.errors});
    }

    auth.check_token(params)
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return eventModel.get(params);
      })
      .then(function (notifications_result) {
        res.status(notifications_result.status);
        return res.json(notifications_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  read: function (req, res) {
    var params = _.pick(req.body, endpoints.read.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.read(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.read.errors});
    }

    auth.check_token(params)
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return eventModel.read(params);
      })
      .then(function (notifications_result) {
        res.status(notifications_result.status);
        return res.json(notifications_result);
      })
      .catch(function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  }

};
