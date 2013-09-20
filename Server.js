// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./";
require(LIB_PATH + "Lobby.js");

function Server(){
	//private variables
	var gameLobby = new Lobby();
	
	//Priviledge method
    this.start = function () {
		try {
			var express = require('express');
			var http = require('http');
			var sockjs = require('sockjs');
			var sock = sockjs.createServer();
			
			
			// Upon connection established from a client socket
			sock.on('connection', function (conn){
				
				console.log("connection established");
				unicast(conn, {type:"message", content:"Connected to Server, please enter username"});
				
				 conn.on('close', function () {
						
				 });
				 
				 conn.on('data', function (data) {
				 });
			});
			
			// Standard code to starts the Pong server and listen
            // for connection
            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/knockout'});
            httpServer.listen(GameConstants.PORT, '0.0.0.0');
            app.use(express.static(__dirname));	
		}
		catch (e) {
			console.log("Error: " + e);
		}
	}
	
	
	
}


// This will auto run after this script is loaded
var gameServer = new Server();
gameServer.start();