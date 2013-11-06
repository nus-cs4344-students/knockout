// enforce strict/clean programming
"use strict"; 
var LIB_PATH = "./";
require(LIB_PATH + "Player.js");
require(LIB_PATH + "GameSession.js");

function Lobby() {
  var playersArray = new Array(); //Used to store the players
  var sessionsArray = new Array(); //Used to store game sessions
  var nextPlayerID = 0;
  var nextSessionID = 0;
  var that=this;

  //Broadcast message to all players
  this.broadcast = function (msg) {
    for (var i=0; i<playersArray.length; i++){
      playersArray[i].socket.write(JSON.stringify(msg));
    }
  }
  
  //Broadcast message to all players except 1
  this.broadcastExcept = function (msg,player) {
    for (var i=0; i<playersArray.length; i++){
      if(playersArray[i].playerID != player.playerID){
        playersArray[i].socket.write(JSON.stringify(msg));
      }
    }
  }
  
  this.getSessionCount = function(){
    return sessionsArray.length;
  }
  
  this.unicast = function (socket, msg) {
    socket.write(JSON.stringify(msg));
  }
  
  this.removePlayer = function(player){
    //Remove from the session
    var tempGameSession = that.removePlayerFromSession(player);
    //Remove from array
    playersArray.splice(playersArray.indexOf(player),1);
    return tempGameSession;
  }
  
  this.removeGameSession = function(session){
    sessionsArray.splice(sessionsArray.indexOf(session),1);
	session.cleanup();
  }
  
  this.createNewPlayer = function(socket,playerName){
    //Check if name already exist, return false if exist, else return true
    for (var i=0; i<playersArray.length; i++){
      if(playersArray[i].playerName==playerName)
        return null;
    }
    var newPlayer = new Player(socket,playerName,nextPlayerID);
    nextPlayerID++;
    playersArray.push(newPlayer);
    return newPlayer;
  }
  
  this.createGameSession = function(player,sessionName){
    //Creates a Game session, must have at least 1 player in each session
    var newGameSession = new GameSession(nextSessionID);
    nextSessionID++;
    newGameSession.addPlayer(player);
    newGameSession.sessionName = sessionName;
    sessionsArray.push(newGameSession);
    return newGameSession;
  }
  
  this.addPlayerToSessionID = function(player,id){
    var session = this.getSessionWithID(id);
    if(session==null){
      return false;
    }else{
      return session.addPlayer(player);
    }
  }
  
  this.getSessionWithID = function(id){
    //TODO use better algo
    for(var i=0; i<sessionsArray.length; i++)
    {
      if(sessionsArray[i].sessionID==id){
        return sessionsArray[i];
      }
    }
    return null;
  }
  
  this.removePlayerFromSession = function(player){
    var tempGameSession = player.currentGameSession;
    if(tempGameSession!=null){
      tempGameSession.removePlayer(player);
      if(tempGameSession.hasNoPlayers()){
        this.removeGameSession(tempGameSession);
        tempGameSession = null;
      }
    }
    player.currentGameSession = null;
    player.bol_isPlaying = false;
    
    return tempGameSession;
  }
  
  this.getJSONAbstractPlayers = function(){
    //returns a JSON string to stringify at Server.js, includes every player except the exceptPlayer
    var JSONarray = [];
    for (var i=0; i<playersArray.length; i++){
      JSONarray.push(playersArray[i].getAbstractPlayerText());
    }
    return JSONarray;
  }
  
  this.getJSONAbstractGameSessions = function(){
    //returns a JSON string to stringify at Server.js, includes all GameSessions
    var JSONarray = [];
    for (var i=0; i<sessionsArray.length; i++){
      JSONarray.push(sessionsArray[i].getAbstractGameSessionText());
    }
    return JSONarray;
  }
}

global.Lobby = Lobby;