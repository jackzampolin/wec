FROM node:6.2.0

COPY . /wec

WORKDIR /wec

RUN npm install

CMD ["node", "server.js"]