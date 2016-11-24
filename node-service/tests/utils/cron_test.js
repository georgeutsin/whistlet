var assert = require('assert');
var supertest = require('supertest');
var async = require('async');
var config = require('../../config');

var api = supertest('http://localhost:'+config.port+'/v1');

describe('broadcasts_controller', () => {
  it('setup', function (done) {
    async.series(arr_from_loop(setupUser, 2), done);
  });

  // CREATE
  // ----------------------------------------------------------------------------

  it('should respond with 201 for creation of broadcast', function (done) {
    api.post('/broadcasts').send({token: testuserList[0].token, text: 'My broadcast text'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 201);
        assert.equal(response.body.broadcast.text, 'My broadcast text');
        assert.equal(response.body.broadcast.user_id, undefined); // make sure user_id isn't serialized
        assert.equal(response.body.broadcast.rebroadcast_count, 0);
        assert.equal(response.body.broadcast.did_rebroadcast, false);
        assert.equal(response.body.broadcast.is_rebroadcast, false);
        assert.equal(response.body.broadcast.is_own_broadcast, true);
        assert.equal(response.body.broadcast.rebroadcast_id, 0);
        broadcastList.push(response.body.broadcast);
        done();
      });
  });
});
