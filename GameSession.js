// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");

function GameSession(id) {
	//Private variables
	var playersArray = new Array(); //Array that stores the players
	var readyArray = new Array();
	//Public variables
	this.sessionName; //Name of the session (can be duplicate)
	this.sessionID;
	
	//Constructor
	this.sessionID = id;
	this.bol_isPlaying=false;
	
	this.broadcast = function (msg) {
        for (var i=0; i<playersArray.length; i++){
            playersArray[i].socket.write(JSON.stringify(msg));
        }
    }
	
	this.unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }
	
	this.addPlayer = function(player){
		//Check if name already exist, return false if exist, else return true
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
	
	this.setPlayerReady = function(player){
		for(var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerID==player.playerID){
				//search for ID in ready Array
				for(var j=0; j<readyArray.length;j++){
					if(readyArray[j]==player.playerID){
						return;
					}
				}
				readyArray.push(player.playerID);
			}
		}
	}
	
	this.setPlayerNotReady = function(player){
		for(var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerID==player.playerID){
				//search for ID in ready Array
				for(var j=0; j<readyArray.length;j++){
					if(readyArray[j]==player.playerID){
						readyArray.splice(j,1);
						return;
					}
				}
			}
		}
	}
	
	this.removePlayer = function(player){
		for (var i=0; i<playersArray.length; i++){
			if(playersArray[i].playerID==player.playerID){
				playersArray.splice(i,1);
			}
		}
	}
	
	this.hasNoPlayers = function(){
		return (playersArray.length==0);
	}
	
	//privilege method
	this.getAbstractGameSessionText = function () {
		var playerIDs = [];
		for (var i=0; i<playersArray.length; i++){
			playerIDs.push(playersArray[i].playerID);
		}
		return {id: this.sessionID , name: this.sessionName, 'playerIDs': playerIDs, 'readyIDs':readyArray};
	}
}

global.GameSession = GameSession;