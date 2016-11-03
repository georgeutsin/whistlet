# whistlet

## Installation

1. Install docker for desktop and Kitematic for container management
2. Run:

```
cd whistlet/test-database

docker build -t whistlet/database .

docker run --name whistlet-db -d -e MYSQL_ROOT_PASSWORD=123 -p 3306:3306 whistlet/database

```
Optional: Install Sequel Pro and connect using root:123 as the credentials and check that the database was created successfully

3. Run the following:
```
cd ../node-service

npm install

npm install -g pm2
```
To install dependencies and the PM2 daemon
4. Test the app with `mocha tests/controllers`
