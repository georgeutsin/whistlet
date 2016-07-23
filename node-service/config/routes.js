var controllers = require('../controllers');

module.exports = {
  configure: function (app) {
    app.post('/users', controllers.users.create);
    app.get('/users', controllers.users.get);
    app.patch('/users', controllers.users.update);
    app.delete('/users', controllers.users.delete);
    app.get('/users/exists', controllers.users.exists);
    app.post('/users/login', controllers.users.login);
    app.post('/users/logout', controllers.users.logout);
    app.post('/users/follow', controllers.users.follow);
    app.post('/users/unfollow', controllers.users.unfollow);
    app.get('/users/followers', controllers.users.followers);
    app.get('/users/following', controllers.users.following);
  // app.get('/users/broadcast_owner', controllers.users.broadcast_owner)
  // app.get('/users/search', controllers.users.search)
  // app.post('/users/upload_image', controllers.users.upload_image)
  //
  // app.post('/broadcasts', controllers.broadcasts.create)
  // app.post('/broadcasts/upload_image', controllers.broadcasts.upload_image)
  // app.delete('/broadcasts', controllers.broadcasts.delete)
  // app.get('/broadcasts/home', controllers.broadcasts.home)
  // app.get('/broadcasts/explore', controllers.broadcasts.explore)
  // app.get('/broadcasts/profile', controllers.broadcasts.profile)
  // app.get('/broadcasts/search', controllers.broadcasts.search)
  // app.post('/broadcasts/rebroadcast', controllers.broadcasts.rebroadcast)
  // app.post('/broadcasts/unrebroadcast', controllers.broadcasts.unrebroadcast)
  //
  // app.get('/notifications', controllers.notifications.get)
  // app.update('/notifications/read', controllers.notifications.read)
  //
  // app.post('/signups', controllers.signups.create)
  }
};