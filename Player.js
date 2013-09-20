// enforce strict/clean programming
"use strict"; 

function Player(s, n){
	//public variables
	this.socket;
	this.playerName;
	this.bol_isPlaying = false;
	
	//constructor
	this.socket = s;
	this.playerName = n;
}