FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g ts-node

EXPOSE 3000

CMD [ "npm", "start" ]
