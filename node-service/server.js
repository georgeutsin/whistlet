var express = require('express');
var morgan = require('morgan');
var path = require('path');
var bodyparser = require('body-parser');
var fs = require('fs');
var cron = require('node-cron');

var connection = require('./models');
var routes = require('./config/routes');
var config = require('./config');

var maintenance = require('./models/maintenance');

module.exports.start = function (done) {
  var app = express();

  var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
  app.use(morgan('combined', {stream: accessLogStream}));

  app.use(bodyparser.urlencoded({ extended: true }));
  app.use(bodyparser.json());

  connection.init();

  app.use(function (req, res, next) {

    switch(req.headers.origin){
      case 'http://whistlet.com':
      case 'https://whistlet.com':
      case 'http://localhost:3002':
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        break;
      default:
        // allow netlify previews to hit the api
        // i.e. https://deploy-preview-32--whistlet.netlify.com
        if (/whistlet\.netlify\.com/.test(req.headers.origin)) {
          res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        } else {
          res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
        }
        break;
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, x-access-token');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    if (req.method == 'OPTIONS') {
      res.sendStatus(200);
    }else {
      next();
    }
  });

  var router = express.Router();
  routes.configure(router);
  app.use('/v1', router);

  cron.schedule('*/1 * * * *', function(){ //run every 1 minute
    maintenance.purge()
      .then(function (result) {
        console.log(result);
      })
      .catch(function (reason) {
        reason.job = "purge failed";
        console.log(reason);
      });
  });

  var server = app.listen(config.port, function () {
    console.log('Server listening on port ' + server.address().port);

    var allRoutes = router.stack.map(function (obj) {
      if (obj.route !== undefined)
        return obj.route.path;
    }).filter(function (n) { return n !== undefined; });
    console.log(allRoutes);
  });
};

module.exports.start();
