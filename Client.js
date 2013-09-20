// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./";
require(LIB_PATH + "AbstractPlayer.js");

function Client(){
	var abstractPlayersArray = new Array(); //Array that contains AbstractPlayers (including this client name)
	
	var sendToServer = function (msg) {
        socket.send(JSON.stringify(msg));
    }
	
	var initNetwork = function() {
        // Attempts to connect to game server
        try {
            socket = new SockJS("http://" + GameConstants.SERVER_NAME + ":" + GameConstants.PORT + "/knockout");
            socket.onmessage = function (e) {
                var message = JSON.parse(e.data);
                switch (message.type) {
				case "successConnection":
					//Has successfully connected to server
				break;
				case "successPlayerName":
					//User has input valid playerName that no one else is using
				break;
				case "failPlayerName":
					//User has input invalid playerName that someone else was already using
				break;
				case "lobbyMessage":
					//chat messages in lobby
					//name of user stored in [message.name]
					//message is stored in [message.msg]
				break;
				case "addLobbyPlayer":
					var newAbstractPlayer = new AbstractPlayer(message.name, message.id);
					abstractPlayersArray.push(newAbstractPlayer);
				break;
				case "removeLobbyPlayer":
					for(var i=0; i<abstractPlayersArray.length; i++)
					{
						//TODO use another algo to search for the id for efficiency
						if(abstractPlayersArray[i].playerID == message.id){
							abstractPlayersArray.splice(i,1);
						}
					}
				break;
				case "updateLobbyPlayers":
					//abstractPlayers does not include this client
					abstractPlayersArray.splice(0,abstractPlayersArray.length);//empty the array
					for(var i=0; i<message.abstractPlayers.length ; i++){
						var newAbstractPlayer = new AbstractPlayer(message.abstractPlayers[i].name, message.abstractPlayers[i].id);
						abstractPlayersArray.push(newAbstractPlayer);
					}
				break;
				
				case "updateLobbySessions":
				break;
				
				case "successCreateGameSession":
					//has successfully created a game session
				break;
				
				case "receiveInvite":
					//receive invitation to join game session
					//TODO
				break;

				case "updateCurrentSession":
					//TODO
				break;
                case "updateGame":
					//update the game values
					//TODO
                break;
				
                default: 
					//un-handled message type, show error
				break;
                }
            }
        } catch (e) {
            console.log("Failed to connect to " + "http://" + GameConstants.SERVER_NAME + ":" + GameConstants.PORT);
        }
    }
	
	var updatePlayerName = function(playerName){
		sendToServer({type:"updatePlayerName",name:playerName});
	}
	
	var sendLobbyMessage = function(msg){
		sendToServer({type:"sendLobbyMessage",message:msg});
	}
	
	var createGameSession = function(){
		sendToServer({type:"createGameSession"});
	}
	
	var joinGameSession = function(id){
		sendToServer({type:"joinGameSession", sessionID:id});
	}
	
	this.start = function() {
		initNetwork();
		//initGUI();

        // Start drawing 
        //setInterval(function() {render();}, 1000/Pong.FRAME_RATE);
	}
}

// Run Client. Give leeway of 0.5 second for libraries to load
var gameClient = new Client();
setTimeout(function() {gameClient.start();}, 500);


