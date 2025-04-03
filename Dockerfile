FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g ts-node nodemon

EXPOSE 3000

CMD [ "nodemon", "--exec", "ts-node", "index.ts" ]
