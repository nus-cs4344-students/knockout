// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");

function GameSession(id) {
	//Private variables
	var playersArray = new Array(); //Array that stores the players
	
	//Public variables
	this.sessionName; //Name of the session (can be duplicate)
	this.sessionID;
	
	//Constructor
	this.sessionID = id;
	
	this.broadcast = function (msg) {
        var id;
        for (var i=0; i<playersArray.length; i++){
            playersArray[i].socket.write(JSON.stringify(msg));
        }
    }
	
	this.unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }
	
	this.addPlayer = function(player){
		//Check if name already exist, return false if exist, else return true
		var id;
		for (var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerID==player.playerID){
				return false;
			}
		}
		playersArray.push(player);
		player.currentGameSession = this;
		//player is not playing yet, only in session
		return true;
	}
	
	this.removePlayer = function(player){
		for (var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerID==player.playerID){
				playersArray.splice(i,1);
			}
		}
	}
	
	//privilege method
	this.getAbstractGameSessionText = function () {
		var playerIDs = "[";
		for (var i=0; i<playersArray.length; i++){
			playerIDs+= playersArray[i].playerID+",";
		}
		playerIDs = playerIDs.slice(0,-1);// remove the last comma
		playerIDs+="]";
		return "{id:"sessionID+", name:"+sessionName+", playerIDs:"+playerIDs+"}";
	}
}