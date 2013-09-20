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
				case "lobbymessage":
					//chat messages in lobby
					//message is stored in [message.content]
					break;
				case "receiveInvite":
					//receive invitation to join game session
					break;
                case "update":
					//update the game values
                    break;
                default: 
					//unhandled message type, show error
					break;
                }
            }
        } catch (e) {
            console.log("Failed to connect to " + "http://" + GameConstants.SERVER_NAME + ":" + GameConstants.PORT);
        }
    }
	
	var updatePlayerName = function(name){
		 sendToServer({type:"updatePlayerName",name});
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


