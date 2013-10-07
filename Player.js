// enforce strict/clean programming
"use strict"; 

//Used by Server to identify Players

function Player(s, n, id){
	//public variables
	this.socket;
	this.playerName;
	this.bol_isPlaying = false;
	this.currentGameSession = null;
	this.playerID;
	
	//constructor
	this.socket = s;
	this.playerName = n;
	this.playerID = id;
	
	//privilege method
	this.getAbstractPlayerText = function () {
		//Returns text form of this Player which will be converted
		//to AbstractPlayer on client side
		return "{id:"+this.playerID+", name:"+this.playerName+"}";
	}
}

global.Player = Player;