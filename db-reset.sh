docker rmi -f whistlet/database
docker rm -f whistlet-db

cd test-database && docker build -t whistlet/database .
docker run --name whistlet-db -d -e MYSQL_ROOT_PASSWORD=123 -p 3306:3306 whistlet/database
