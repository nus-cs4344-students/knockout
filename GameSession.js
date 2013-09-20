// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");

function GameSession(id) {
	//Private variables
	var playersArray = new Array(); //Array that stores the players
	
	//Public variables
	this.sessionName; //Name of the session (can be duplicate)
	this.SessionID;
	
	//Constructor
	this.SessionID = id;
	
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
			if(playersArray[i].playerName==player.playerName)
				return false;
		}
		playersArray.push(player);
		return true;
	}
	
	
}