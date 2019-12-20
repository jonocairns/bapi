FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


EXPOSE 8000

CMD [ "node", "dist/api/server.js" ]