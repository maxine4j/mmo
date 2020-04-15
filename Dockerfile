FROM node:13

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile

COPY ./ormconfig.json ./
COPY ./dist/common/ ./dist/common
COPY ./dist/server/ ./dist/server

EXPOSE 3000

CMD ["node", "/app/dist/server/index.js"]