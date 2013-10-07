// enforce strict/clean programming
"use strict"; 

//Client will require the html to have jQuery installed

function Client(){
	var abstractPlayersArray = new Array(); //Array that contains AbstractPlayers (does not include this client)
	var abstractSessionArray = new Array(); //Array that contains AbstractGameSessions
	var socket;
	var playerName="";
	
	var sendToServer = function (msg) {
        socket.send(JSON.stringify(msg));
    }
	
	var showLoginHTML = function(){
		var html = "";
		html+='<div id=\"user-login\" title=\"Login\">'+"\n";
		html+='<p class=\"validateTips\">Please Enter A Username</p>'+"\n";
		html+='<input type=\"text\" name=\"username\" id=\"username\" class=\"text ui-widget-content ui-corner-all\" />'+"\n";
		html+='</div>'+"\n";
		$('html').append(html);
		$( "#user-login" ).dialog({
			autoOpen: true,
			closeOnEscape: false,
			modal: true,
			height: 300,
			width: 400,
			open: function() { 
				$(".ui-dialog-titlebar-close").remove(); //remove the close button
			},
			buttons:{
				"Login": function(){
					playerName = $('#username').val();
					updatePlayerName(playerName);
					$(this).dialog("close");
					$('#user-login').remove(); //remove the added html
					showProcessing();
				}
			}
		});
	}
	
	var showProcessing = function(){
		if(document.getElementById("processing") !== null){
			return;
		}
		var html = "";
		html+='<div id=\"processing\" title=\"Processing\">'+"\n";
		html+='<p class=\"validateTips\">Please Wait</p>'+"\n";
		html+='</div>'+"\n";
		$('html').append(html);
		$( "#processing" ).dialog({
			autoOpen: true,
			closeOnEscape: false,
			modal: true,
			height: 100,
			width: 400,
			open: function() { 
				$(".ui-dialog-titlebar-close").remove(); //remove the close button
			}
		});
	}
	
	var hideProcessing = function(){
		if(document.getElementById("processing") !== null){
			$('#processing').dialog("close");
			$('#processing').remove();
		}
	}
	
	var initNetwork = function() {
        // Attempts to connect to game server
        try {
            socket = new SockJS('http://' + GameConstants.SERVER_NAME + ':' + GameConstants.PORT + '/knockout');
            socket.onmessage = function (e) {
                var message = JSON.parse(e.data);
                switch (message.type) {
				case "successConnection":
					console.log("successfully connected to server");
					//Has successfully connected to server
					showLoginHTML();
				break;
				case "successPlayerName":
					//User has input valid playerName that no one else is using
					hideProcessing();
					alert("Welcome "+playerName);
				break;
				case "failPlayerName":
					//User has input invalid playerName that someone else was already using
					playerName="";
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
					abstractSessionArray.splice(0,abstractSessionArray.length);//empty the array
					for(var i=0; i<message.abstractGameSessions.length; i++){
						var newAbstractGameSession = new AbstractGameSession(message.abstractGameSessions[i].name,message.abstractGameSessions[i].id);	
						
						var playerIDs = message.abstractGameSessions[i].playerIDs;
						for(var j=0; j<playerIDs.length; j++)
						{
							var player = getPlayerWithID(playerIDs[j]);
							if(player!=null){
								newAbstractGameSession.addAbstractPlayer(player);
							}else{
								//TODO Show error that player ID was not found
							}
						}
						abstractSessionArray.push(newAbstractGameSession);
					}
				break;
				case "updateSingleLobbySession":
					//includes this client's current session
					//create new playerList
					var playerIDs = message.content.playerIDs;
					var playerList = new Array();
					for(var i=0; i<playerIDs.length; i++)
					{
						var player = getPlayerWithID(playerIDs[i]);
						if(player!=null){
							playerList.push(player);
						}else{
							//TODO Show error that player ID was not found
						}
					}
					
					var tempGameSession = getSessionWithID(message.content.id);
					if(tempGameSession != null){
						//edit old
						tempGameSession.name = message.content.name;
						tempGameSession.abstractPlayersArray = playerList;
						abstractSessionArray.splice(abstractSessionArray.indexOf(tempGameSession),1);
					}else{
						//create new session
						var newAbstractGameSession = new AbstractGameSession(message.content.name,message.content.id);
						newAbstractGameSession.abstractPlayersArray = playerList;
						abstractSessionArray.push(newAbstractGameSession);
					}
				break;	
				case "removeLobbySession":
					for(var i=0; i<abstractSessionArray.length; i++)
					{
						//TODO use another algo to search for the id for efficiency
						if(abstractSessionArray[i].sessionID == message.id){
							abstractSessionArray.splice(i,1);
						}
					}
				break;	
				case "successCreateGameSession":
					//has successfully created a game session
				break;
				case "successJoinGameSession":
					//has successfully join a game session
				break;
				case "failJoinGameSession":
					//failed to join a game session
				break;
				
				
                case "updateGame":
					//update the game values
					//TODO
                break;
				
                default: 
					//TODO un-handled message type, show error
				break;
                }
            }
        } catch (e) {
            console.log("Failed to connect to " + "http://" + GameConstants.SERVER_NAME + ":" + GameConstants.PORT);
			console.log("Error: "+e);
        }
    }
	
	var updatePlayerName = function(playerName){
		sendToServer({type:"updatePlayerName",name:playerName});
	}
	
	var sendLobbyMessage = function(msg){
		sendToServer({type:"sendLobbyMessage",message:msg});
	}
	
	var createGameSession = function(sessionName){
		sendToServer({type:"createGameSession", name:sessionName});
	}
	
	var joinGameSession = function(id){
		sendToServer({type:"joinGameSession", sessionID:id});
	}
	
	var leaveGameSession = function(){
		sendToServer({type:"leaveGameSession"});
	}
	
	var getPlayerWithID = function(id){
		//TODO use better algo
		for(var i=0; i<abstractPlayersArray.length; i++)
		{
			if(abstractPlayersArray[i].playerID == id)
				return abstractPlayersArray[i];
		}
		return null;
	}
	
	var getSessionWithID = function(id){
		//TODO use better algo
		for(var i=0; i<abstractSessionArray.length; i++)
		{
			if(abstractSessionArray[i].sessionID == id)
				return abstractSessionArray[i];
		}
		return null;
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
$( document ).ready(function() {
gameClient.start();
});


