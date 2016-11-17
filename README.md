# whistlet

## Installation

`1.` Install and start docker for desktop

`2.` Build and run the docker test database image:
```
sh db-reset.sh

```
*If you have MySQL, make sure it isn't running, as it could occupy the database port*

Optional: Install Sequel Pro and connect using root:123 as the credentials and check that the database was created successfully

`3.` Install node server dependencies and the pm2 daemon, and create an empty environment file
```
cd ../node-service

npm install

npm install -g pm2

touch env.sh
```

`4.` Test the app with `npm test`
