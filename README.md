# whistlet

## Installation

`1.` Install docker for desktop and Kitematic for container management

`2.` Build and run the docker test database image:
```
sh db-reset.sh

```
Optional: Install Sequel Pro and connect using root:123 as the credentials and check that the database was created successfully

`3.` Install node server dependencies and the pm2 daemon, and create an empty environment file
```
cd ../node-service

npm install

npm install -g pm2

touch env.sh
```

`4.` Test the app with `mocha tests/controllers`
