var _ = require('lodash');
var user = require('../models/user');
var auth = require('../models/auth');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});

var validateUser = ajv.compile(user.userSchema);
var validateUserCreate = ajv.compile(user.userCreateSchema);
var validateSocial = ajv.compile(user.socialSchema);

module.exports = {
  create: function (req, res) {
    var params = _.pick(req.body, 'username', 'email', 'password');
    var valid = validateUserCreate(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateUserCreate.errors});
    }

    user.create(params).then(function (result) {
      res.status(201);
      result.status = 201;
      return res.json(result);
    }, function (reason) {
      res.status(reason.status);
      return res.json(reason);
    });
  },

  get: function (req, res) {
    var params = _.pick(req.query, 'id', 'username', 'token');
    var valid = validateUser(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateUser.errors});
    }
    params.bypass_auth = true;
    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        if (cur_user) {
          params.cur_user_id = cur_user.id;
        }
        if (params.id) {
          return Promise.resolve(params);
        } else {
          return user.details_for_user(params);
        }
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (target_user) {
        params.id = target_user.id;
        return user.get(params);
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

  update: function (req, res) {
    var params = _.pick(req.body, 'username', 'name', 'token');
    var valid = validateUser(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateUser.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.id = cur_user.id;
        return user.update(params);
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

  delete: function (req, res) {
    var params = _.pick(req.body, 'token');

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.id = cur_user.id;
        return auth.delete_token(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (result) {
        return user.delete(params);
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

  exists: function (req, res) {
    var params = _.pick(req.query, 'username', 'email');
    var valid = validateUser(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateUser.errors});
    }

    user.details_for_user(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (target_user) {
        output = {error: false, status: 200, user_exists: true};
        res.status(output.status);
        return res.json(output);
      })
      .catch(function (reason) {
        if (reason.status != 404) {
          res.status(reason.status);
          return res.json(reason);
        } else {
          output = {error: false, status: 200, user_exists: false};
          res.status(output.status);
          return res.json(output);
        }
      });
  },

  login: function (req, res) {
    var input = _.pick(req.body, 'user', 'password');
    var params = { password: input.password };
    if (input.user.indexOf('@') > -1) {
      params.email = input.user;
      params.username = '';
    } else {
      params.username = input.user;
      params.email = '';
    }

    user.details_for_user(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (target_user) {
        params.salt = target_user.salt;
        params.id = target_user.id;
        return user.check_user(params);
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (user_id) {
        return auth.create_token({ user_id: params.id });
      })
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (result) {
        res.status(result.status);
        return res.json(result);
      }, function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  logout: function (req, res) {
    var params = _.pick(req.body, 'token');

    auth.delete_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (result) {
        res.status(result.status);
        return res.json(result);
      }, function (reason) {
        res.status(reason.status);
        return res.json(reason);
      });
  },

  follow: function (req, res) {
    var params = _.pick(req.body, 'token', 'followed_id');
    var valid = validateSocial(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateSocial.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.id = cur_user.id;
        return user.follow(params);
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
    var params = _.pick(req.body, 'token', 'followed_id');
    var valid = validateSocial(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateSocial.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.id = cur_user.id;
        return user.unfollow(params);
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
    var params = _.pick(req.query, 'token', 'id', 'last_date');
    var valid = validateSocial(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validateSocial.errors});
    }

    auth.check_token(params)
      .catch(function (reason) { return Promise.reject(reason); })
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return user.followers(params);
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
  }

};
