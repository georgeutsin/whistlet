var assert = require('assert');
var supertest = require('supertest');
var async = require('async');
var config = require('../../config');

var maintenance = require('../../models/maintenance');
var state = require('../state');

describe('cron jobs', () => {
  it('setup', function (done) {
    state.create_old_broadcasts().then(function(res) {
      done();
    });
  });

  it('should delete old broadcasts', function (done) {
    maintenance.purge()
      .then(function (result) {
        assert(result.broadcasts_deleted >= 3);
        done();
      })
      .catch(function (reason) {
        reason.job = "purge failed";
        console.log(reason);
      });
  });
});
