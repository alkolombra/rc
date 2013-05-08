
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')  
  , http = require('http')
  , path = require('path')
  , arduino = require('duino')
  , fs = require('fs');

global.root = process.cwd()+'/';
var baseRoot = 'c:/users/sahar/sites/rc/';

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
app.get('/:file', routes.file);
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

var render = 320;

var board = new arduino.Board();
board.debug = false;

var car1 = {
  forward: new arduino.Led({    
    board: board,
    pin: 8
  }),
  backwards: new arduino.Led({    
    board: board,
    pin: 9
  }),
  left: new arduino.Led({    
    board: board,
    pin: 10
  }),
  right: new arduino.Led({    
    board: board,
    pin: 11
  })
}

var car2 = {
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

var selectedCar = car1;

board.on('ready', function(){  
  //console.log('Arduino is ready');
  resetCars();
});

var onlineUsers = {};

var drive = {
  time:20,
  timeInterval: null,
  timeLeft:0
}

var recording = null;
var driver = null;
var nextDrivers = [];

var socketController = require('socket-controller').io(sio);

sio.sockets.on('connection', function (socket) {  

  socket.emit('SOCKET_CONNECT', { });

  socketController.onConnect(socket);
  
  socketController.on(function(socket, event, data, ack, respond) {    
    
    switch(event) {    
      case 'LOGIN':
        if(!userExists(data.user.nickname)) {
          onlineUsers[socket.id] = socket;
          onlineUsers[socket.id].username = data.user.nickname;              
          data = { exists:false}
        } else {
          data = { exists:true }
        }
      break;
      case 'WANT_TO_DRIVE':                    
        if(driver) {
          nextDrivers.push(socket);
          data = { drive:false, driver:driver.username }          
          sio.sockets.emit('UPDATE_WAITING_LIST', { waitingList:getNextDrivers()});
        } else {
          driver = socket;          

          startGameTimer();
          
          data = { drive:true }
        }        
      break;
      case 'DRIVE':
        if(data.drive) {
          selectedCar[data.direction].off();
        } else {
          selectedCar[data.direction].on();
        }
      break;
      case 'HORN':
        socket.broadcast.emit('HORN', { horn:data.horn});
      break;
      case 'SWITCH_CAR':
        resetCars();
        if(data.car == '2') {
          selectedCar = car2;
        } else {
          selectedCar = car1;
        }
        socket.broadcast.emit('SWITCH_CAR', { car:data.car});
      break;
      default:
        data = {};
      break;
    }
    
    respond(data);
  });

  socket.on('disconnect', function () {
    delete onlineUsers[socket.id];

    if(driver == socket) {
      recording.stdin.setEncoding('utf8');
      recording.stdin.write('q');
      gameOver(socket);
    } else {      
      for(var nd in nextDrivers) {
        if(nextDrivers[nd].username == socket.username) {
          nextDrivers.splice(nd, 1);
          sio.sockets.emit('UPDATE_WAITING_LIST', { waitingList:getNextDrivers()});
        }
      }      
    }
  });

});

var startGameTimer = function() {
  drive.timeLeft = drive.time;
  driver.broadcast.emit('SOMEONE_IS_DRIVING', { driver:driver.username});
  sio.sockets.emit('UPDATE_WAITING_LIST', { waitingList:getNextDrivers()});

  var random = new Date();
  var file = {
    path: global.root + "public/records/",
    name: driver.username + "_" + random.getTime() + ".mp4"
  } 
  
  recording = run_cmd(global.root + 'public/ffmpeg/ffmpeg.exe', [
    '-f', 'mjpeg', 
    '-i', 'http://192.168.1.2:18390/cam_1.cgi', 
    '-i', baseRoot + 'public/images/box_template_2_RENDER_' + render + '.png',
    '-i', baseRoot + 'public/images/mediamagic_logo_' + render + '.png',
    '-filter_complex', 'overlay[tmp];[tmp]overlay=10:10',
    '-y', file.path + 'TEMP_' + file.name],
    driver, function (recordedSocket) {   
    //console.log('done');  
    // if(recordedSocket)
    //   recordedSocket.emit('DOWNLOAD_VIDEO', { path:'./records/' + file.name, file:file.name });

    // createThumbnail(file.path, file.name);  
    renderVideo(recordedSocket, file.path, file.name);
  });  
}

var renderVideo = function(recordedSocket, path, file) {
  setTimeout(function() {

    var spawn = require("child_process").spawn;
    var args = ['-i', path + 'TEMP_' + file, '-i', baseRoot + 'public/long_music.mp3', '-shortest', path + file];    
    var child = spawn(global.root + 'public/ffmpeg/ffmpeg.exe', args, null);

    // child.stderr.setEncoding('utf8');
    // child.stderr.on("data", function (data) {
    //   //console.log(data);
    //   // if(data.indexOf("already exists.") !== -1) {
    //   //   child.stdin.setEncoding('utf8');
    //   //   child.stdin.write('y\n');
    //   // }
    // }); 

    child.stdout.on("end", function () {
      if(recordedSocket)
        recordedSocket.emit('DOWNLOAD_VIDEO', { path:'./records/' + file, file:file });

      createThumbnail(path, file);  

      fs.unlink(global.root + 'public/records/TEMP_' + file, function (err) {
        // if (err) throw err;
        // console.log('successfully deleted /tmp/hello');
      });
    });
  }, 500);
}

var createThumbnail = function(path, file) {
  setTimeout(function() {
    var spawn = require("child_process").spawn;
    var child = spawn(global.root + 'public/ffmpeg/ffmpeg.exe', ['-ss', '5', '-i', path + file, '-vcodec', 'mjpeg', '-vframes', '1', '-an', '-f', 'rawvideo', '-s', '120x90', '-y', path + 'thumb_' + file.replace('.mp4', '.jpg')], null);  
    // child.stderr.setEncoding('utf8');
    // child.stderr.on("data", function (data) {
    //   console.log(data);
    // });      
  }, 500);  
}

var recordStart = function(recordedSocket) {
  drive.timeInerval = setInterval(function() {
    //console.log(drive.timeLeft);
    sio.sockets.emit('UPDATE_TIMER', { time:drive.timeLeft});
    if(drive.timeLeft <= 0) {            
      try {
        recording.stdin.setEncoding('utf8');
        recording.stdin.write('q');
      } catch(e) {}
      gameOver(recordedSocket);          
    } else {
     drive.timeLeft--;
    }
  }, 1000)
}

var gameOver = function(socket) {
  clearInterval(drive.timeInerval);      
  socket.emit('GAME_OVER', {});
  socket.broadcast.emit('SOMEONE_FINISHED_DRIVING', { driver:socket.username});  
  resetCars();
  if(nextDrivers.length > 0) {
    nextDriver();
  } else {
    driver = null;
  }
}

var nextDriver = function() {
  driver = nextDrivers[0];  
  nextDrivers.splice(0, 1);
  startGameTimer();
  driver.emit('START_DRIVING', {});  
}

var getNextDrivers = function() {  
  var nextDriversNames = [];

  for(var nextDriver in nextDrivers)
    nextDriversNames.push(nextDrivers[nextDriver].username);

  return nextDriversNames;
}

var userExists = function(nickname) {  
  for(var user in onlineUsers) {    
    if(onlineUsers[user].username == nickname) {      
      return true;
    }
  }

  return false;
}

var resetCars = function() {
  car1.forward.on();
  car1.backwards.on();
  car1.left.on();
  car1.right.on();

  car2.forward.on();
  car2.backwards.on();
  car2.left.on();
  car2.right.on();
}

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

function run_cmd(cmd, args, recordedSocket, done) {
    var spawn = require("child_process").spawn;
    var child = spawn(cmd, args, null);
    //var result = { stdout: "" };

    child.stderr.setEncoding('utf8');
    //child.stdin.setEncoding('utf8');

    var dataCount = 0;
    child.stderr.on("data", function (data) {
      //console.log(data);
      dataCount++;
      if(dataCount == 1) {
        //start the game
        recordStart(recordedSocket);
      }           
    });

    // child.stdout.on("data", function (data) {
    //   result.stdout += data;      
    //   console.log('data');
    // });
    child.stdout.on("end", function () {
      //console.log('end');
      done(recordedSocket);
    });

    // child.stderr.on('data', function(data) {
    //   console.log('data:err');
    // });
    return child;
}