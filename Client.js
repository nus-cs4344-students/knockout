// enforce strict/clean programming
"use strict"; 

function Client(){

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
				
				case "updateLobbyPlayerNames":
				break;
				
				case "updateLobbySessions":
				break;
				
				case "addLobbyPlayer":
				break;
				
				case "removeLobbyPlayer":
				break;
				
				case "receiveInvite":
					//receive invitation to join game session
				break;

				case "updateCurrentSession":
				
				break;
                case "updateGame":
					//update the game values
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


