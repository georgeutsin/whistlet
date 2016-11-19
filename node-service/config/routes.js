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
    app.get('/users/search', controllers.users.search);
    app.get('/users/signed_upload_url', controllers.users.signed_upload_url)

    app.post('/social/follow', controllers.social.follow);
    app.post('/social/unfollow', controllers.social.unfollow);
    app.get('/social/followers', controllers.social.followers);
    app.get('/social/following', controllers.social.following);
    app.get('/social/broadcast_owner', controllers.social.broadcast_owner);

    app.post('/broadcasts', controllers.broadcasts.create);
    app.get('/broadcasts/signed_upload_url', controllers.broadcasts.signed_upload_url);
    app.delete('/broadcasts', controllers.broadcasts.delete);
    app.get('/broadcasts/home', controllers.broadcasts.home);
    app.get('/broadcasts/explore', controllers.broadcasts.explore);
    app.get('/broadcasts/profile', controllers.broadcasts.profile);
    app.get('/broadcasts/search', controllers.broadcasts.search);
    app.post('/broadcasts/rebroadcast', controllers.broadcasts.rebroadcast);
    app.post('/broadcasts/unrebroadcast', controllers.broadcasts.unrebroadcast);

    app.get('/notifications', controllers.notifications.get);
    app.patch('/notifications/read', controllers.notifications.read);

  // app.post('/signups', controllers.signups.create)
  }
};
