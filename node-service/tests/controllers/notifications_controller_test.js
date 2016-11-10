// have to run node-service and database-service before testing

var assert = require('assert');
var supertest = require('supertest');
var async = require('async');
var config = require('../../config');
var connection = require('../../models');
var eventsModel = require('../../models/event');

var api = supertest('http://localhost:' + config.port + '/v1');
connection.init();

function Testuser () {
  this.username = 'testuser' + Date.now();
  this.name = 'Test User ' + Date.now();
  this.email = 'test' + Date.now() + '@test.com';
  this.password = 'abcdef';
  this.token = '';
  this.id = 0;
}

var testuserList = [];

var notification;
var sample_notification = { type: 'rebroadcast', description: 'You were rebroadcasted!' };

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

describe('notifications_controller', () => {
  it('setup users', function (done) {
    async.series(arr_from_loop(setupUser, 2), done);
  });

  it('setup sample events', function (done) {
    eventsModel.create({
      user_id: testuserList[1].id,
      notify_user_id: testuserList[0].id,
      type: sample_notification.type,
      description: sample_notification.description
    }).then(function (result) {
      done();
    })
      .catch(function (err) {
        console.log(err);
      });
  });

  it('get notifications', function (done) {
    api.get('/notifications').send({
      token: testuserList[0].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.notifications.length, 1);
        assert.equal(response.body.notifications[0].type, sample_notification.type);

        notification = response.body.notifications[0];
        done();
      });
  });

  it('get notifications after a timestamp', function (done) {
    api.get('/notifications' + '?created_at=' + notification.created_at).send({
      token: testuserList[0].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.notifications.length, 0);
        done();
      });
  });

  it('set notifications to read', function (done) {
    api.patch('/notifications/read').send({
      token: testuserList[0].token
    })
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.error, false);
        assert.equal(response.body.notifications_read, 1);
        done();
      });
  });

  it('teardown sample notifications', function (done) {
    eventsModel.delete({
      id: notification.id
    }).then(function (result) {
      done();
    })
      .catch(function (err) {
        console.log(err);
      });
  });

  it('teardown users', function (done) {
    async.series(arr_from_loop(teardownUser, 2), done);
  });
});
