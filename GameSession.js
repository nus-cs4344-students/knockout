// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameConstants.js");
require(LIB_PATH + "Engine.js");

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
  var that = this;
  
  //GameSession Engine values
  var game_Mode = 0;
  var game_Platform_Radius = GameConstants.PLATFORM_RADIUS;
  var bol_gameHasEnded = false;
  var gameEngine;
  
  
  this.broadcast = function (msg) {
    for (var i=0; i<playersArray.length; i++){
      playersArray[i].socket.write(JSON.stringify(msg));
    }
  }
  
  this.unicast = function (socket, msg) {
    socket.write(JSON.stringify(msg));
  }
  
  this.addPlayer = function(player){
    //Restrict number of players
    if(playersArray.length>=GameConstants.NUM_OF_PLAYERS || this.bol_isPlaying==true){
      return false;
    }
    
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
  
  this.togglePlayerReady = function(player){
    for(var i=0; i<playersArray.length; i++){
      if(playersArray[i].playerID==player.playerID){
        //search for ID in ready Array
        for(var j=0; j<readyArray.length;j++){
          if(readyArray[j]==player.playerID){
            readyArray.splice(j,1);
            return;
          }
        }
        readyArray.push(player.playerID);
        return;
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
  
  this.canStartGame = function(){
    return (playersArray.length==GameConstants.NUM_OF_PLAYERS && playersArray.length==readyArray.length);
  }
  
  this.hasNoPlayers = function(){
    return (playersArray.length==0);
  }
  
  this.startGame = function(){
	if(that.canStartGame()==true){
		that.bol_isPlaying = true;
		that.broadcast({type:"startGame"});
		setTimeout(function() {initServerGameEngine();}, 5000);
	}
  }
  
  var initServerGameEngine = function(){
	global.Box2D = require(LIB_PATH + "Box2dWeb-2.1.a.3.min.js").Box2D;
	var Engine = require(LIB_PATH + "Engine.js").Engine;
	gameEngine = new Engine();
	gameEngine.bol_Server = true;
	gameEngine.init();
	gameEngine.start();
	game_Platform_Radius = GameConstants.PLATFORM_RADIUS;
	if(game_Mode==0){
		//Classic Ground Shrink Mode
		setInterval(function() {
			if(game_Platform_Radius>1.5){
				game_Platform_Radius-=0.1;
				gameEngine.shrinkGroundToRadius(game_Platform_Radius);
				that.broadcast({type:"updateGameStates", groundRadius: game_Platform_Radius});
			}
		}, 2000);
		
	}else{
		//Points Mode
	}
	updateServerStates();
  }
  
  var updateServerStates = function(){
	if(bol_gameHasEnded==false){
		//Every frame update player position
		setTimeout(updateServerStates, GameConstants.FRAME_RATE);
		that.broadcast({type:"updatePlayerStates", playerStates: gameEngine.getPlayerStates()});
	}
  }
  
  this.updatePlayerState = function(playerID, playerState){
	for(var i=0;i<playersArray.length;i++){
		if(playersArray[i].playerID == playerID){
			gameEngine.pushPlayerShape(GameConstants.SHAPE_NAME+(i+1),playerState.moveX,playerState.moveY);
			break;
		}
	}
  }
  
  //privilege method
  this.getAbstractGameSessionText = function () {
    var playerIDs = [];
    for (var i=0; i<playersArray.length; i++){
      playerIDs.push(playersArray[i].playerID);
    }
    return {id: this.sessionID , name:this.sessionName, 'playerIDs':playerIDs, 'readyIDs':readyArray, 'isPlaying':this.bol_isPlaying};
  }
}

global.GameSession = GameSession;