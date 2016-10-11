var path = require('path');

module.exports = {
  path: path.normalize(path.join(__dirname, '..')),
  port: process.env.NODE_PORT || 3000,
  database: {
    connectionLimit: 100,
    host: process.env.DATABASE_HOST || 'localhost',
    user: 'root',
    password: '123',
    database: 'whistlet',
    debug: false,
    port: 3306
  },
  S3_BUCKET: process.env.S3_BUCKET || 'whistlet-bucket'
};
