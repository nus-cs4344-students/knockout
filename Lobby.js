// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameSession.js");

function Lobby() {
	var playersArray = new Array(); //Used to store the players
	var sessionsArray = new Array(); //Used to store game sessions

	this.broadcast = function (msg) {
        var id;
        for (id in playersArray) {
		//Only broadcast messages if user is not playing (in lobby)
			if(playersArray[id].bol_isPlaying == false)
				playersArray[id].socket.write(JSON.stringify(msg));
        }
    }
	
	this.unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }
	
	this.removePlayerAtIndex = function(index){
		playersArray.splice(index,1);
	}
	
	this.getPlayerIndex = function(playerName){
		return playersArray.indexOf(playerName);
	}
	
	this.getSessionIndex - function(session){
		return sessionsArray.indexOf(session);
	}
	
	this.createNewPlayer = function(socket,playerName){
		//Check if name already exist, return false if exist, else return true
		var id;
		for(id in playersArray){
			if(playersArray[id].playerName==playerName)
				return false;
		}
		playersArray.push(new Player(socket,playerName));
		return true;
	}
	
	this.createGameSession = function(playerIndex){
		//Creates a Game session, must have at least 1 player in each session
		var newGameSession = new GameSession();
		newGameSession.addPlayer(playersArray[playerIndex]);
		sessionsArray.push(newGameSession);
		//TODO Create game session (Between 4 to 1 players, include bots if got time) 
	}
	
	this.addPlayerToSession = function(player,session){
		return session.addPlayer(player);
	}
}