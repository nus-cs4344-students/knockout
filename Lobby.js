// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameSession.js");

function Lobby() {
	var playersArray = new Array(); //Used to store the players
	var sessionsArray = new Array(); //Used to store game sessions
	var nextPlayerID = 0;
	var nextSessionID = 0;

	//Broadcast message to all players
	this.broadcast = function (msg) {
        for (var i=0; i<playersArray.length; i++){
		//Only broadcast messages if user is not playing (in lobby)
			if(playersArray[i].bol_isPlaying == false)
				playersArray[i].socket.write(JSON.stringify(msg));
        }
    }
	
	//Broadcast message to all players except 1
	this.broadcastExcept = function (msg,player) {
        for (var i=0; i<playersArray.length; i++){
		//Only broadcast messages if user is not playing (in lobby)
			if(playersArray[i].bol_isPlaying == false && playersArray[i].playerID != player.playerID)
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
		for (var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerName==playerName)
				return null;
		}
		var newPlayer = new Player(socket,playerName,nextPlayerID);
		nextPlayerID++;
		playersArray.push(newPlayer);
		return newPlayer;
	}
	
	this.createGameSession = function(player){
		//Creates a Game session, must have at least 1 player in each session
		var newGameSession = new GameSession(nextSessionID);
		nextSessionID++;
		newGameSession.addPlayer(player);
		sessionsArray.push(newGameSession);
		//TODO Create game session (Between 4 to 1 players, include bots if got time) 
	}
	
	this.addPlayerToSession = function(player,session){
		return session.addPlayer(player);
	}
	
	this.getJSONAbstractPlayers(exceptPlayer){
		//returns a JSON string to stringify at Server.js, includes every player except the exceptPlayer
		var JSONstring = "[";
		for (var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerID != exceptPlayer.playerID){
				JSONstring += playersArray[i].getAbstractPlayerText()+", ";
			}
		}
		JSONstring = JSONstring.slice(0,-1);// remove the last comma
		JSONstring+="]";
		return JSONstring;
	}
}