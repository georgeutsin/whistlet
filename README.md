# whistlet

## Installation

`1.` Install and start docker for desktop

`2.` Build and run the docker test database image:
```
sh db-reset.sh

```
*IIf you have another MySQL instance running on port 3306, remember to stop it before running the script. Docker won't be able to start a container on an active port*

Optional: Install Kitematic for visual container debugging

Optional: Install Sequel Pro and connect using root:123 as the credentials and check that the database was created successfully

`3.` Install node server dependencies and the pm2 daemon, and create an empty environment file
```
cd ../node-service

npm install

npm install -g pm2

touch env.sh
```

`4.` Test the app with `npm test`
