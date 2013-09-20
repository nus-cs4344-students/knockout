// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "AbstractPlayer.js");

function GameSession(name, id) {
	//Private variables
	this.abstractPlayersArray = new Array(); //Array that stores the abstractPlayers
	
	//Public variables
	this.sessionName; //Name of the session (can be duplicate)
	this.sessionID;
	
	//Constructor
	this.sessionName = name;
	this.sessionID = id;
	
	this.addAbstractPlayer = function(abstractplayer){
		abstractPlayersArray.push(abstractplayer);
	}
}