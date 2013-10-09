// enforce strict/clean programming
"use strict"; 

//Client will require the html to have jQuery installed

function Client(){
	var abstractPlayersArray = new Array(); //Array that contains AbstractPlayers (does not include this client)
	var abstractSessionArray = new Array(); //Array that contains AbstractGameSessions
	var socket;
	var playerName="";
	
	var sendToServer = function(msg) {
        socket.send(JSON.stringify(msg));
    }
	
	var appendToChat = function (msg) {
		//check if chatbox exist
		if($('#chatbox').length>0){
			$('#chatbox').append('<p>'+msg+'</p>');
		}
	}
	
	var showLoginHTML = function(){
		var html = "";
		html+='<div id=\"user-login\" title=\"Login\">'+"\n";
		html+='<p class=\"validateTips\">Please Enter A Username</p>'+"\n";
		html+='<input type=\"text\" name=\"username\" id=\"username\" class=\"text ui-widget-content ui-corner-all\" title=\"\" />'+"\n";
		html+='</div>'+"\n";
		$('html').append(html);
		$('#username').tooltip();
		$('#user-login').dialog({
			autoOpen: true,
			closeOnEscape: false,
			modal: true,
			draggable: false,
			height: 300,
			width: 400,
			open: function() { 
				$('.ui-dialog-titlebar-close').remove(); //remove the close button
			},
			buttons:{
				"Login": function(){
					if($('#username').val().trim().length==0){
						$('#username').prop('title', 'Username cannot be empty');
						$('#username').tooltip('open');
					}else{
						playerName = $('#username').val();
						updatePlayerName(playerName);
						$(this).dialog('close');
						$('#user-login').remove(); //remove the added html
						$(document).unbind();//remove all keypress handler
						showProcessing();
					}
				}
			}
		});
		//Make enter to press button as well
		$(document).keypress(function(event) {
			//Cross browser compatibility
			var keycode = (event.keyCode ? event.keyCode : event.which);
			if(keycode == '13') {
				if($('#user-login').length>0){
					console.log("in");
					$('#user-login').parent().find('button').click();
				}
			}
		});
	}
	
	var showProcessing = function(){
		if($('#processing').length==0){
			return;
		}
		var html = "";
		html+='<div id=\"processing\" title=\"Processing\">'+"\n";
		html+='<p class=\"validateTips\">Please Wait</p>'+"\n";
		html+='</div>'+"\n";
		$('html').append(html);
		$('#processing').dialog({
			autoOpen: true,
			closeOnEscape: false,
			draggable: false,
			modal: true,
			height: 100,
			width: 400,
			open: function() { 
				$('.ui-dialog-titlebar-close').remove(); //remove the close button
			}
		});
	}
	
	var hideProcessing = function(){
		//check if the id exist
		if($('#processing').length>0){
			$('#processing').dialog("close");
			$('#processing').remove();
		}
	}
	
	var initLobby = function() {
		//Add chat function
		$('#contentHTML').load('http://' + GameConstants.SERVER_NAME + ':' + GameConstants.PORT + '/templates/lobby.html',function(responseData){
			//This part of code will run after content has loaded
			
			document.title='KnockOut | Lobby';
			
			if($('.button.postfix.radius').length>0){
				$('.button.postfix.radius').button().click( function(event){
					event.preventDefault();
					if($('#inputChat').val().trim().length>0){
						sendLobbyMessage($('#inputChat').val().trim());
						$('#inputChat').val('');
						$('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
					}
					$('#inputChat').focus();
				});
				//Make button UI look nicer
				$('.button.postfix.radius').removeClass('ui-widget');
				$('.button.postfix.radius').removeClass('ui-state-default');
				$('#inputChat').focus();
				
				//Make enter to press button as well
				$(document).keypress(function(event) {
					//Cross browser compatibility
					
					var keycode = (event.keyCode ? event.keyCode : event.which);
					if(keycode == '13') {	
						if($('.button.postfix.radius').length>0){
							//Simulate click on chat button when press enter
							$('.button.postfix.radius').click();  
						}
					}
				});
			}
		});
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
					initLobby();
					alert("Welcome "+playerName);
				break;
				case "failPlayerName":
					//User has input invalid playerName that someone else was already using
					showLoginHTML();
					$('#username').prop('title', 'Username already taken, please try another Username');
					$('#username').tooltip('open');
					playerName="";
				break;
				case "lobbyMessage":
					//chat messages in lobby
					appendToChat(message.name+': '+message.msg);
					//if chatbox exist
					if($('#chatbox').length>0 && ($('#chatbox')[0].scrollHeight-$('#chatbox').scrollTop())<=226){
						//Need [0] to access DOM object
						//Manually measured 226
						$('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
					}
				break;
				case "addLobbyPlayer":
					var newAbstractPlayer = new AbstractPlayer(message.name, message.id);
					abstractPlayersArray.push(newAbstractPlayer);
					appendToChat('['+message.name+' has logined]');
				break;
				case "removeLobbyPlayer":
					for(var i=0; i<abstractPlayersArray.length; i++)
					{
						//TODO use another algo to search for the id for efficiency
						if(abstractPlayersArray[i].playerID == message.id){
							appendToChat('['+message.name+' has left the game]');
							abstractPlayersArray.splice(i,1);
							break;
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
		

        // Start drawing 
        //setInterval(function() {render();}, 1000/Pong.FRAME_RATE);
	}
}

// Run Client. Give leeway of 0.5 second for libraries to load
var gameClient = new Client();
$( document ).ready(function() {
gameClient.start();
});


