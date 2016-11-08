var path = require('path');

module.exports = {
  path: path.normalize(path.join(__dirname, '..')),
  port: process.env.NODE_PORT || 3000,
  database: {
    connectionLimit: 100,
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER ||'root',
    password: process.env.DATABASE_PASSWORD || '123',
    database: process.env.DATABASE_NAME || 'whistlet',
    debug: false,
    port: 3306
  },
  s3_broadcast_image_bucket: 'whistbci',
  s3_profile_image_bucket: 'whistpi'
};
