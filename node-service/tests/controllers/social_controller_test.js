// have to run node-service and database-service before testing

var assert = require('assert');
var supertest = require('supertest');
var async = require('async');
var config = require('../../config');
var eventModel = require('../../models/event');

var api = supertest('http://localhost:'+config.port+'/v1');

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

describe('social_controller', () => {
  it('setup', function (done) {
    async.series(arr_from_loop(setupUser, 2), done);
  });

  it('follow a user', function (done) {
    var oldEventCount = 0;
    eventModel.count().then(function (count) {
      var oldEventCount = count;
      api.post('/social/follow').send({
        followed_id: testuserList[1].id,
        token: testuserList[0].token
      })
        .end(function (err, response) {
          assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
          assert.equal(response.status, 201);
          assert.equal(response.body.user.id, testuserList[1].id);
          assert.equal(response.body.user.followers, 1);
          assert.equal(response.body.user.did_follow, true);
          eventModel.count().then(function (count) {
            assert.equal(oldEventCount + 1, count);
            done();
          })
          .catch(function (err){
            console.log(err);
            done();
          });
        });
    })
    .catch(function (err){
      console.log(err);
      done();
    });

  });

  it('cannot follow yourself', function (done) {
    api.post('/social/follow').send({
      followed_id: testuserList[1].id,
      token: testuserList[1].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('cannot follow a user twice', function (done) {
    api.post('/social/follow').send({
      followed_id: testuserList[1].id,
      token: testuserList[0].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('get followers returns followers (user that was followed)', function (done) {
    api.get('/social/followers?token=' + testuserList[1].token + '&id=' + testuserList[1].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[0].id);
        assert.equal(response.body.users[0].did_follow, false);
        assert.equal(response.body.users[0].follows_you, true);
        done();
      });
  });

  it('get followers returns followers (user that followed)', function (done) {
    api.get('/social/followers?token=' + testuserList[0].token + '&id=' + testuserList[1].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[0].id);
        assert.equal(response.body.users[0].did_follow, false);
        assert.equal(response.body.users[0].follows_you, false);
        done();
      });
  });

  it('get following returns users followed (user that followed)', function (done) {
    api.get('/social/following?token=' + testuserList[0].token + '&id=' + testuserList[0].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[1].id);
        assert.equal(response.body.users[0].did_follow, true);
        assert.equal(response.body.users[0].follows_you, false);
        done();
      });
  });

  it('get following returns users followed (user that was followed)', function (done) {
    api.get('/social/following?token=' + testuserList[1].token + '&id=' + testuserList[0].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[1].id);
        assert.equal(response.body.users[0].did_follow, false);
        assert.equal(response.body.users[0].follows_you, false);
        done();
      });
  });

  it('follow a user back', function (done) {
    api.post('/social/follow').send({
      followed_id: testuserList[0].id,
      token: testuserList[1].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 201);
        assert.equal(response.body.user.id, testuserList[0].id);
        assert.equal(response.body.user.followers, 1);
        assert.equal(response.body.user.did_follow, true);
        done();
      });
  });

  it('get followers returns followers (user that was followed)', function (done) {
    api.get('/social/followers?token=' + testuserList[1].token + '&id=' + testuserList[1].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[0].id);
        assert.equal(response.body.users[0].did_follow, true);
        assert.equal(response.body.users[0].follows_you, true);
        done();
      });
  });

  it('get following returns users followed (user that followed)', function (done) {
    api.get('/social/following?token=' + testuserList[0].token + '&id=' + testuserList[0].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[1].id);
        assert.equal(response.body.users[0].did_follow, true);
        assert.equal(response.body.users[0].follows_you, true);
        done();
      });
  });

  it('get following returns users followed (user that was followed)', function (done) {
    api.get('/social/following?token=' + testuserList[1].token + '&id=' + testuserList[0].id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.users[0].id, testuserList[1].id);
        assert.equal(response.body.users[0].did_follow, false); // cannot follow yourself
        assert.equal(response.body.users[0].follows_you, false); // cannot follow yourself
        done();
      });
  });

  it('unfollow a user', function (done) {
    api.post('/social/unfollow').send({
      followed_id: testuserList[1].id,
      token: testuserList[0].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.error, false);
        assert.equal(response.body.user.followers, 0);
        assert.equal(response.body.user.did_follow, false);
        done();
      });
  });

  it('cannot unfollow a user twice', function (done) {
    api.post('/social/unfollow').send({
      followed_id: testuserList[1].id,
      token: testuserList[0].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('teardown', function (done) {
    async.series(arr_from_loop(teardownUser, 2), done);
  });
});
