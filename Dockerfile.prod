# syntax=docker/dockerfile:1

ARG NODE_TAG
FROM node:${NODE_TAG}

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ARG CONFIG
ARG BOT_SITES
ARG DEBUG
RUN <<EOF
  mkdir config
  echo $CONFIG | base64 --decode > config/config.json
  echo $BOT_SITES | base64 --decode > config/bot-sites.json
  echo $DEBUG | base64 --decode > config/debug.json
EOF
RUN npm run build

EXPOSE 3001
CMD [ "node", "dist/start-manager.js" ]
