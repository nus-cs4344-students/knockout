// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameSession.js");

function Lobby() {
	var playersArray = new Array(); //Used to store the players
	var sessionsArray = new Array(); //Used to store game sessions

	this.broadcast = function (msg) {
        for (var i=0; i<playersArray.length; i++){
		//Only broadcast messages if user is not playing (in lobby)
			if(playersArray[i].bol_isPlaying == false)
				playersArray[i].socket.write(JSON.stringify(msg));
        }
    }
	
	this.unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }
	
	this.removePlayer = function(player){
		playerArray.splice(playerArray.indexOf(player),1);
		//TODO remove from gameSessions as well
	}
	
	this.getSessionIndex - function(session){
		return sessionsArray.indexOf(session);
	}
	
	this.createNewPlayer = function(socket,playerName){
		//Check if name already exist, return false if exist, else return true
		var id;
		for (var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerName==playerName)
				return null;
		}
		var newPlayer = new Player(socket,playerName)
		playersArray.push(newPlayer);
		return newPlayer;
	}
	
	this.createGameSession = function(player){
		//Creates a Game session, must have at least 1 player in each session
		var newGameSession = new GameSession();
		newGameSession.addPlayer(player);
		sessionsArray.push(newGameSession);
		//TODO Create game session (Between 4 to 1 players, include bots if got time) 
	}
	
	this.addPlayerToSession = function(player,session){
		return session.addPlayer(player);
	}
}