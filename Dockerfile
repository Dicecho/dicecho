FROM node:latest

COPY ./ /home/app/
WORKDIR /home/app
RUN yarn --verbose

RUN yarn build

CMD yarn start:pm2
