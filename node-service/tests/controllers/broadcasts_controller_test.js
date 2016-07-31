// have to run node-service and database-service before testing

var assert = require('assert');
var supertest = require('supertest');
var async = require('async');

var api = supertest('http://localhost:3000/v1');

function Testuser () {
  this.username = 'testuser' + Date.now();
  this.name = 'Test User ' + Date.now();
  this.email = 'test' + Date.now() + '@test.com';
  this.password = 'abcdef';
  this.token = '';
  this.id = 0;
}

var testuserList = [];

var arr_from_loop = function (func, num) {
  arr = [];
  for (var i = 0; i < num; i++) {
    arr.push(func);
  }
  return arr;
};

var broadcastList = [];

var setupUser = function (cb) {
  cur_testuser = new Testuser();
  api.post('/users').send(cur_testuser)
    .end(function (err, response) {
      assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
      assert.equal(response.status, 201);
      cur_testuser.id = response.body.user.id;
      api.post('/users/login').send({user: cur_testuser.username, password: cur_testuser.password})
        .end(function (err, response) {
          cur_testuser.token = response.body.auth.token;
          testuserList.push(cur_testuser);
          cb();
        });
    });
};

var teardownUser = function (cb) {
  api.delete('/users').send({id: testuserList[0].id, token: testuserList[0].token})
    .end(function (err, response) {
      testuserList.shift();
      cb();
    });
};

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
        broadcastList.push(response.body.broadcast);
        done();
      });
  });

  it('get all broadcasts', function (done) {
    api.get('/broadcasts/explore?token=' + testuserList[0].token)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.broadcasts[0].id, broadcastList[0].id);
        assert.equal(response.body.broadcasts[0].text, broadcastList[0].text);
        assert.equal(response.body.broadcasts[0].rebroadcast_count, 0);
        assert.equal(response.body.broadcasts[0].did_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_own_broadcast, true);
        assert.equal(response.body.broadcasts[0].rebroadcast_id, 0);
        done();
      });
  });

  it('get home broadcasts for user that posted the broadcast', function (done) {
    api.get('/broadcasts/home?token=' + testuserList[0].token)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.broadcasts[0].id, broadcastList[0].id);
        assert.equal(response.body.broadcasts[0].text, broadcastList[0].text);
        assert.equal(response.body.broadcasts[0].rebroadcast_count, 0);
        assert.equal(response.body.broadcasts[0].did_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_own_broadcast, true);
        assert.equal(response.body.broadcasts[0].rebroadcast_id, 0);
        done();
      });
  });

  it('get profile broadcasts for user that posted the broadcast', function (done) {
    api.get('/broadcasts/profile?token=' + testuserList[0].token + '&id=' + testuserList[0].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.broadcasts[0].id, broadcastList[0].id);
        assert.equal(response.body.broadcasts[0].text, broadcastList[0].text);
        assert.equal(response.body.broadcasts[0].rebroadcast_count, 0);
        assert.equal(response.body.broadcasts[0].did_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_own_broadcast, true);
        assert.equal(response.body.broadcasts[0].rebroadcast_id, 0);
        done();
      });
  });

  it('search broadcasts', function (done) {
    api.get('/broadcasts/search?token=' + testuserList[0].token + '&search_query=broadcast')
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.broadcasts[0].id, broadcastList[0].id);
        assert.equal(response.body.broadcasts[0].text, broadcastList[0].text);
        assert.equal(response.body.broadcasts[0].rebroadcast_count, 0);
        assert.equal(response.body.broadcasts[0].did_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_rebroadcast, false);
        assert.equal(response.body.broadcasts[0].is_own_broadcast, true);
        assert.equal(response.body.broadcasts[0].rebroadcast_id, 0);
        done();
      });
  });

  // it('delete a broadcast', function (done) {
  //   api.delete('/broadcasts').send({token: testuserList[0].token, id: broadcastList[0].id})
  //     .end(function (err, response) {
  //       assert.equal(response.header['content-type'], 'application/json; charset=utf-8')
  //       assert.equal(response.status, 200)
  //       assert.equal(response.body.broadcast.deleted, true)
  //       done()
  //     })
  // })

  it('teardown', function (done) {
    async.series(arr_from_loop(teardownUser, 2), done);
  });
});
