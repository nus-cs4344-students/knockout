// enforce strict/clean programming
"use strict"; 
//Client will require the html to have jQuery installed

function Client(){
  var abstractPlayersArray = new Array(); //Array that contains AbstractPlayers (does not include this client)
  var abstractSessionArray = new Array(); //Array that contains AbstractGameSessions
  var socket;
  var playerName="";
  var currentSessionID=null;

  var sendToServer = function(msg){
    socket.send(JSON.stringify(msg));
  }

  var appendToChat = function(msg){
    //check if chatbox exist
    if($('#chatbox').length>0){
      $('#chatbox').append('<p>'+msg+'</p>');
    }
  }

  var showLoginHTML = function(){
    var html = "";
    html+='<div id="user-login" title="Login">'+"\n";
    html+='<p class="validateTips">Please Enter A Username</p>'+"\n";
    html+='<input type="text" id="username" class="text ui-widget-content ui-corner-all" title="" />'+"\n";
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
            $('#username').tooltip('close');
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
          $('#user-login').parent().find('button').click();
        }
      }
    });
  }

  var showProcessing = function(){
    if($('#processing').length>0){
      return;
    }
    var html = "";
    html+='<div id="processing" title="Processing">'+"\n";
    html+='<p class="validateTips">Please Wait</p>'+"\n";
    html+='</div>'+"\n";
    $('html').append(html);
    $('#processing').dialog({
      autoOpen: true,
      closeOnEscape: false,
      draggable: false,
      modal: true,
      height: 200,
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

  var promptSessionName = function(){
    var html = "";
    html+='<div id="prompt-sessionname" title="Create New Room">'+"\n";
    html+='<p class="validateTips">Please Enter A Room Name</p>'+"\n";
    html+='<input type="text" id="sessionname" class="text ui-widget-content ui-corner-all"/>'+"\n";
    html+='</div>'+"\n";
    $('html').append(html);
    $('#sessionname').tooltip();
    $('#prompt-sessionname').dialog({
      autoOpen: true,
      modal: true,
      draggable: false,
      height: 300,
      width: 400,
      buttons:{
        "Create": function(){
          if($('#sessionname').val().trim().length==0){
            $('#sessionname').tooltip('close');
            $('#sessionname').prop('title', 'Room Name Cannot Be Empty');
            $('#sessionname').tooltip('open');
          }else{
            createGameSession($('#sessionname').val().trim());
            $(this).dialog('close');
            $('#prompt-sessionname').remove(); //remove the added html
            $(document).unbind();//remove all keypress handler
            showProcessing();
          }
        },
        "Cancel": function(){
          $(this).dialog('close');
        }
      },
      close: function() { 
        $('#prompt-sessionname').remove(); //remove the close button
        $(document).unbind();//remove all keypress handler
        //Make enter to press button as well
        $(document).keypress(function(event) {
          //Cross browser compatibility
          var keycode = (event.keyCode ? event.keyCode : event.which);
          if(keycode == '13') {
            if($('#btn_sendChat')>0){
              //Simulate click on chat button when press enter
              $('#btn_sendChat').click();  
            }
          }
        });
      }
    });
      
    $(document).unbind();//remove all keypress handler
    //Make enter to press button as well
    $(document).keypress(function(event) {
      //Cross browser compatibility
      var keycode = (event.keyCode ? event.keyCode : event.which);
      if(keycode == '13') {
        //Make enter to press create
        if($('#prompt-sessionname').length>0){
          $('#prompt-sessionname').parent().find('.ui-dialog-buttonpane').find('button:first').click();
        }
      }
    });
  }

  //This refreshes the lobby display of rooms
  var refreshSessionDisplay = function(){
    console.log("refreshSessionDisplay");
    //Check if the display exist
    if($('#sessionDisplay').length>0){
      $('#sessionDisplay').empty()//remove all the sessions inside
      for(var i=0;i<abstractSessionArray.length;i++){
        var html="";
        html+='<li>';
        //Only allow clicking the room if it has less than the number of players needed and the game has not started yet
        if(abstractSessionArray[i].abstractPlayersArray.length < GameConstants.NUM_OF_PLAYERS && abstractSessionArray[i].bol_isPlaying==false){
          html+='<a class="success button grid" href="#" sessionID="' +abstractSessionArray[i].sessionID+ '" >';
        }else{
          html+='<a class="alert button disabled grid" sessionID="'+ abstractSessionArray[i].sessionID +'" >';
        }
        html+='<h6>'+abstractSessionArray[i].sessionName+'</h6>';
        html+='<h2>'+abstractSessionArray[i].abstractPlayersArray.length+'/'+GameConstants.NUM_OF_PLAYERS+'</h2>';
        if(abstractSessionArray[i].bol_isPlaying==false){
          html+='<h3>Waiting</h3>';
        }else{
          html+='<h3>Playing</h3>';
        }
        html+='</a>';
        html+='</li>';
        $('#sessionDisplay').append(html);
        $('a[sessionID='+abstractSessionArray[i].sessionID+']').unbind();
        
        if(abstractSessionArray[i].abstractPlayersArray.length < GameConstants.NUM_OF_PLAYERS && abstractSessionArray[i].bol_isPlaying==false){
          //Only allow clicking it if some details satisfy
          $('a[sessionID='+abstractSessionArray[i].sessionID+']').button().click( function(event){
            event.preventDefault();
            showProcessing();
            joinGameSession($(this).attr('sessionID'));
          });
        }
      }
    }
  }

  //This refreshes the room display of players
  var refreshSessionPlayersDisplay = function(){
    if($('#playerDisplay').length>0){
      $('#playerDisplay').empty();
      console.log("refreshSessionPlayersDisplay");
          
      var currentSession = getSessionWithID(currentSessionID);
      if(currentSessionID!=null){
        //this session is the abstractGameSession
        for(var i=0;i<currentSession.abstractPlayersArray.length;i++){  
          //check if id is inside readyID list
          var ready = false;
          for(var j=0;j<currentSession.abstractReadyArray.length && ready==false;j++){
            if(currentSession.abstractReadyArray[j]==currentSession.abstractPlayersArray[i].playerID){
              ready=true;
            }
          }
          
          var html="";
          html+='<li>';
          if(ready==true){
            html+='<a class="success button disabled grid" href="#">';
          }else{
            html+='<a class="alert button disabled grid">';
          }
          html+='<h2>'+currentSession.abstractPlayersArray[i].playerName+'</h2>';
          if(ready==true){
            html+='<h3>Ready</h3>';
          }else{
            html+='<h3>Not Ready</h3>';
          }
          html+='</a>';
          html+='</li>';
          
          $('#playerDisplay').append(html);
        }
      }else{
        alert("oh no, current session ID is null!");
      }
    }
  }

  var initSession = function(){
    $('#contentHTML').empty();
    $('#contentHTML').load('http://' + GameConstants.SERVER_NAME + ':' + GameConstants.PORT + '/templates/room.html',function(responseData){
      //This part of code will run after content has loaded
        
      document.title='KnockOut | Room';
       
      initChatBox();
      if($('#chatbox').length>0){
        $('#chatbox').empty();
        appendToChat('Welcome '+playerName);
      }
        
        //Set button functions
      $('#btn_leave').button().click( function(event){
        leaveGameSession();
        initLobby();
      });
        
      $('#btn_start').button().click( function(event){
        var currentSession = getSessionWithID(currentSessionID);
        if(currentSession!=null){
          $('#btn_start').tooltip('close');
          if(currentSession.abstractPlayersArray.length < GameConstants.NUM_OF_PLAYERS){
            $('#btn_start').prop('title', 'Require 4 players to start the game');
            $('#btn_start').tooltip('open');
          }else if(currentSession.abstractPlayersArray.length != currentSession.abstractReadyArray.length){
            $('#btn_start').prop('title', 'Not All Players Are Ready Yet');
            $('#btn_start').tooltip('open');
          }else{
            sendStartGame();
          }  
        }
      });
        
      $('#btn_start').tooltip();
        
      $('#btn_ready').button().click( function(event){
        toggleReady();
      });

      refreshSessionPlayersDisplay();
    });
  }

  var initChatBox = function(){
    //initialize chat box function
    $('#btn_sendChat').button().click( function(event){
      event.preventDefault();
      if($('#inputChat').val().trim().length>0){
        sendMessage($('#inputChat').val().trim());
        $('#inputChat').val('');
        $('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
      }
      $('#inputChat').focus();
    });
    
    $('#inputChat').focus();
    $(document).unbind();
    //Make enter to press button as well
    $(document).keypress(function(event) {
      //Cross browser compatibility
      var keycode = (event.keyCode ? event.keyCode : event.which);
      if(keycode == '13') {   
        //Simulate click on chat button when press enter
        $('#btn_sendChat').click();  
      }
    });
  }

  var initLobby = function(){
    $('#contentHTML').empty();
    $('#contentHTML').load('http://' + GameConstants.SERVER_NAME + ':' + GameConstants.PORT + '/templates/lobby.html',function(responseData){
      //This part of code will run after content has loaded
      document.title='KnockOut | Lobby';
      
      initChatBox();
      
      //update chatbox
      if($('#chatbox').length>0){
        $('#chatbox').empty();
        appendToChat('Welcome '+playerName);
        appendToChat('[There are '+abstractPlayersArray.length+' player(s) playing KnockOut right now]');
      }
      
      //Set button functions
      $('#btn_new_room').button().click( function(event){
        event.preventDefault();
        promptSessionName();
      });
      
      $('#btn_quick_join').button().click( function(event){
        event.preventDefault();
        //TODO
        //alert('suppose to be quick join but using it to quick test game');
        initGame();
      });
      
      refreshSessionDisplay();
    });
  }

  var initGame = function(){
    $('#contentHTML').empty();      
    document.title='KnockOut | Game';
    
    $(document).unbind();
    //TODO start binding onto gaming keys
    $('#contentHTML').append('<canvas id="canvas" width="800" height="800" style="border: 1px solid black"></canvas>');

    var SCALE = 30,
        destroy_list = [],
        canvas,
        ctx,
        world,
        fixDef,
        orientation,
        xMoveD,
        yMoveD,
        shapes = {},
        playerShapes = {};


    var b2Vec2 = Box2D.Common.Math.b2Vec2,
        b2AABB = Box2D.Collision.b2AABB,
        b2BodyDef = Box2D.Dynamics.b2BodyDef,
        b2Body = Box2D.Dynamics.b2Body,
        b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
        b2Fixture = Box2D.Dynamics.b2Fixture,
        b2World = Box2D.Dynamics.b2World,
        b2MassData = Box2D.Collision.Shapes.b2MassData,
        b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
        b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
        b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
        b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
        b2Listener = Box2D.Dynamics.b2ContactListener
        ;

    var debug = false;

    var init = {
      start: function(id) {
        this.canvas(id);

        box2d.create.world();
        box2d.create.defaultFixture();

        this.gameobjects.ground();
        this.gameobjects.player1();

        this.callbacks();

        function mainloop() {
            loop.step();
            loop.update();
            if (debug) {
                world.DrawDebugData();
            }
            loop.draw();
            
        };
        window.setInterval(mainloop, 1000 / 60);
      },
  
      canvas: function(id) {
        canvas = document.getElementById(id);
        ctx = canvas.getContext("2d");
      },
            
      gameobjects: {
        ground: function() {
          add.box({
            x: canvas.width / SCALE / 2,
            y: canvas.width / SCALE / 2,
            height: canvas.width / SCALE - 7,
            width: canvas.width / SCALE - 7,
            id: 1,
            isStatic: true,
            isSensor: true
          });
        },
        player1: function() {
          add.circle({
            x:10,
            y:10,
            id: "myDisk",
          });
        }
      },
      
      callbacks: function() {
        canvas.addEventListener('click', function(e) {
          var shapeOptions = {
            x: Math.random() * 10 + 10,
            y: Math.random() * 10 + 10,
          };
          add.circle(shapeOptions);
        }, false);

        var listener = new b2Listener;
        listener.PostSolve = function(contact, impulse) {
          // console.log(impulse);
        }

        listener.EndContact = function(contact) {
          if (contact.GetFixtureA().GetBody().GetUserData() == 1) {
            // console.log(contact.GetFixtureB().GetBody());
            // console.log(world);
            destroy_list.push(contact.GetFixtureB().GetBody());
            // world.DestroyBody(contact.GetFixtureB().GetBody());
            // console.log(world);
            // console.log(shapes[contact.GetFixtureB().GetBody().GetUserData()]);
          };  
        }
        world.SetContactListener(listener);

        window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
        window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

        if (window.DeviceOrientationEvent) {
          window.addEventListener('deviceorientation', function(eventData) {
            orientation = {
              // gamma is the left-to-right tilt in degrees, where right is positive
              tiltLR: eventData.gamma,
              // beta is the front-to-back tilt in degrees, where front is positive
              tiltFB: eventData.beta,
              // alpha is the compass direction the device is facing in degrees
              dir: eventData.alpha
            };
          }, false);
        }
      }
    };

    var Key = {
      _pressed: {},

      A: 65,
      W: 87,
      D: 68,
      S: 83,
      J: 74,
      I: 73,
      K: 75,
      L: 76,
      SPACE: 32,
      
      isDown: function(keyCode) {
        return this._pressed[keyCode];
      },
      onKeydown: function(event) {
        this._pressed[event.keyCode] = true;
      },
      onKeyup: function(event) {
        delete this._pressed[event.keyCode];
      }
    };    
         
    var add = {
      circle: function(options) {
        options.radius = 1.5;
        var shape = new Circle(options);
        shapes[shape.id] = shape;
        box2d.addToWorld(shape);
      },
      box: function(options) {
        options.width = options.width || 0.5 + Math.random()*2;
        options.height = options.height || 0.5 + Math.random()*2;
        var shape = new Box(options);
        shapes[shape.id] = shape;
        box2d.addToWorld(shape);
      }
    };

    var box2d = {
      addToWorld: function(shape) {
        var bodyDef = this.create.bodyDef(shape);
        bodyDef.linearDamping = 0.3;
        var body = world.CreateBody(bodyDef);
        if (shape.radius) {
          fixDef.shape = new b2CircleShape(shape.radius);
        } else {
          fixDef.shape = new b2PolygonShape;
          fixDef.shape.SetAsBox(shape.width / 2, shape.height / 2);
        }
        
        fixDef.isSensor = shape.isSensor;
        body.CreateFixture(fixDef);
        playerShapes[shape.id] = body;
        // console.log(playerShapes);
        // console.log(body);
        // console.log(fixDef);
      },
      create: {
        world: function() {
          world = new b2World(
            new b2Vec2(0, 0)    //gravity
            , false                 //allow sleep
          );
          
          // change to isometric view          
          ctx.save();
          ctx.translate(400, 100);
          ctx.scale(0.8, 0.48);
          ctx.rotate(45 * Math.PI /180);
          if (debug) {
            var debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(ctx);
            debugDraw.SetDrawScale(30.0);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            world.SetDebugDraw(debugDraw);
          }
        },
        defaultFixture: function() {
          fixDef = new b2FixtureDef;
          fixDef.density = 0.8;
          // fixDef.friction = 0.5;
          fixDef.restitution = 0.8;
        },
        bodyDef: function(shape) {
          var bodyDef = new b2BodyDef;
          
          if (shape.isStatic == true) {
            bodyDef.type = b2Body.b2_staticBody;
          } else {
            bodyDef.type = b2Body.b2_dynamicBody;
          }
          bodyDef.position.x = shape.x;
          bodyDef.position.y = shape.y;
          bodyDef.userData = shape.id;
          bodyDef.angle = shape.angle;
          
          return bodyDef;
        }
      },
      get: {
        bodySpec: function(b) {
          return {
            x: b.GetPosition().x, 
            y: b.GetPosition().y, 
            angle: b.GetAngle(), 
            center: {
              x: b.GetWorldCenter().x, 
              y: b.GetWorldCenter().y
            }
          };
        }
      }
    };
    var loop = {
      step: function() {
        var stepRate = 1 / 60;
        world.Step(stepRate, 10, 10);
        world.ClearForces();
        

        var xMove=0, yMove=0;
        if (Key.isDown(Key.S) || Key.isDown(Key.D) || Key.isDown(Key.W) || Key.isDown(Key.A) || 
          orientation.tiltFB != null || orientation.tiltLR != null || orientation.dir !=null) {
          if (Key.isDown(Key.S)) {xMove += 30; yMove += 30;} //s
          if (Key.isDown(Key.D)) {xMove += 30; yMove -= 30;} //d
          if (Key.isDown(Key.W)) {xMove -= 30; yMove -= 30;} //w
          if (Key.isDown(Key.A)) {xMove -= 30; yMove += 30;} //a

          xMove += orientation.tiltFB * 1.5; yMove += orientation.tiltFB * 1.5;
          xMove += orientation.tiltLR * 1.5; yMove -= orientation.tiltLR * 1.5;

          xMoveD = xMove;
          yMoveD = yMove;
          // console.log("move: "+xMove+" "+yMove);
          var myDisk = playerShapes["myDisk"];
          myDisk.ApplyForce(new b2Vec2(xMove,yMove),myDisk.GetWorldCenter());
        }
      },
      
      update: function () {
        for (var i in destroy_list) {
          world.DestroyBody(destroy_list[i]);
          delete shapes[destroy_list[i].GetUserData()];
        }
        // Reset the array
        destroy_list.length = 0;
        for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
          }
        }
      },
      
      draw: function() {            
        if (!debug) ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i in shapes) {
          shapes[i].draw();
        }
        //debug xMove & yMove
        ctx.font="60px Segoe UI";
        ctx.fillStyle = "#555555";
        ctx.fillText("x: " + xMoveD,120,600);
        ctx.fillText("y: " + yMoveD,120,670);
      }
    };    
        
    var helpers = {
      randomColor: function() {
        var letters = '0123456789ABCDEF'.split(''),
          color = '#';
        for (var i = 0; i < 6; i++ ) {
          color += letters[Math.round(Math.random() * 15)];
        }
        return color;
      }
    };
        
    /* Shapes down here */
        
    var Shape = function(v) {
      this.id = v.id || Math.round(Math.random() * 1000000);
      this.x = v.x || Math.random()*23 + 1;
      this.y = v.y || 0;
      this.angle = 0;
      this.color = helpers.randomColor();
      this.center = { x: null, y: null };
      this.isStatic = v.isStatic || false;
      // this.categoryBits = v.categoryBits || null;
      // this.maskBits = v.maskBits || null;
      this.isSensor = v.isSensor || false;
      
      this.update = function(options) {
        this.angle = options.angle;
        this.center = options.center;
        this.x = options.x;
        this.y = options.y;
      };
    };
        
    var Circle = function(options) {
      Shape.call(this, options);
      this.radius = options.radius || 1;
            
      this.draw = function() {
        ctx.save();
        ctx.translate(this.x * SCALE, this.y * SCALE);
        ctx.rotate(this.angle);
        ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x * SCALE, this.y * SCALE, this.radius * SCALE, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
    };
    Circle.prototype = Shape;
        
    var Box = function(options) {
      Shape.call(this, options);
      this.width = options.width || Math.random()*2+0.5;
      this.height = options.height || Math.random()*2+0.5;
            
      this.draw = function() {
        ctx.save();
        ctx.translate(this.x * SCALE, this.y * SCALE);
        ctx.rotate(this.angle);
        ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
        ctx.fillStyle = this.color;
        ctx.fillRect(
            (this.x-(this.width / 2)) * SCALE,
            (this.y-(this.height / 2)) * SCALE,
            this.width * SCALE,
            this.height * SCALE
        );
        ctx.restore();
      };
    };
    Box.prototype = Shape;
        
    init.start('canvas');        
  }

  var initNetwork = function(){
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
            break;
          case "failPlayerName":
            //User has input invalid playerName that someone else was already using
            hideProcessing();
            showLoginHTML();
            $('#username').tooltip('close');
            $('#username').prop('title', 'Username already taken, please try another Username');
            $('#username').tooltip('open');
            playerName="";
            break;
          case "lobbyMessage":
            if(currentSessionID==null){
                //chat messages in lobby
                appendToChat(message.name+': '+message.msg);
                //if chatbox exist
                //auto scroll the chatbox only if the scroll is at the bottom
                if($('#chatbox').length>0 && ($('#chatbox')[0].scrollHeight-$('#chatbox').scrollTop())<=226){
                    //Need [0] to access DOM object
                    //Manually measured 226
                    $('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
                }
            }
            break;
            case "sessionMessage":
                if(currentSessionID!=null){
                    //chat messages in lobby
                    appendToChat(message.name+': '+message.msg);
                    //if chatbox exist
                    //auto scroll the chatbox only if the scroll is at the bottom
                    if($('#chatbox').length>0 && ($('#chatbox')[0].scrollHeight-$('#chatbox').scrollTop())<=226){
                        //Need [0] to access DOM object
                        //Manually measured 226
                        $('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
                    }
                }
            break;
            case "addLobbyPlayer":
                var newAbstractPlayer = new AbstractPlayer(message.name, message.id);
                abstractPlayersArray.push(newAbstractPlayer);
                if($('.lobby').length>0){
                    //Only show message if client is in lobby
                    appendToChat('['+message.name+' has logined]');
                }
            break;
            case "removeLobbyPlayer":
                for(var i=0; i<abstractPlayersArray.length; i++)
                {
                    //TODO use another algo to search for the id for efficiency
                    if(abstractPlayersArray[i].playerID == message.id){
                        if($('.lobby').length>0){
                            //Only show message if client is in lobby
                            appendToChat('['+abstractPlayersArray[i].playerName+' has left the game]');
                        }
                        abstractPlayersArray.splice(i,1);
                        break;
                    }
                }
            break;
            case "updateLobbyPlayers":
                console.log("updateLobbyPlayers");
                //abstractPlayers does not include this client
                abstractPlayersArray.splice(0,abstractPlayersArray.length);//empty the array
                for(var i=0; i<message.abstractPlayers.length ; i++){
                    var newAbstractPlayer = new AbstractPlayer(message.abstractPlayers[i].name, message.abstractPlayers[i].id);
                    newAbstractPlayer.bol_isPlaying=message.abstractPlayers[i].isPlaying;
                    abstractPlayersArray.push(newAbstractPlayer);
                }
            break;
            case "updateLobbySessions":
                console.log("updateLobbySessions");
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
                            console.log("playerID "+playerIDs[j]+" was not found");
                        }
                    }
                    newAbstractGameSession.abstractReadyArray = message.abstractGameSessions[i].readyIDs;
                    newAbstractGameSession.bol_isPlaying = message.abstractGameSessions[i].isPlaying;
                    abstractSessionArray.push(newAbstractGameSession);
                }
                refreshSessionDisplay();
            break;
            case "updateSingleLobbySession":
                console.log("updateSingleLobbySession");
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
                        console.log("playerID "+playerIDs[i]+" was not found");
                    }
                }
                
                var tempGameSession = getSessionWithID(message.content.id);
                if(tempGameSession != null){
                    //edit old
                    tempGameSession.name = message.content.name;
                    tempGameSession.abstractPlayersArray = playerList;
                    tempGameSession.abstractReadyArray = message.content.readyIDs;
                    tempGameSession.bol_isPlaying = message.content.isPlaying;
                    console.log("edit game session");
                    
                    if(currentSessionID!=null && message.content.id == currentSessionID){
                        if($('#btn_start').length>0){
                            //refresh tooltip if current game session has updates
                            $('#btn_start').tooltip('close');
                            $('#btn_start').prop('title','');
                        }
                    }
                }else{
                    //create new session
                    var newAbstractGameSession = new AbstractGameSession(message.content.name,message.content.id);
                    newAbstractGameSession.abstractPlayersArray = playerList;
                    newAbstractGameSession.abstractReadyArray = message.content.readyIDs;
                    newAbstractGameSession.bol_isPlaying = message.content.isPlaying;
                    abstractSessionArray.push(newAbstractGameSession);
                    console.log("create new game session");
                }
                refreshSessionDisplay();
                refreshSessionPlayersDisplay();
            break;  
            case "removeLobbySession":
                console.log("removeLobbySession");
                console.log(message.id);
                for(var i=0; i<abstractSessionArray.length; i++)
                {
                    //TODO use another algo to search for the id for efficiency
                    if(abstractSessionArray[i].sessionID == message.id){
                        abstractSessionArray.splice(i,1);
                    }
                }
                refreshSessionDisplay();
            break;  
            case "successCreateGameSession":
            case "successJoinGameSession":
                //has successfully join a game session
                currentSessionID=message.sessionID;
                hideProcessing();
                initSession();
            break;
            case "failJoinGameSession":
                //failed to join a game session
                hideProcessing();
                alert('Failed to join room, sorry :(');
            break;  

            case "startGame":
                appendToChat('[Game is Starting in 5]');
                setTimeout(function() {appendToChat('[Game is Starting in 4]');}, 1000);
                setTimeout(function() {appendToChat('[Game is Starting in 3]');}, 2000);
                setTimeout(function() {appendToChat('[Game is Starting in 2]');}, 3000);
                setTimeout(function() {appendToChat('[Game is Starting in 1]');}, 4000);
                setTimeout(function() {initGame();}, 5000);
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

  //Below are functions that send JSON to server
  var updatePlayerName = function(playerName){
    sendToServer({type:"updatePlayerName",name:playerName});
  }

  var sendMessage = function(msg){
    sendToServer({type:"sendMessage",message:msg});
  }

  var createGameSession = function(sessionName){
    sendToServer({type:"createGameSession", name:sessionName});
  }

  var toggleReady = function(){
    sendToServer({type:"toggleReady"});
  }

  var sendStartGame = function(){
    sendToServer({type:"startGame"});
  }

  var joinGameSession = function(id){
    sendToServer({type:"joinGameSession", sessionID:id});
  }

  var leaveGameSession = function(){
    sendToServer({type:"leaveGameSession"});
    currentSessionID=null;
  }

  var getPlayerWithID = function(id){
    //TODO use better algo
    for(var i=0; i<abstractPlayersArray.length; i++){
      if(abstractPlayersArray[i].playerID == id){
        return abstractPlayersArray[i];
      }
    }
    return null;
  }

  var getSessionWithID = function(id){
    //TODO use better algo
    for(var i=0; i<abstractSessionArray.length; i++){
      if(abstractSessionArray[i].sessionID == id){
        return abstractSessionArray[i];
      }
    }
    return null;
  }

  this.start = function(){
    initNetwork();
  }
	
	
}

// Run Client. Give leeway of 0.5 second for libraries to load
var gameClient = new Client();
$( document ).ready(function(){
  gameClient.start();
});