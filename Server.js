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
						var currentGameSession = currentPlayer.currentGameSession;
						var tempGameSession = gameLobby.removePlayer(currentPlayer);//This function will remove player from gameSessions as well
						gameLobby.broadcast({type:"removeLobbyPlayer", id:currentPlayer.playerID});
						if(currentGameSession!=null){
							if(tempGameSession==null){
								//Server will inform others if the session has no players left and to be removed
								gameLobby.broadcast({type:"removeLobbySession", id:currentGameSession.sessionID});
							}else{
								gameLobby.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
							}
						}
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
								//When adding new player, do not need to send isPlaying because he is definately not playing yet
								gameLobby.broadcastExcept({type:"addLobbyPlayer", name:currentPlayer.playerName, id:currentPlayer.playerID},currentPlayer);
								//update list of players
								unicast(conn, {type:"updateLobbyPlayers", abstractPlayers: gameLobby.getJSONAbstractPlayers()});
								//update list of sessions
								if(gameLobby.getSessionCount()>0){
									unicast(conn, {type:"updateLobbySessions", abstractGameSessions: gameLobby.getJSONAbstractGameSessions()});
								}
							}
						 break;
						 
						 case "sendMessage":
							if(currentPlayer!=null){
								if(currentPlayer.currentGameSession==null){
									gameLobby.broadcast({type:"lobbyMessage", name:currentPlayer.playerName, msg:message.message});
								}else{
									currentPlayer.currentGameSession.broadcast({type:"sessionMessage", name:currentPlayer.playerName, msg:message.message});
								}
							}
						 break;
						 
						 case "createGameSession":
							if(currentPlayer!=null){
								console.log("creating new game session with name: "+message.name);
								var newGameSession = gameLobby.createGameSession(currentPlayer,message.name);
								//inform everybody of new game session
								gameLobby.broadcastExcept({type:"updateSingleLobbySession", content:newGameSession.getAbstractGameSessionText()},currentPlayer);
								//inform success
								unicast(conn, {type:"updateSingleLobbySession", content:newGameSession.getAbstractGameSessionText()});
								unicast(conn, {type:"successCreateGameSession", sessionID:newGameSession.sessionID});
							}
						 break;
						 
						 case "joinGameSession":
							if(currentPlayer!=null){
								console.log(currentPlayer.playerName + " wants to join session "+message.sessionID);
								if(gameLobby.addPlayerToSessionID(currentPlayer,message.sessionID)){
									//Inform game session to everyone
									var tempGameSession = gameLobby.getSessionWithID(message.sessionID);
									gameLobby.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
									//Inform Success
									unicast(conn, {type:"successJoinGameSession", sessionID:message.sessionID});
								}else{
									//Inform Failure
									unicast(conn, {type:"failJoinGameSession", content:"You have failed to join a game session"});
								}
							}
						 break;
						 
						 case "leaveGameSession":
							var currentGameSession = currentPlayer.currentGameSession;
							var tempGameSession = gameLobby.removePlayerFromSession(currentPlayer);
							currentPlayer.bol_isPlaying=false;
							if(currentGameSession!=null){
								if(tempGameSession==null){
									//Server will inform others if the session has no players left and to be removed
									gameLobby.broadcast({type:"removeLobbySession", id:currentGameSession.sessionID});
								}else{
									gameLobby.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
								}
							}
						 break;
						 
						 case "ready":
							var currentGameSession = currentPlayer.currentGameSession;
							if(currentGameSession!=null){
								currentGameSession.setPlayerReady(currentPlayer);
								currentGameSession.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
							}
						 break;
						 
						 case "notReady":
							var currentGameSession = currentPlayer.currentGameSession;
							if(currentGameSession!=null){
								currentGameSession.setPlayerNotReady(currentPlayer);
								currentGameSession.broadcast({type:"updateSingleLobbySession", content:tempGameSession.getAbstractGameSessionText()});
							}
						 break;
						 
						 default:
							 //Report unknown message type
							 console.log("unknown message type");
						 break;
					}
				 });
			});
			
			// Standard code to starts the Pong server and listen
            // for connection
            var app = express();
			app.get('/', function (req, res) {
				res.sendfile(__dirname + '/templates/index.html');
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