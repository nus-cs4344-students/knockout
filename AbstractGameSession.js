// enforce strict/clean programming
"use strict"; 

function AbstractGameSession(name, id) {
	//Private variables
	this.abstractPlayersArray = new Array(); //Array that stores the abstractPlayers
	
	//Public variables
	this.sessionName; //Name of the session (can be duplicate)
	this.sessionID;
	this.bol_isPlaying=false;
	
	//Constructor
	this.sessionName = name;
	this.sessionID = id;
	
	this.addAbstractPlayer = function(abstractplayer){
		this.abstractPlayersArray.push(abstractplayer);
	}
}

global.AbstractGameSession = AbstractGameSession;