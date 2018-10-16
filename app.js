#!/usr/bin/env node

var http = require('http');
var optimist = require('optimist');
var app = require('./server/app');
var init = require('./server/init');
var port = optimist.argv.p||8000;
var cwd = process.cwd();
var server;

if(port)app.set('port', port);//命令行-p设置端口号
init(app, optimist.argv, cwd);
port = app.get("port");
server = http.createServer(app);
server.listen(port);

server.on('error', function onError(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }
      var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    }
);

server.on('listening', function onListening() {
      var addr = server.address();
      var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
      console.log('UMock server listening on ' + bind);
    }
);
