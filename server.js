/*
This is the starting point for the app 
*/
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port,() => {
    console.log (`Started on port${port}`);
});
