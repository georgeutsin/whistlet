var express = require('express');
var morgan = require('morgan');
var path = require('path');
var bodyparser = require('body-parser');
var fs = require('fs');

var connection = require('./models');
var routes = require('./config/routes');

module.exports.start = function (done) {
  var app = express();

  var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
  app.use(morgan('combined', {stream: accessLogStream}));

  app.use(bodyparser.urlencoded({ extended: true }));
  app.use(bodyparser.json());

  connection.init();

  var router = express.Router();
  routes.configure(router);
  app.use('/v1', router);

  var server = app.listen(3000, function () {
    console.log('Server listening on port ' + server.address().port);

    var allRoutes = router.stack.map(function (obj) {
      if (obj.route !== undefined)
        return obj.route.path;
    }).filter(function (n) { return n !== undefined; });
    console.log(allRoutes);
  });
};

// If someone ran: "node server.js" then automatically start the server
if (path.basename(process.argv[1], '.js') == path.basename(__filename, '.js')) {
  module.exports.start();
}
