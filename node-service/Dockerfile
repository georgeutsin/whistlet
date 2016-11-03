FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
RUN npm install pm2 -g
RUN npm install mocha -g

# Bundle app source
COPY . /usr/src/app

# Expose 8080 and run the start script
EXPOSE 8080
CMD sh run.sh

# Build command:
# docker build -t georgeutsin/node-service .
# And Run command:
# docker run --name node-service -d -p 49170:8080 georgeutsin/node-service
