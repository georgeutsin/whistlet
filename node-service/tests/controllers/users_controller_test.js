// have to run node-service and database-service before testing

var assert = require('assert');
var supertest = require('supertest');

var api = supertest('http://localhost:3000/v1');

const testuser = {
  username: 'testuser' + Date.now(),
  email: 'test' + Date.now() + '@test.com',
  password: 'abcdef'
};
var cur_user_id = 0;
var cur_username = testuser.username;
var cur_token = '';
var old_token = '';

describe('users_controller', () => {
  // CREATE
  // ----------------------------------------------------------------------------

  it('should respond with 201 for creation of user', function (done) {
    api.post('/users').send(testuser)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 201);
        cur_user_id = response.body.user.id;
        done();
      });
  });

  it('cannot create user without email', function (done) {
    api.post('/users').send({username: 'user' + Date.now(),  password: '123456'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('cannot create user without username', function (done) {
    api.post('/users').send({email: Date.now() + '@b.com', password: '123456'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('cannot create user without password', function (done) {
    api.post('/users').send({username: 'user' + Date.now(), email: Date.now() + '@b.com'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('cannot create user if password less than 6 chars', function (done) {
    api.post('/users').send({email: Date.now() + '@b.com', password: '12345'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('cannot create user if email already exists', function (done) {
    api.post('/users').send({username: 'user' + Date.now(), email: testuser.email, password: '123456'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        assert.equal(response.body.error, true);
        done();
      });
  });

  it('cannot create user if username already exists', function (done) {
    api.post('/users').send({username: testuser.username, email: Date.now() + '@b.com', password: '123456'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        done();
      });
  });

  it('cannot create user with invalid email', function (done) {
    api.post('/users').send({username: testuser.username, email: 'a', password: '123456'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        done();
      });
  });

  it('cannot create user with invalid username chars', function (done) {
    api.post('/users').send({username: 'a1!$@', email: Date.now() + '@b.com', password: '123456'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        done();
      });
  });

  // LOGIN
  // ----------------------------------------------------------------------------
  it('login with username returns a token', function (done) {
    api.post('/users/login').send({user: testuser.username, password: testuser.password})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 201);
        assert.equal(response.body.error, false);
        assert.equal(response.body.auth.user_id, cur_user_id);
        old_token = response.body.auth.token;
        done();
      });
  });

  it('login with email returns a token', function (done) {
    api.post('/users/login').send({user: testuser.email, password: testuser.password})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 201);
        assert.equal(response.body.error, false);
        assert.equal(response.body.auth.user_id, cur_user_id);
        cur_token = response.body.auth.token;
        done();
      });
  });

  it('cannot login with invalid credendtials', function (done) {
    api.post('/users/login').send({user: testuser.email, password: 'wrong'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 403);
        assert.equal(response.body.error, true);
        done();
      });
  });

  // GET
  // ----------------------------------------------------------------------------
  it('should respond with 200 for known user given username', function (done) {
    api.get('/users?username=' + testuser.username)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user.username, testuser.username);
        done();
      });
  });

  it('should respond with 200 for known user given id', function (done) {
    api.get('/users?id=' + cur_user_id)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user.username, testuser.username);
        done();
      });
  });

  it('should respond with 404 for unknown user', function (done) {
    api.get('/users?username=idontexist')
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 404);
        done();
      });
  });

  // UPDATE
  // ----------------------------------------------------------------------------
  it('update only username', function (done) {
    uname = 'user' + Date.now();
    api.patch('/users').send({username: uname, token: cur_token})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user.username, uname);
        cur_username = uname;
        done();
      });
  });

  it('update only name', function (done) {
    name = 'Some random name';
    api.patch('/users').send({name: name, token: cur_token})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user.name, name);
        done();
      });
  });

  it('cannot update if invalid token', function (done) {
    uname = 'user' + Date.now();
    api.patch('/users').send({username: uname, token: 'a bad token'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 403);
        done();
      });
  });

  it('cannot update if username already taken', function (done) {
    uname = 'user' + Date.now();
    api.patch('/users').send({username: 'testuser1', token: cur_token})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 400);
        done();
      });
  });

  // SEARCH
  // ----------------------------------------------------------------------------
  it('should respond with exists true for known user', function (done) {
    api.get('/users/exists?username=' + cur_username)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user_exists, true);
        done();
      });
  });

  it('should respond with exists false for unknown user', function (done) {
    api.get('/users/exists?username=' + 'notauser')
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user_exists, false);
        done();
      });
  });

  it('search for users', function (done) {
    api.get('/users/search?search_query=' + 'testuser' + '&token=' + cur_token)
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert(response.body.users.length > 0);
        done();
      });
  });

  // LOGOUT
  // ----------------------------------------------------------------------------
  it('logout a user', function (done) {
    api.post('/users/logout').send({token: old_token})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.auth.logged_out, true);
        done();
      });
  });

  // DELETE
  // ----------------------------------------------------------------------------
  it('cannot delete a user with invalid credentials', function (done) {
    api.delete('/users').send({token: 'a bad token'})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 403);
        done();
      });
  });

  it('delete a user', function (done) {
    api.delete('/users').send({token: cur_token})
      .end(function (err, response) {
        assert.equal(response.header['content-type'], 'application/json; charset=utf-8');
        assert.equal(response.status, 200);
        assert.equal(response.body.user.id, cur_user_id);
        done();
      });
  });
});
