// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./";
require(LIB_PATH + "Lobby.js");
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameConstants.js");
//require(LIB_PATH + "AbstractPlayer.js");
//require(LIB_PATH + "AbstractGameSession.js");

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
						gameLobby.removePlayer(currentPlayer);//This function will remove player from gameSessions as well
						gameLobby.broadcast({type:"removeLobbyPlayer", id:currentPlayer.playerID});
					}
				 });
				 
				 conn.on('data', function (data) {
					var message = JSON.parse(data)

                    switch (message.type) {
						 case "updatePlayerName":
							console.log("updatePlayerName");
							currentPlayer = gameLobby.createNewPlayer(conn,message.name);
							if(currentPlayer==null){
								//inform failure
								console.log("reject playerName:"+message.name);
								unicast(conn, {type:"failPlayerName", content:"Username: " + message.content +" was already taken"});
							}else{
								//inform success
								console.log("accept playerName:"+message.name);
								unicast(conn, {type:"successPlayerName", content:"Successful login!"});
								//update lobby players of the new player
								gameLobby.broadcastExcept({type:"addLobbyPlayer", name:currentPlayer.playerName, id:currentPlayer.playerID},currentPlayer);
								//update list of players
								unicast(conn, {type:"updateLobbyPlayers", abstractPlayers:gameLobby.getJSONAbstractPlayers(currentPlayer)});
								//update list of sessions
								unicast(conn, {type:"updateLobbySessions", abstractGameSessions:gameLobby.getJSONAbstractGameSessions()});
							}
						 break;
						 
						 case "sendLobbyMessage":
							if(currentPlayer!=null){
								//TODO whether to change to to broadcastExcept
								gameLobby.broadcast({type:"lobbyMessage", name:currentPlayer.playerName, msg:message.message});
							}
						 break;
						 
						 case "createGameSession":
							if(currentPlayer!=null){
								var newGameSession = gameLobby.createGameSession(currentPlayer,message.name);
								//inform everybody of new game session
								gameLobby.broadcast({type:"updateSingleLobbySession", content:newGameSession.getAbstractGameSessionText()});
								//inform success
								unicast(conn, {type:"successCreateGameSession", content:"You have created a game Session"});
							}
						 break;
						 
						 case "joinGameSession":
							if(currentPlayer!=null){
								if(gameLobby.addPlayerToSessionID(currentPlayer,message.sessionID)){
									//Inform game session to everyone
									var tempGameSession = gameLobby.getSessionWithID(message.sessionID);
									gameLobby.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
									//Inform Success
									unicast(conn, {type:"successJoinGameSession", content:"You have successfully joined a game session"});
								}else{
									//Inform Failure
									unicast(conn, {type:"failJoinGameSession", content:"You have failed to join a game session"});
								}
							}
						 break;
						 
						 case "leaveGameSession":
							var tempGameSession = gameLobby.removePlayerFromSession(currentPlayer);
							if(tempGameSession.hasNoPlayers){
								//Server will inform others if the session has no players left and to be removed
								gameLobby.broadcast({type:"removeLobbySession", id:tempGameSession.sessionID});
								gameLobby.removeGameSession(tempGameSession);
							}else{
								gameLobby.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
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
			app.get('/', function (req, res) {
				res.sendfile(__dirname + '/templates/lobby.html');
			});
			//Access from http is http://localhost:8111
			
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/knockout'});
			
            httpServer.listen(GameConstants.PORT, '0.0.0.0'); //TODO consider changing this to GameConstants.ServerName
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