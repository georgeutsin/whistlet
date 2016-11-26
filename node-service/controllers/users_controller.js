var _ = require('lodash');
var user = require('../models/user');
var auth = require('../models/auth');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var config = require('../config');
var aws = require('aws-sdk');
const crypto = require('crypto');

var validates = {};
for (var schema in user.schemas) {
  validates[schema] = ajv.compile(user.schemas[schema]);
}

var endpoints = user.userSchema.endpoints;

module.exports = {
  create: function (req, res) {
    var params = _.pick(req.body, endpoints.create.permitted_fields);
    var valid = validates.create(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.create.errors});
    }

    user.create(params).then(function (result) {
      res.status(201);
      result.status = 201;
      return res.json(result);
    }, function (reason) {
      res.status(reason.status || 500);
      return res.json(reason);
    });
  },

  get: function (req, res) {
    var params = _.pick(req.query, endpoints.get.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.get(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.get.errors});
    }
    params.bypass_auth = true;
    auth.check_token(params)
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
      .then(function (target_user) {
        params.id = target_user.id;
        return user.get(params);
      })
      .then(function (user_result) {
        res.status(user_result.status);
        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
        return res.json(reason);
      });
  },

  update: function (req, res) {
    var params = _.pick(req.body, endpoints.update.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.update(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.update.errors});
    }

    user.details_for_user(params)
      .then(function (target_user) {
        output = {error: true, status: 400, user_exists: true};
        res.status(output.status);
        return res.json(output);
      })
      .catch(function (reason) {
        if (reason.status != 404) {
          res.status(reason.status || 500);
          return res.json(reason);
        } else {
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
              res.status(reason.status || 500);
              return res.json(reason);
            });
        }
      });
  },

  delete: function (req, res) {
    var params = _.pick(req.body, endpoints.delete.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.delete(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.delete.errors});
    }
    auth.check_token(params)
      .then(function (cur_user) {
        params.id = cur_user.id;
        return auth.delete_token(params);
      })
      .then(function (result) {
        return user.delete(params);
      })
      .then(function (user_result) {
        res.status(user_result.status);
        return res.json(user_result);
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
        return res.json(reason);
      });
  },

  exists: function (req, res) {
    var params = _.pick(req.query, endpoints.exists.permitted_fields);
    var valid = validates.exists(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.exists.errors});
    }

    user.details_for_user(params)
      .then(function (target_user) {
        output = {error: false, status: 200};
        output.username_exists = params.username === target_user.username;
        output.email_exists = params.email === target_user.email;
        res.status(output.status);
        return res.json(output);
      })
      .catch(function (reason) {
        if (reason.status != 404) {
          res.status(reason.status || 500);
          return res.json(reason);
        } else {
          output = {error: false, status: 200, username_exists: false, email_exists: false};
          res.status(output.status);
          return res.json(output);
        }
      });
  },

  login: function (req, res) {
    var input = _.pick(req.body, endpoints.login.permitted_fields);
    var valid = validates.login(input);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.login.errors});
    }

    var params = { password: input.password };
    if (input.user.indexOf('@') > -1) {
      params.email = input.user;
      params.username = '';
    } else {
      params.username = input.user;
      params.email = '';
    }

    user.details_for_user(params)
      .then(function (target_user) {
        params.salt = target_user.salt;
        params.id = target_user.id;
        return user.check_user(params);
      })
      .then(function (user_id) {
        return auth.create_token({ user_id: params.id });
      })
      .then(function (result) {
        res.status(result.status);
        return res.json(result);
      }, function (reason) {
        res.status(reason.status || 500);
        return res.json(reason);
      });
  },

  logout: function (req, res) {
    var params = _.pick(req.body, endpoints.logout.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.logout(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.logout.errors});
    }

    auth.delete_token(params)
      .then(function (result) {
        res.status(result.status);
        return res.json(result);
      }, function (reason) {
        res.status(reason.status || 500);
        return res.json(reason);
      });
  },

  search: function (req, res) {
    var params = _.pick(req.query, endpoints.search.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.search(params);
    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.search.errors});
    }

    auth.check_token(params)
      .then(function (cur_user) {
        params.cur_user_id = cur_user.id;
        return user.search(params);
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

  signed_upload_url: function (req, res) {
    var params = _.pick(req.query, endpoints.signed_upload_url.permitted_fields);
    params.token = req.body.token || req.query.token || req.headers['x-access-token'];
    var valid = validates.signed_upload_url(params);

    if (!valid) {
      res.status(400);
      return res.json({error: true, details: validates.signed_upload_url.errors});
    }

    const s3 = new aws.S3();
    params.file_name = crypto.randomBytes(32).toString('hex') + params.file_name;
    var s3params = {Bucket: config.s3_profile_image_bucket, Key: params.file_name};

    auth.check_token(params)
      .then(function (cur_user) {
        console.log('lol');
        s3.getSignedUrl('putObject', s3params, (err, data) => {
          console.log('lol2');
          if (err) {
            err.status = 400;
            return Promise.reject(err);
          }
          const returnData = {
            error: false,
            status: 200,
            signedRequest: data,
            url: `https://${config.s3_profile_image_bucket}.s3.amazonaws.com/${params.file_name}`
          };
          return res.json(returnData);
        });
      })
      .catch(function (reason) {
        res.status(reason.status || 500);
        return res.json(reason);
      });
  }

};
