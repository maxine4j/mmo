FROM node:13

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile --network-timeout 600000

COPY ormconfig.json ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY src/ ./src/
RUN yarn build:server

EXPOSE 3000

CMD ["node", "/app/dist/server/index.js"]