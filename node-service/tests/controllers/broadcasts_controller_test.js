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
        done();
      });
  });

  it('teardown', function (done) {
    async.series(arr_from_loop(teardownUser, 2), done);
  });
});
