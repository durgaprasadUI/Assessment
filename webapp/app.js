var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var { Server } = require("socket.io");
var http = require("http");
var cluster = require("cluster");
var server;
var app = express();
var playersDetails = {
     "Player_1": {
         name: 'Player_1',
         color: 'red',
         active: false
     },
     "Player_2": {
         name: 'Player_2',
         color: 'red',
         active: false
     },
     "Player_3": {
         name: 'Player_3',
         color: 'red',
         active: false
     },
     "Player_4": {
         name: 'Player_4',
         color: 'red',
         active: false
     }
 };

server = http.createServer(app);
server.listen(8081, () => { 
     console.log(`Server is listing at 8081`);
});

const io = new Server(server); //creating a socket server with existing express app
var playersCount = 0;

io.on('connection', (socket) => {
     playersCount++;
     if (playersCount > 4) {
          console.log("Already 4 players playing");
          return;
     }
     playersDetails['Player_' + playersCount].active = true;
     console.log("Got connection total no. of people Got connected " + playersCount);
     socket.on('disconnect', () => {
          playersCount--;
          console.log("Got connection total no. of people Got connected " + playersCount);
     });
     // socket.on('userSendMsg', (data) => {
     //      console.log("Received " + data);
     //      socket.broadcast.emit("receiveUsermsg", data);
     // });

     socket.on('update_color', (data) => {
          socket.broadcast.emit("changeOtherPlayerColor", data);
     });

     socket.emit("player-connected", {playersDetails: playersDetails, count: playersCount});
     socket.broadcast.emit("otherPlayersConnected", playersDetails);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
