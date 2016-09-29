# whistlet

## Installation

1. Install docker for desktop and Kitematic for container management
2. Run:

```
cd whistlet/test-database

docker build -t whistlet/database .

docker run --name db -d -e MYSQL_ROOT_PASSWORD=123 -p 3306:3306 whistlet/database

```
Optional: Install Sequel Pro and connect using root:123 as the creds and check that the database was created succesfully

3. Run `cd ../node-service` and `npm install`
4. Test the app by `cd tests/controllers` and `mocha .`
