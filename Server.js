// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./";
require(LIB_PATH + "Lobby.js");
require(LIB_PATH + "Player.js");

function Server(){
	//Private variables
	var gameLobby = new Lobby();
	
	var unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }
	
	//Privilege method
    this.start = function () {
		try {
			var express = require('express');
			var http = require('http');
			var sockjs = require('sockjs');
			var sock = sockjs.createServer();
			
			// Upon connection established from a client socket
			sock.on('connection', function (conn){
				var currentPlayer = null;
				console.log("connection established");
				unicast(conn, {type:"successConnection", content:"Connected to Server, please enter username"});
				
				 conn.on('close', function () {
					if(currentPlayer!=null){
						gameLobby.removePlayer(currentPlayer);
					}
				 });
				 
				 conn.on('data', function (data) {
					var message = JSON.parse(data)

                    switch (message.type) {
						 case "updatePlayerName":
							currentPlayer = gameLobby.createNewPlayer(conn,message.name);
							if(currentPlayer==null){
								unicast(conn, {type:"failPlayerName", content:"Username: " + message.content +" was already taken"});
							}else{
								unicast(conn, {type:"successPlayerName", content:"Successful login!"});
								//TODO update lobby players of new player
								//TODO update lobby list of players and sessions for currentPlayer
								
							}
						 break;
						 
						 case "sendLobbyMessage":
							if(currentPlayer!=null){
								gameLobby.broadcast({type:"lobbyMessage", name:currentPlayer.playerName, msg:message.msg});
							}
						 break;
						 
						 case "createGameSession":
							if(currentPlayer!=null){
								gameLobby.createGameSession(currentPlayer);
							}
						 break;
						 
						 default:
						 //Report unknown message type
						 break;
					}
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