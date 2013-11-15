// enforce strict/clean programming
"use strict";
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameConstants.js");
require(LIB_PATH + "Engine.js");
function GameSession(id) {
    //Private variables
    var playersArray =  new Array();
    //Array that stores the players
    var readyArray =  new Array();
    //contains ID only
    //Public variables
    this.sessionName;
    //Name of the session (can be duplicate)
    this.sessionID;
    //Constructor
    this.sessionID = id;
    this.bol_isPlaying = false;
    var that = this;
    //GameSession Engine values
    var game_Mode = 0;
    var bol_gameHasEnded = false;
    var intervalShrink = null;
    var gameEngine = null;
    //Bucket
    var BucketList = [];
    var intervalBucket = null;
	
	//Score sync
	var scoreSync = null;
	
    this.broadcast = function (msg) {
        for (var i = 0; i < playersArray.length; i++) {
            playersArray[i].socket.write(JSON.stringify(msg));
        }
    }
    this.unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    }
    this.addPlayer = function (player) {
        //Restrict number of players
        if (playersArray.length >= GameConstants.NUM_OF_PLAYERS || this.bol_isPlaying == true) {
            return false;
        }
        //Check if name already exist, return false if exist, else return true
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].playerID == player.playerID) {
                return false;
            }
        }
        playersArray.push(player);
        player.currentGameSession = this;
        //player is not playing yet, only in session
        return true;
    }
    this.togglePlayerReady = function (player) {
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].playerID == player.playerID) {
                //search for ID in ready Array
                for (var j = 0; j < readyArray.length; j++) {
                    if (readyArray[j] == player.playerID) {
                        readyArray.splice(j, 1);
                        return;
                    }
                }
                readyArray.push(player.playerID);
                return;
            }
        }
    }
    this.toggleGameMode = function () {
        if (game_Mode == 0) {
            game_Mode = 1;
        }
        else {
            game_Mode = 0;
        }
    }
    this.removePlayer = function (player) {
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].playerID == player.playerID) {
                playersArray.splice(i, 1);
            }
        }
        for (var i = 0; i < readyArray.length; i++) {
            if (readyArray[i] == player.playerID) {
                readyArray.splice(i, 1);
            }
        }
        if (gameEngine != null  && player.shapeID != null) {
            gameEngine.removePlayerWithShapeID(player.shapeID);
        }
        player.shapeID = null;
    }
    this.canStartGame = function () {
        return (playersArray.length == GameConstants.NUM_OF_PLAYERS && playersArray.length == readyArray.length);
    }
    this.hasNoPlayers = function () {
        return (playersArray.length == 0);
    }
    this.startGame = function () {
        if (that.canStartGame() == true) {
            that.bol_isPlaying = true;
            that.broadcast({type : "startGame"});
            setTimeout(function () {
                initServerGameEngine();
            }
            , 5000);
        }
    }
    var initServerGameEngine = function () {
        global.Box2D = require(LIB_PATH + "Box2dWeb-2.1.a.3.min.js").Box2D;
        var Engine = require(LIB_PATH + "Engine.js").Engine;
        gameEngine =  new Engine();
        gameEngine.bol_Server = true;
        gameEngine.init();
        gameEngine.start('canvas', game_Mode);
        //add game_Mode to the engine ****************************************************************************************
        //Set name so that can remove from engine later
        for (var i = 0; i < playersArray.length; i++) {
            playersArray[i].shapeID = GameConstants.SHAPE_NAME + (i + 1);
        }
         intervalBucket = setInterval(processBucket, 100);
        //100 because client checks keys at 100 interval
        if (game_Mode == 0) {
            if (intervalShrink != null) {
                clearInterval(intervalShrink);
            }
            //Classic Ground Shrink Mode
             intervalShrink = setInterval(function () {
                //Shrink until a certain limit
                if (gameEngine.currentGroundRadius() > 3.0) {
                    var newRadius = gameEngine.currentGroundRadius() - 0.1;
                    gameEngine.shrinkGroundToRadius(newRadius);
                    that.broadcast({type : "updateGameStates", groundRadius :  newRadius});
                }
                else {
                    clearInterval(intervalShrink);
                     intervalShrink = null;
                }
            }
            , 2000);
        }
        else if (game_Mode == 1) {
            //Points Mode
        }
        else {
            console.log('Unknown Game Mode found');
        }
    }
    var updateServerStates = function () {
        if (gameEngine != null) {
            that.broadcast( {type : "updatePlayerStates", playerStates : gameEngine.getPlayerStates()});
        }
    }
    var updateServerScores = function () {
		if (gameEngine != null) {
			that.broadcast( {type : "updatePlayerScores", playerScores : gameEngine.getPlayerScores()});
		}
    }
    this.cleanup = function () {
        bol_gameHasEnded = true;
        if (gameEngine != null) {
            gameEngine.stopAndDestroyWorld();
            gameEngine = null;
        }
        if (intervalShrink != null) {
            clearInterval(intervalShrink);
             intervalShrink = null;
        }
        if (intervalBucket != null) {
            clearInterval(intervalBucket);
             intervalBucket = null;
        }
    }
	
	//Detect only if score change then send score
	var checkIfUpdateServerScoresNeeded = function(){
		if(gameEngine!=null && (scoreSync==null || scoreSync!=gameEngine.getPlayerScores())){
			updateServerScores();
			scoreSync = gameEngine.getPlayerScores();
		}
	}
	
    //For client to server communication
    this.updatePlayerState = function (playerID, playerState) {
        var bol_found = false;
        for (var i = 0; i < BucketList.length && bol_found == false; i++) {
            if (BucketList[i].id == playerID) {
                BucketList[i].message = playerState;
                bol_found = true;
            }
        }
        if (bol_found == false) {
            BucketList.push(new BucketSlot(playerID, playerState));
        }
    }
	
    var processBucket = function () {
        for (var j = 0; j < BucketList.length; j++) {
            for (var i = 0; i < playersArray.length; i++) {
                if (playersArray[i].playerID == BucketList[j].id) {
					if(playersArray[i].shapeID!=null){
						gameEngine.pushPlayerShape(playersArray[i].shapeID, BucketList[j].message.moveX, BucketList[j].message.moveY);
					}else{
						console.log("failed to process playerID: "+playersArray[i].playerName+"'s bucket due to null shapeID");
					}
                    break;
                }
            }
        }
        BucketList = [];
        //Next frame update player position
        setTimeout(updateServerStates, GameConstants.FRAME_RATE);
		setTimeout(checkIfUpdateServerScoresNeeded,GameConstants.FRAME_RATE);
    }
	
    //privilege method
    this.getAbstractGameSessionText = function () {
        var playerIDs = [];
        for (var i = 0; i < playersArray.length; i++) {
            playerIDs.push(playersArray[i].playerID);
        }
        return {id : this.sessionID, name : this.sessionName, 'playerIDs' : playerIDs, 'readyIDs' : readyArray, 'isPlaying' : this.bol_isPlaying, 'gameMode' : game_Mode};
    }
}
//for bucket sync
function BucketSlot(id, message) {
    this.id = id;
    this.message = message;
}
global.GameSession = GameSession;
