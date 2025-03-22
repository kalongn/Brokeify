# Brokeify™ 416 Project
Lifetime Financial Planer Web Application

## Set-up
### From root directory
```bash
cd client
npm install

cd ../server
npm install
```
### Then in client and server folder, create a .env file   
Client .env file:
```
VITE_SERVER_ADDRESS="http://localhost:8000"
```
Server .env file:
```
DB_ADDRESS=mongodb://localhost:27017/brokeify
SERVER_PORT=8000
SECRET=<INSERT anything here>
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=<INSERT GOOGLE CLIENT ID>
GOOGLE_CLIENT_SECRET=<INSERT GOOGLE CLIENT SECRET>
GOOGLE_REDIRECT_URI="http://localhost:#/auth/google/callback"

the last one use # since it replaces the # with whatever port number you decided within the code.
```

## Running the software
### You need 2 terminal, 1 at client and 1 at server

Client:
```bash
cd client
npm run dev
```

Server:
```bash
cd server
mongod # or whatever equivilant to create a mongoDB in your OS.
nodemon server.js
```