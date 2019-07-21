FROM node:latest
RUN npm install jasmine -g --save
RUN mkdir /mpm-test
WORKDIR /mpm-test
COPY . /mpm-test
