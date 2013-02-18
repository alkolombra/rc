
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')  
  , http = require('http')
  , path = require('path')
  , arduino = require('duino');

global.root = process.cwd()+'/';

var app = express();
var server = http.createServer(app);
var sio = require('socket.io').listen(server);

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/views/:view.html', routes.views);

sio.configure(function () {
  //sio.set('heartbeat timeout', 60);
  sio.set('log level', 1);
  sio.set('transports', [   
    'websocket'
  , 'flashsocket'  
  , 'xhr-polling'
  , 'htmlfile' 
  , 'jsonp-polling'
  ]);
});


var board = new arduino.Board();
board.debug = false;

var car = {
  forward: new arduino.Led({    
    board: board,
    pin: 4
  }),
  backwards: new arduino.Led({    
    board: board,
    pin: 5
  }),
  left: new arduino.Led({    
    board: board,
    pin: 6
  }),
  right: new arduino.Led({    
    board: board,
    pin: 7
  })
}

board.on('ready', function(){  
  console.log('Arduino is ready');
  car.forward.on();
  car.backwards.on();
  car.left.on();
  car.right.on();
});

var onlineUsers = {};

var socketController = require('socket-controller').io(sio);

sio.sockets.on('connection', function (socket) {  

  onlineUsers[socket.id] = socket;

  socket.emit('SOCKET_CONNECT', { });

  socketController.onConnect(socket);
  
  socketController.on(function(event, data, ack, respond) {    
    
    switch(event) {    
      case 'DRIVE':
        if(data.drive) {
          car[data.direction].off();
        } else {
          car[data.direction].on();
        }
      break;
      default:
        data = {};
      break;
    }
    
    respond(data);
  });

  socket.on('disconnect', function () {
    delete onlineUsers[socket.id];
  });

});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
