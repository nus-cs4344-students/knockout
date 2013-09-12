// enforce strict/clean programming
"use strict"; 

function Player(s, n){
	//public variables
	this.socket;
	this.playerName;
	
	//constructor
	this.socket = s;
	this.playerName = n;
}