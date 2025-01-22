const express = require('express');
const app = express();
const port = 3000;

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.set('views', './views'); // Tìm đến thư mục tên là views
app.set('view engine', 'pug'); // template engine sử dụng: pug

app.get("/")

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});