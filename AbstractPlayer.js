// enforce strict/clean programming
"use strict"; 

//Used by Client to identify Players

function AbstractPlayer(n, id){
	//public variables
	this.playerName;
	this.playerID;
	
	//constructor
	this.playerName = n;
	this.playerID = id;
}

global.AbstractPlayer = AbstractPlayer;