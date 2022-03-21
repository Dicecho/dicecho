FROM node:16-alpine

ADD package.json yarn.lock /tmp/
RUN cd /tmp && yarn --verbose
RUN mkdir -p /home/app && cp -a /tmp/node_modules /home/app/

WORKDIR /home/app
COPY . /home/app
RUN yarn build

CMD yarn start:pm2
