const express = require('express');
const app = express();

const systemConfig = require("./config/system");

// thư viện để sử dụng phần req.body
const bodyParser = require('body-parser');
// hiển thị thông báo
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');

require('dotenv').config();

const port = process.env.PORT;

const database = require("./config/database");
database.connect();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const routeClient = require("./routes/client/index.route");


app.set('views', `${__dirname}/views`); // Tìm đến thư mục tên là views
app.set('view engine', 'pug'); // template engine sử dụng: pug

app.use(express.static(`${__dirname}/public`)); // Thiết lập thư mục chứa file tĩnh

// Flash
app.use(cookieParser('JKSLSF'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json());

// Khai báo biến toàn cục cho file pug
app.locals.prefixAdmin = systemConfig.prefixAdmin;
routeClient(app);

// khai bao biến toàn cục cho tất cả file js backend
global._io = io

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});