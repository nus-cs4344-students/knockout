var Engine = function() {
	var b2Vec2;
	var b2BodyDef;
	var b2Body;
	var b2FixtureDef;
	var b2World;
	var b2PolygonShape;
	var b2CircleShape;
	var b2DebugDraw;
	var b2Listener;
	var b2FilterData;
	var world;
	
	var DEFAULT_SCALE = 30,
		SCALE = DEFAULT_SCALE,
        destroy_list = [],
        canvas,
        ctx, //context of canvas
        world, //game world of box2d
        fixDef,
        orientation, //used for mobile devices
        shapes = {}, //used for UI
        bodies = {}, //body of box2d
		WORLD_HEIGHT = GameConstants.CANVAS_HEIGHT,
		WORLD_WIDTH = GameConstants.CANVAS_WIDTH,
		gameMode, //0 is classic, 1 is points
		pointsTimer = 60, //Total time for points
		round = 1, //current round in classic
		numOfRounds = 5, //total number of rounds in classic
		middleText = ""; //Used to display winner messages

	var debug = false;
	var that = this;
	var img_Seal_L;
	var img_Seal_R;
	var img_Penguin_L;
	var img_Penguin_R;
	var img_Bear_L;
	var img_Bear_R;
	var img_Eskimo_L;
	var img_Eskimo_R;
	var pattern_Platform;
	var currentPlayerShapeID;
	var bol_Stop;
	this.bol_Server = false;
	
	//For mobile leave game
	this.mobileLeaveTimer = null;
	
	var intervalUpdateTimer = null;
	var timeoutCheckKeysAndOrientation = null;
	
	//For measuring RTT
	this.RTT = null;
	this.AVG_RTT = null;
	this.pingTime = null;
	
	this.init = function(){
		b2Vec2 = Box2D.Common.Math.b2Vec2;
		b2BodyDef = Box2D.Dynamics.b2BodyDef;
		b2Body = Box2D.Dynamics.b2Body;
		b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
		b2World = Box2D.Dynamics.b2World;
		b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
		b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
		b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
		b2Listener = Box2D.Dynamics.b2ContactListener;
		b2FilterData = Box2D.Dynamics.b2FilterData;		
	}
	
	var setupCallbacks = function(){
        var listener = new b2Listener;

		//listener waits for contact between ground ("id_Ground") and object to end
        listener.EndContact = function(contact) {
			var tempBody;
			if (contact.GetFixtureA().GetBody().GetUserData() == 'id_Ground') {
				tempBody = contact.GetFixtureB().GetBody();
			}else if (contact.GetFixtureB().GetBody().GetUserData() == 'id_Ground') {
				tempBody = contact.GetFixtureA().GetBody();
			}else if(gameMode==1){
				//Points mode
				//Both not ground, means between players
				var id1 = contact.GetFixtureA().GetBody().GetUserData();
				var id2 = contact.GetFixtureB().GetBody().GetUserData();
				if(id1!=null && id2!=null && shapes[id1].isFalling==false && shapes[id2].isFalling==false){
					shapes[id1].lastPlayerTouched=id2;
					shapes[id2].lastPlayerTouched=id1;
				}
			}
			
			if (tempBody!=null && tempBody.IsActive()==true && typeof tempBody.GetUserData() !== 'undefined' && tempBody.GetUserData() != null){
				shapes[tempBody.GetUserData()].isFalling = true;
				//console.log(shapes[tempBody.GetUserData()].id + " is falling");
				//Points mode, increase other player's points
				if(gameMode==1){
					var id = shapes[tempBody.GetUserData()].lastPlayerTouched;
					
					//Add for client, which will be synced from Server as well
					//Unlike classic which only server adds the score and sync with client
					if(id!=null && typeof shapes[id]!='undefined'){
						shapes[id].score+=50;
					}
				}
				
				//Set fallDirection for drawing properly behind or infront the ground
				if(shapes[tempBody.GetUserData()].y>shapes["id_Ground"].y){
					shapes[tempBody.GetUserData()].fallDirection = 1;
				}else{
					shapes[tempBody.GetUserData()].fallDirection = -1;
				}
				//Set groupIndex to -1 so that it will not hit anyone when falling
				var filter = new b2FilterData;
				filter.groupIndex = -1;
				filter.categoryBits = 0x0002;
				filter.maskBits = 0x0000

				tempBody.GetFixtureList().SetFilterData(filter);
				
				//flag all current contacts for filtering again since we changed the filter
				var contactList = tempBody.GetContactList();
				for(var ce = contactList; ce; ce = ce.next){
					var contact = ce.contact;
					contact.FlagForFiltering();
				}
			}
		}
        world.SetContactListener(listener);

        if (!that.bol_Server){
			//for client side only
			if(window.DeviceOrientationEvent) {
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
			
			//Auto resize when window size has been changed
			$(window).bind('resize', function() {
				autoScaleWithScreenSize();
			});
			
			$(window).bind('orientationchange', function(){
				autoScaleWithScreenSize();
			});
			
			//for mobile devices
			if(navigator.appVersion.indexOf("Mobile")>-1){
				canvas.addEventListener("touchstart",function(event){
					event.preventDefault();
					mobileLeaveTimer = setTimeout(function(){
						console.log("leave game");
						sendToServer({type:"leaveGameSession"});
					}, 1000 );
				});
				canvas.addEventListener("touchend",function(event){
					event.preventDefault();
					if(mobileLeaveTimer!=null){
						clearTimeout(mobileLeaveTimer);
						mobileLeaveTimer = null;
					}
				});
			}
		}
	}
	
	this.start = function(id, game_Mode){
		gameMode = game_Mode;
		bol_Stop = false;
		if(!that.bol_Server){
			preloadImages();
			setCanvas(id);
		}
		
        box2d.create.world();
        box2d.create.defaultFixture();
		
		//Create Ground
		createGround(GameConstants.PLATFORM_RADIUS);
		
		//Must evenly space out players
		var angle = 360/GameConstants.NUM_OF_PLAYERS;
		var radian = Math.PI/180;
		//Create circles according to number of player
		for(var i=1;i<=GameConstants.NUM_OF_PLAYERS;i++){
			var c;
			if(i==1){
				c='#5647FF';
			}else if(i==2){
				c='#FF6D8D';
			}else if(i==3){
				c='#FFFA77';
			}else if(i==4){
				c='#91FFBF';
			}else{
				c=getRandomColor();
			}
		
			addCircle({
				radius: GameConstants.PLAYER_RADIUS,
				color: c,
				x:shapes["id_Ground"].x + (GameConstants.PLATFORM_RADIUS-GameConstants.PLAYER_RADIUS)*Math.cos(angle*(i-1)*radian),
				y:shapes["id_Ground"].y + (GameConstants.PLATFORM_RADIUS-GameConstants.PLAYER_RADIUS)*Math.sin(angle*(i-1)*radian),
				id: GameConstants.SHAPE_NAME+i,
				sprite: i,
			});
		}		
		
		//FOR TESTING ONLY, SHOULD BE SET BY SERVER
		currentPlayerShapeID = 'playerDisk1';
		that.setShapeName(currentPlayerShapeID,"omg test bbq vv");

        setupCallbacks();
		
		//update will auto setTimeout recursively
		intervalUpdateTimer = setInterval(update,GameConstants.FRAME_RATE);
		
		//Set timer to run
		if(gameMode==1){
			setTimeout(reducePointsTimer,1000);
		}
		
		if(!that.bol_Server){
			//checkKeysAndOrientation will auto setTimeout recursively
			checkKeysAndOrientation();
		}
	}
	
	var getBrowser = function(){ 
		if(navigator.userAgent.indexOf('Chrome') > -1){
			return 'Chrome';
		}else if(navigator.userAgent.indexOf('MSIE') > -1){
			return 'IE';
		}else if(navigator.userAgent.indexOf('Firefox') > -1){
			return 'Firefox';
		}else if(navigator.userAgent.indexOf("Presto") > -1){
			return 'Opera';
		}else if(navigator.userAgent.indexOf("Safari") > -1){
			return 'Safari'; //safari must be placed behind chrome because chrome has the safrai keyword inside as well
		}
		return 'Unknown';
	}
	
	var setCanvas = function(id){
		canvas = document.getElementById(id);
        ctx = canvas.getContext("2d");
		
		autoScaleWithScreenSize();
	}
	
	//Auto determine the width and height to scale to
	var autoScaleWithScreenSize = function(){
		if(that.bol_Server){
			//Server does not require scaling
			return;
		}
	
		var windowHeight = window.innerHeight;
		var windowWidth = window.innerWidth;
		
		//For mobile devices
		var viewport = document.getElementsByName('viewport')[0];
		viewport.setAttribute('content', 'width = ' + windowWidth + ', minimum-scale=1.0, maximum-scale=1.0, user-scalable=no');
		
		scaleScreenSize(windowWidth,windowHeight);
	}
	
	//Scale canvas to target width and height
	var scaleScreenSize = function(width,height){
		if(that.bol_Server){
			//Server does not require scaling
			return;
		}

		var scrollbarSizeFix = 0;
		if(getBrowser() == 'Firefox'){
			scrollbarSizeFix = 2;
		}else if(getBrowser() == 'Chrome' || getBrowser() == 'IE'){
			scrollbarSizeFix = 3;
		}
		//Auto scale UI with window frame
		var dw = width/GameConstants.CANVAS_WIDTH;
		var dh = height/GameConstants.CANVAS_HEIGHT;
		var smaller = Math.min(dw,dh);
		
		SCALE = DEFAULT_SCALE*smaller;
        ctx.canvas.width = width-scrollbarSizeFix;
		ctx.canvas.height = height-scrollbarSizeFix;
		WORLD_WIDTH = width-scrollbarSizeFix;
		WORLD_HEIGHT = height-scrollbarSizeFix;
	}
	
	//preload Images to make it faster
	var preloadImages = function(){
		$( document ).ready(function(){
			img_Seal_L = new Image();
			img_Seal_R = new Image();
			img_Penguin_L = new Image();
			img_Penguin_R = new Image();
			img_Bear_L = new Image();
			img_Bear_R = new Image();
			img_Eskimo_L = new Image();
			img_Eskimo_R = new Image();
			pattern_Platform = new Image();
			
			img_Seal_L.src = 'http://' + GameConstants.SERVER_ADDRESS + '/images/Seal-L.png';
			img_Seal_R.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Seal-R.png';
			img_Penguin_L.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Penguin-L.png';
			img_Penguin_R.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Penguin-R.png';
			img_Bear_L.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Bear-L.png';
			img_Bear_R.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Bear-R.png';
			img_Eskimo_L.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Eskimo-L.png';
			img_Eskimo_R.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/Eskimo-R.png';
			pattern_Platform.src = 'http://' + GameConstants.SERVER_ADDRESS +'/images/snowGround.png';
		});
	}
	
	var draw = function(){	
		ctx.save();
		if (!debug){
			//Paint blue sky/water background over
			ctx.fillStyle='#81BDF9';
			ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
		}else{
			world.DrawDebugData();
		}
		
		var drawOrder = getDrawOrder();
		//Draw the drawOrder
		for(var i in drawOrder){
			//Change to side view          
			ctx.save();
			ctx.scale(1, 0.5);
			ctx.translate(WORLD_WIDTH/2, WORLD_HEIGHT+100*SCALE/DEFAULT_SCALE);
			drawOrder[i].draw();
			if(drawOrder[i] != shapes["id_Ground"]){
				drawDisplayNameOnShape(drawOrder[i]);
			}else{
				drawGround();
			}
			ctx.restore();
			//Draw sprites on circles
			//Placed below here because we don't want previous ctx manipulation affect this
			if(drawOrder[i] != shapes["id_Ground"]){
				drawSpriteOnShape(drawOrder[i]);
			}
		}
		
		drawInterfaceForScore();
		drawLeaveText();
		drawMiddleText();
		ctx.restore();
	}
	
	//Get the ordering to draw so that some images are behind other images (e.g. falling behind the platform)
	var getDrawOrder = function(){
		var behindGround = [];
		var infrontGround = [];
	
        for (var i in shapes) {
			if(shapes[i]==shapes["id_Ground"]){
				continue;
			}
			if(shapes[i].isFalling==false || shapes[i].fallDirection==1){
				infrontGround.push(shapes[i]);
			}else if(shapes[i].fallDirection==-1){
				behindGround.push(shapes[i]);
			}
		}
		
		var tempinfrontGround = infrontGround.slice(0); //clone using slice
		for(var i in tempinfrontGround){
			//tempinfrontGround is not used in this loop, only used to make sure that the order doesn't change when running this algo
			for(var j in infrontGround){
				if(infrontGround[i]==infrontGround[j]){
					continue;
				}
				var jZ = infrontGround[j].y;
				var iZ = infrontGround[i].y;
				if(iZ<jZ){
					var tempShape = infrontGround[i];
					//remove i from it's original place
					infrontGround.splice(i,1);
					//insert shapes[i] at j
					infrontGround.splice(j,0,tempShape);
					break;
				}
			}
		}
		
		var tempbehindGround = behindGround.slice(0); //clone using slice
		for(var i in tempbehindGround){
			//tempinfrontGround is not used in this loop, only used to make sure that the order doesn't change when running this algo
			for(var j in behindGround){
				if(behindGround[i]==behindGround[j]){
					continue;
				}
				var jZ = behindGround[j].y;
				var iZ = behindGround[i].y;
				if(iZ<jZ){
					var tempShape = behindGround[i];
					//remove i from it's original place
					behindGround.splice(i,1);
					//insert shapes[i] at j
					behindGround.splice(j,0,tempShape);
					break;
				}
			}
		}
		
		return behindGround.concat([shapes["id_Ground"]],infrontGround);
	}
	
	var update = function(){
		if(bol_Stop==false){
			//http://stackoverflow.com/questions/729921/settimeout-or-setinterval
			world.Step(1 / 60, 10, 10);
			world.ClearForces();
			checkToDestroy();
			updateShapeUIFromBox2D();
			updateCustomGravity();
			
			//Check after draw
			if(gameMode==0){
				checkToResetForClassic();
			}else if(gameMode==1){
				resetPositionForPoints();
			}
		}
		if(!that.bol_Server){
			draw();
		}
	}
	
	//Checks to see which object is in destroy_list and must be removed from game
	var checkToDestroy = function(){
		for (var i=0; i<destroy_list.length;i++) {
			if(typeof bodies[destroy_list[i]] !== 'undefined' && bodies[destroy_list[i]]!=null){
				var jointList = bodies[destroy_list[i]].GetJointList();
				for(var j in jointList){
					world.DestroyJoint(jointList[j]);
				}
				
				world.DestroyBody(bodies[destroy_list[i]]);
				delete shapes[destroy_list[i]];
				delete bodies[destroy_list[i]];
			}
		}
        // Reset the array
        destroy_list.length = 0;
	}
	
	//Make objects fall if isFalling is true
	var updateCustomGravity = function(){
		var customGravityForce = 150;
	
		if(bol_Stop == true)
			return;
		//PrintShapes();
		for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            if(shapes[b.GetUserData()].isFalling==true){
				if(b.GetPosition().y <= (WORLD_HEIGHT*2+100)/SCALE){
					//if still on screen, make it fall
					b.ApplyForce(new b2Vec2(0,customGravityForce),b.GetWorldCenter());
				}else if(shapes[b.GetUserData()].dead==false){
					//Once out of screen, set it as dead. (dead is determined by server and not client)
					if(that.bol_Server){
						shapes[b.GetUserData()].dead=true;
					}
					
					//Once dead, make it stop moving
					b.SetAngularVelocity(0);
					b.SetLinearVelocity(new b2Vec2(0,0));
				}
			}
          }
        }
	}
	
	//Update UI according to models set by box2d
	var updateShapeUIFromBox2D = function(){
		for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
          }
        }
	}
	
	//Checks for key press and do actions based on key press
	var checkKeysAndOrientation = function(){
		//Framerate is 1000/60, we do not want to send the data over so frequently
		var keysTimer = 100;  //100 feels the most responsive
		if(that.AVG_RTT!=null){
			keysTimer-=that.AVG_RTT;
			if(keysTimer<GameConstants.FRAME_RATE){
				keysTimer=GameConstants.FRAME_RATE;
			}
		}
		timeoutCheckKeysAndOrientation = setTimeout(checkKeysAndOrientation,keysTimer);
	
		//For browsers to quit game
		if(Key.isDown(Key.ESC)){
			console.log("leave game");
			sendToServer({type:"leaveGameSession"});
			return;
		}

		if(bol_Stop == false){
			var xPush=0;
			var yPush=0;
			//The numbers here do not determine the force
			if(Key.isDown(Key.LEFT)){
				xPush = -1;
			}else if(Key.isDown(Key.RIGHT)){
				xPush = 1;
			}
			
			if(Key.isDown(Key.UP)){
				yPush = -1;
			}else if(Key.isDown(Key.DOWN)){
				yPush = +1;
			}
			
			if(window.DeviceOrientationEvent && orientation!= undefined && navigator.appVersion.indexOf("Mobile")>-1){
				//Tweak sensitivity here
				var sensitivity = 10;
				var normalFrontBackAdjustment = 30;
				
				var frontBack = orientation.tiltFB;
				var LeftRight = orientation.tiltLR;
				var mql = window.matchMedia("(orientation: portrait)");
				if(mql!=null){
					if(mql.matches){
						frontBack = orientation.tiltFB;
						LeftRight = orientation.tiltLR;
					}else{
						//swap for landscape
						frontBack = -orientation.tiltLR;
						LeftRight = orientation.tiltFB;
					}
				
				}
				
				//Front Back tilt (front is positive)
				if(frontBack != null && Math.abs(frontBack-normalFrontBackAdjustment)>sensitivity){
					yPush += frontBack-normalFrontBackAdjustment;
				}
				
				//Left Right tilt (right is positive)
				if(LeftRight != null && Math.abs(LeftRight)>sensitivity){
					xPush += LeftRight; 
				}
			}
		  
			if(xPush!=0 || yPush!=0 ){
				if(that.AVG_RTT!=null){
					//short circuiting (times 1.5 for jitter)
					setTimeout(that.pushPlayerShape,that.AVG_RTT*2.0,currentPlayerShapeID,xPush,yPush);
				}else{
					that.pushPlayerShape(currentPlayerShapeID,xPush,yPush);
				}
				sendToServer({type:"updatePlayerState", moveX:xPush, moveY:yPush});
			}
		}
	}
	
	//Move player around
	this.pushPlayerShape = function(shapeID,xPush,yPush){
		var force=150;
		
		if(xPush!=0 && yPush!=0){
			//diagonal force should be much lesser
			force = force * 0.7;
		}
		
		//Anti cheat on server side
		if(xPush<0){
			xPush=-force;
		}else if(xPush>0){
			xPush=force;
		}
		
		if(yPush<0){
			yPush=-force;
		}else if(yPush>0){
			yPush=force;
		}
		
		var myDisk = bodies[shapeID];
		if(myDisk!= null && shapes[myDisk.GetUserData()].isFalling==false){
			myDisk.ApplyForce(new b2Vec2(xPush,yPush),myDisk.GetWorldCenter());
		}
	}
	
	//Set position and velocity of player
	var setPlayerShapeParameters = function(shapeID,x,y,vx,vy){
		var targetPlayerShape = bodies[shapeID];
		if(targetPlayerShape!= null && targetPlayerShape!='undefined'){
			targetPlayerShape.SetPosition(new b2Vec2(x,y));
			//set velocity first, which will change afterwards
			targetPlayerShape.SetLinearVelocity(new b2Vec2(vx,vy));
		
			//x and y must increase by vx and vy according to RTT
			shapes[shapeID].serverX = x + vx*((that.AVG_RTT/2.5)/GameConstants.FRAME_RATE)/30;
			shapes[shapeID].serverY = y + vy*((that.AVG_RTT/2.5)/GameConstants.FRAME_RATE)/30;
			//Convergence
			if(shapes[shapeID].isFalling==false && getDistance(shapes[shapeID].serverX,shapes[shapeID].serverY,targetPlayerShape.GetPosition().x,targetPlayerShape.GetPosition().y)>GameConstants.CONVERGENCE_SENSITIVITY){
				targetPlayerShape.SetPosition(new b2Vec2(shapes[shapeID].serverX,shapes[shapeID].serverY));
				console.log("serverX: "+shapes[shapeID].serverX+" serverY: "+shapes[shapeID].serverY);
			}else if(x==0 && y==0){
				targetPlayerShape.SetPosition(new b2Vec2(x,y));
			}else if(vx!=0 && vy!=0){
				//push it towards that direction instead of enforcing absolute position match
				var force = 150;
				var xForce = (x-targetPlayerShape.GetPosition().x)*force;
				var yForce = (y-targetPlayerShape.GetPosition().y)*force;
				//console.log("xForce: "+xForce+" yForce: "+yForce);
				targetPlayerShape.ApplyForce(new b2Vec2(xForce,yForce),targetPlayerShape.GetWorldCenter());
			}
		}
	}
	
	//Create platform
	var createGround = function(r){
		addCircle({
			radius: r,
            x: 0,
            y: 0,
            id: "id_Ground",
            isStatic: true,
            isSensor: true
        });
		that.shrinkGroundToRadius(r);
	}
	
	//Shrinks platform to a target radius
	this.shrinkGroundToRadius = function(radius){
		if(bol_Stop==false){
			shapes["id_Ground"].radius = radius;
			bodies["id_Ground"].radius = radius;
			//Fixture will determine where the player will drop (minus off PLAYER_RADIUS so that player drops when half of it's ellipse is outside the platform)
			bodies["id_Ground"].GetFixtureList().GetShape().SetRadius(radius-GameConstants.PLAYER_RADIUS);
			//Change color of ground everytime it shrinks
			//shapes["id_Ground"].color = getRandomColor();
		}
	}

	this.currentGroundRadius = function(){
		return shapes["id_Ground"].radius;
	}
	//for points mode
	//When sphere drops out of map, reset position to middle
	var resetPositionForPoints = function(){
		for (var b = world.GetBodyList(); b; b = b.m_next) {
			if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
				//if it is out of screen for a long time
				if(shapes[b.GetUserData()].dead==true){
					shapes[b.GetUserData()].isFalling = false;
					shapes[b.GetUserData()].fallDirection = 0;
					shapes[b.GetUserData()].dead = false;
					shapes[b.GetUserData()].lastPlayerTouched = null;
					//remove touching others
					for(var i in shapes){
						if(shapes[i].lastPlayerTouched == b.GetUserData()){
							shapes[i].lastPlayerTouched = null;
						}
					}
					//Stop movements
					b.SetAngularVelocity(0);
					b.SetLinearVelocity(new b2Vec2(0,0));
					b.SetPosition(new b2Vec2(shapes['id_Ground'].x,shapes['id_Ground'].y));
					//Set back groupIndex to default 0 so that they will hit each other
					b.GetFixtureList().SetFilterData(new b2FilterData);
					//Update UI
					shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
				}
			}
        }
	}
	
	var reducePointsTimer = function(){
		if(pointsTimer>0){
			pointsTimer--;
			setTimeout(reducePointsTimer,1000);
		}else{
			bol_Stop = true;
			
			if(!that.bol_Server){
				var highestScore=0;
				var highestNames="";
				//find the names for highscore
				for(var i in shapes){
					if(shapes[i].score==highestScore){
						if(highestNames.length>0){
							highestNames+=", ";
						}
						highestNames+=shapes[i].displayName;
					}else if(shapes[i].score>highestScore){
						highestScore=shapes[i].score;
						highestNames=shapes[i].displayName;
					}
				}
				middleText = highestNames+" has won the game!";
			}
		}
	}
	
	//for classic mode
	//to reset after everybody has died
	var resetPositionForClassic = function(){
		//reset ground radius
		that.shrinkGroundToRadius(GameConstants.PLATFORM_RADIUS);
		
		var angle = 360/GameConstants.NUM_OF_PLAYERS;
		var radian = Math.PI/180;
		var count = 0;
		for(var i in shapes){
			if(shapes[i].id!='id_Ground'){
				var x = shapes["id_Ground"].x + (GameConstants.PLATFORM_RADIUS-GameConstants.PLAYER_RADIUS)*Math.cos(angle*(count)*radian);
				var y = shapes["id_Ground"].y + (GameConstants.PLATFORM_RADIUS-GameConstants.PLAYER_RADIUS)*Math.sin(angle*(count)*radian);
				shapes[i].isFalling = false;
				shapes[i].fallDirection = 0;
				shapes[i].dead = false;
				
				var b = bodies[i];
				//Stop movements
				b.SetAngularVelocity(0);
				b.SetLinearVelocity(new b2Vec2(0,0));
				b.SetPosition(new b2Vec2(x,y));
				//Set back groupIndex to default 0 so that they will hit each other
				b.GetFixtureList().SetFilterData(new b2FilterData);
				//Update UI
				shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
				count++;
				
				//For Box2D Bug fixing where it doesn't detect the shapes are in contact with the ground when setting a new position
				b.SetActive(false);
				b.SetActive(true);
			}
		
		}
		world.ClearForces();
	}

	var checkToResetForClassic = function(){
		//console.log("checktoresetforclassic");
		if(bol_Stop==true)
			return;
		var foundAliveID = null;
		//check for remaining survivor
		for(var i in shapes){
			if(i=='id_Ground'){
				continue;
			}
			if(foundAliveID!=null && shapes[i].dead==false){
				//stop checking if more than 1 not dead
				return;
			}else if(shapes[i].dead==false){
				foundAliveID = i;
			}
		}
		
		if(!bol_Stop){
			if(round<numOfRounds){
				if(foundAliveID==null || shapes[foundAliveID].isFalling==true){
					//everybody loses if no one is alive or the last one alive is falling as well
					console.log("everybody lost");
					middleText = "Everybody Lost :(";
				}else{
					//one player wins the round
					console.log(shapes[foundAliveID].displayName+" won the round!");
					middleText = "WINNER";
					
					if(that.bol_Server){
						//only server calculates score
						shapes[foundAliveID].score++;
					}
				}
			}else{
				//add the score for final round
				if(foundAliveID!=null && shapes[foundAliveID].isFalling==false){
					if(that.bol_Server){
						//only server calculates score
						shapes[foundAliveID].score++;
					}
				}
				
				//find highest score
				console.log("Game ended");
				var highestScore=0;
				var highestNames="";
				//find the names for highscore
				for(var i in shapes){
					if(shapes[i].score==highestScore){
						if(highestNames.length>0){
							highestNames+=", ";
						}
						highestNames+=shapes[i].displayName;
					}else if(shapes[i].score>highestScore){
						highestScore=shapes[i].score;
						highestNames=shapes[i].displayName;
					}
				}
				middleText = highestNames+" has won the game!";
			}
		}

		//Stop moving or rendering
		bol_Stop = true;

		if(round < numOfRounds){
			//Auto start after awhile
			setTimeout(function(){
				//console.log("timeout");
				//must set bol_Stop to false first else the ground cannot reset the radius
				bol_Stop = false;
				resetPositionForClassic();
				round++; //it will run when round<numOfRounds, means last number will reach is numOfRounds
				middleText = "";
				//console.log("timeout end");
			},2000);
		}
	}

	var PrintShapes = function(){
		for(var i in shapes){
			console.log(shapes[i].displayName+" Falling "+shapes[i].isFalling + " Dead "+shapes[i].dead );
			}
	}
	
	//Get random color (used for platform)
	var getRandomColor = function(){
        var letters = '0123456789ABCDEF'.split('');
        color = '#';
        for (var i = 0; i < 6; i++ ) {
          color += letters[Math.round(Math.random() * 15)];
        }
        return color;
	}
	
	var darkerShade = function(hex, lum) {
       // validate hex string
       hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
          hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
          c = parseInt(hex.substr(i*2,2), 16);
          c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
          rgb += ("00"+c).substr(c.length);
        }

        return rgb;
	}
	
	//Conversion helper of shape to box2d elements
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
		//Don't let it rotate for better performance
		body.SetFixedRotation(true);
        bodies[shape.id] = body;
      },
      create: {
        world: function() {
          world = new b2World(
            new b2Vec2(0, 0)    //gravity
            , false                 //allow sleep
          );
          
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
			
			if(gameMode==0){
				//classic mode
				fixDef.density = 0.6;
				fixDef.restitution = 0.5; //1.5
			}else if(gameMode==1){
				//points mode
				fixDef.density = 0.6; //0.3
				//fixDef.friction = 0.5;
				fixDef.restitution = 1.2; //1.5
			}
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
	
	//Shape declaration-----------------------------------------------------------------------
	var Shape = function(v) {
      this.id = v.id || Math.round(Math.random() * 1000000);
      this.x = v.x || 0;
      this.y = v.y || 0;
      this.angle = 0;
	  this.color = v.color || getRandomColor();
      this.center = { x: null, y: null };
      this.isStatic = v.isStatic || false;
      //this.categoryBits = v.categoryBits || null;
      //this.maskBits = v.maskBits || null;
      this.isSensor = v.isSensor || false;
	  this.isFalling = false;
	  this.dead = false;
	  this.score = 0; //for both classic and points mode
	  this.fallDirection = 0;
	  this.sprite = v.sprite || Math.floor((Math.random()*4)+1); //return random number between 1 and 4
	  this.displayName = "";
	  this.lastPlayerTouched = null; //id for contact in points mode
	  
	  //For sync
	  this.serverX = null;
	  this.serverY = null;
	  
	  //function to update coordinates from box2d bodies
      this.update = function(options) {
        this.angle = options.angle;
        this.center = options.center;
        this.x = options.x;
        this.y = options.y;
      };
    }
        
    var Circle = function(options) {
      Shape.call(this, options);
      this.radius = options.radius || 1;
            
      this.draw = function() {
		var newX = this.x * SCALE;
		var newY = this.y * SCALE;
        ctx.save();
        ctx.translate(newX, newY);
        ctx.rotate(this.angle);
        ctx.translate(-newX, -newY);

        //ctx.fillStyle = this.color;
		ctx.fillStyle = this.color;
		//temporary remove gradient as it slows down firefox
        /*var grd=ctx.createRadialGradient(this.x * SCALE*0.9,this.y * SCALE*0.9,this.radius*SCALE*0.1,this.x * SCALE,this.y * SCALE,this.radius*SCALE);
        grd.addColorStop(0,this.color);
        grd.addColorStop(1,darkerShade(this.color, 0.1));
        ctx.fillStyle=grd;*/
        ctx.beginPath();
        ctx.arc(newX, newY, this.radius * SCALE, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
		ctx.restore();
      };
    }
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
    }
    Box.prototype = Shape;
	//End of Shape declaration----------------------------------------------------------------
	
	//Shape creation---------------------------------------------------------------------------
	var addCircle = function(options){
        options.radius = options.radius || 1.5;
        var shape = new Circle(options);
        shapes[shape.id] = shape;
        box2d.addToWorld(shape);
	}
	
	var addBox = function(options){
		options.width = options.width || 0.5 + Math.random()*2;
        options.height = options.height || 0.5 + Math.random()*2;
        var shape = new Box(options);
        shapes[shape.id] = shape;
        box2d.addToWorld(shape);
	}
	//End of Shape creation------------------------------------------------------------------

	//Use to clean up after game games
	this.stopAndDestroyWorld = function(){
		bol_Stop = true;
		if(intervalUpdateTimer!=null){
			clearInterval(intervalUpdateTimer);
			intervalUpdateTimer = null;
		}
		if(timeoutCheckKeysAndOrientation!=null){
			clearTimeout(timeoutCheckKeysAndOrientation);
			timeoutCheckKeysAndOrientation=null;
		}
		if(!that.bol_Server){
			$(window).unbind('resize');
		}
		if(world.IsLocked()){
			setTimeout(stopAndDestroyWorld, GameConstants.FRAME_RATE);
		}else{
			if(!that.bol_Server){
				console.log("destroy game world");
			}
			world.ClearForces();
			for(var i in bodies){
				destroy_list.push(i);
			}
			checkToDestroy();
			shapes = [];
			bodies = [];
		}
	}
	
	//Set the current player's shapeID
	this.setPlayerShapeID = function(id){
		if(id!=null){
			currentPlayerShapeID = id;
		}else{
			console.log("setPlayerShapeID: id was null");
		}
	}
	
	//Set the displayName of a shape with shapeID
	this.setShapeName = function(shapeID, name){
		shapes[shapeID].displayName = name;
	}
	
	//Used for server to generate scores to send to players
	this.getPlayerScores = function(){
		var playerScoresArray = [];
		for(var i in bodies){
			if(bodies[i].GetUserData()!=null && bodies[i].GetUserData()!='undefined' && bodies[i].GetUserData()!='id_Ground'){
				playerScoresArray.push({shapeID: bodies[i].GetUserData(),
										score: shapes[i].score});
			}
		}
		return playerScoresArray;
	}

	//update player scores from server
	this.updatePlayerScores = function(playerScores){
		//console.log("shapes size"+shapes.length);
		for(var i=0; i<playerScores.length; i++){
			shapes[playerScores[i].shapeID].score = playerScores[i].score;
		}
	}
	
	//Used for server to generate states (x,y,vx,vy) to send to players
	this.getPlayerStates = function(){
		var playerStatesArray = [];
		for(var i in bodies){
			if(bodies[i].GetUserData()!=null && bodies[i].GetUserData()!='undefined' && bodies[i].GetUserData()!='id_Ground'){
				playerStatesArray.push({shapeID: bodies[i].GetUserData(), 
											x: bodies[i].GetPosition().x, 
											y: bodies[i].GetPosition().y, 
											vx: bodies[i].GetLinearVelocity().x, 
											vy: bodies[i].GetLinearVelocity().y, 
											isFalling: shapes[i].isFalling,
											dead: shapes[i].dead
											});
			}
		}
		return playerStatesArray;
	}
	
	//update player states from server
	this.updatePlayerStates = function(playerStates){
		//Update for client side only
		if(that.bol_Server){
			return;
		}
		for(var i=0; i<playerStates.length; i++){
			shapes[playerStates[i].shapeID].dead = playerStates[i].dead;
			if(shapes[playerStates[i].shapeID].isFalling != playerStates[i].isFalling){
				if(playerStates[i].isFalling==true){
					//Set fallDirection for drawing properly behind or infront the ground
					if(shapes[playerStates[i].shapeID].y>shapes["id_Ground"].y){
						shapes[playerStates[i].shapeID].fallDirection = 1;
					}else{
						shapes[playerStates[i].shapeID].fallDirection = -1;
					}
					shapes[playerStates[i].shapeID].isFalling = true;
				}else{
					shapes[playerStates[i].shapeID].fallDirection = 0;
					shapes[playerStates[i].shapeID].isFalling = false;
				}
			}
			setPlayerShapeParameters(playerStates[i].shapeID,playerStates[i].x,playerStates[i].y,playerStates[i].vx,playerStates[i].vy);
		}
	}
	
	//Player left the game, remove from current game, server will tell client to do so
	this.removePlayerWithShapeID = function(shapeID){
		for(var i in shapes){
			if(shapes[i].id == shapeID){
				destroy_list.push(i);
			}
		}
	}
	
	//Used for Convergence
	var getDistance = function(x1,y1,x2,y2){
		var dx = x1-x2;
		var dy = y1-y2;
		return Math.sqrt(dx*dx + dy*dy);
	}
	
	//For Client only
	var sendToServer = function(msg){
		if(!that.bol_Server && global.engineSocket!=null){
			global.engineSocket.send(JSON.stringify(msg));
			
			if(that.pingTime == null){
				that.pingTime = Date.now();
				//piggybag ping pong on sending anything to server during in game to determine RTT
				global.engineSocket.send(JSON.stringify({type:"ping"}));
			}
		}
	}
	
	//Draw bitmap following a shape
	var drawSpriteOnShape = function(shape){
		//Do not draw if shape is dead
		if(shape.dead==true){
			return;
		}
	
		var img;
		//Do not use canvas context to reverse the image, it requires CPU power that will lag the mobile
		//Change image according to direction it is moving
		if(bodies[shape.id].GetLinearVelocity().x>0){
			switch(shape.sprite){
				case 4:
					img = img_Eskimo_R;
					break;
				case 3:
					img = img_Bear_R;
					break;
				case 2:
					img = img_Penguin_R;
					break;
				case 1:
				default:
					img = img_Seal_R;
					break;
			}
		}else{
			switch(shape.sprite){
				case 4:
					img = img_Eskimo_L;
					break;
				case 3:
					img = img_Bear_L;
					break;
				case 2:
					img = img_Penguin_L;
					break;
				case 1:
				default:
					img = img_Seal_L;
					break;
			}
		}
		
		var spriteWidth  = 100,
			spriteHeight = 100,
			//multiply by default scale so that afterwards the scaling will convert it back to normal values
			canvasPosX   = (shape.x*DEFAULT_SCALE-(spriteWidth/2));
			canvasPosY   = (shape.y*DEFAULT_SCALE-spriteHeight*1.5);
			
		ctx.save();
		try{
			var newScale = SCALE/DEFAULT_SCALE;
			ctx.translate(WORLD_WIDTH/2, (WORLD_HEIGHT+100*newScale)*0.5 );
			//Scale the image according to UI Scaling
			ctx.scale(newScale,newScale);
			ctx.drawImage(img,
				canvasPosX,
				(canvasPosY*0.5)
			);
		}catch (e) {
			console.log("Error in drawSprite: "+e);
		}
		ctx.restore();
	}

	//Draw display name below the shape
	var drawDisplayNameOnShape = function(shape){
		if(shape.displayName.length>0 && shape.dead==false){
			ctx.save();
			ctx.font= SCALE+"px Segoe UI";
			ctx.fillStyle = "#808080";
			ctx.fillText(shape.displayName,(shape.x-shape.displayName.length/4)*SCALE,(shape.y+shape.radius*1.5)*SCALE);
			ctx.restore();
		}
	}

	var drawGround = function(){
		ctx.save();
		try{
			ctx.fillStyle=ctx.createPattern(pattern_Platform,"repeat");
			ctx.beginPath();
			ctx.arc(shapes['id_Ground'].x * SCALE, shapes['id_Ground'].y * SCALE, shapes['id_Ground'].radius * SCALE, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		}catch (e) {
			console.log("Error in drawGround: "+e);
		}
		ctx.restore();
	}

	var drawLeaveText = function(){
		var currentScale = (SCALE/DEFAULT_SCALE)/2;
		var textScale = SCALE;
		var x = WORLD_WIDTH/currentScale-(textScale*8);
		var y = WORLD_HEIGHT/currentScale-textScale*1.5;
		
		ctx.save();
		ctx.scale(currentScale,currentScale);
		ctx.font= textScale+'px Lato';
		ctx.fillStyle='#FFFFFF';
		if(navigator.appVersion.indexOf("Mobile")>-1){
			ctx.fillText("Long press to leave",x,y+textScale);
		}else{
			ctx.fillText("Press Esc to leave",x,y+textScale);
		}
		ctx.restore();  
	}
	
	var drawMiddleText = function(){
		if(middleText.length>0){
			ctx.save();
			ctx.font= SCALE+"px Segoe UI";
			ctx.fillStyle = "#B959FF";
			ctx.fillText(middleText,WORLD_WIDTH/2-(middleText.length/4)*SCALE,WORLD_HEIGHT/2+SCALE);
			ctx.restore();
		}
	}
	
	var drawInterfaceForScore = function(){
		ctx.save();
		var currentScale = (SCALE/DEFAULT_SCALE)/2;
		var textScale = DEFAULT_SCALE*1.5;
		
		var width = 410;
		//start x
		var x = (WORLD_WIDTH/currentScale-(GameConstants.NUM_OF_PLAYERS*width))/2;
		var y = 10;
		var height = 100;
		var textX = 100;
		var textY = 40;
		ctx.scale(currentScale,currentScale);
		
		//Print number of rounds
		if(gameMode==0){
			ctx.font= textScale+'px Lato';
			ctx.fillStyle = "#FFFFFF";
			ctx.fillText("Round: "+round,x,y+height+textY);
		}else if(gameMode==1){
			ctx.font= textScale+'px Lato';
			ctx.fillStyle = "#FFFFFF";
			ctx.fillText("Time Left: "+pointsTimer,x,y+height+textY);
		}
		
		for(var i in shapes){
			if(shapes[i].id!='id_Ground'){
				//Paint background
				ctx.fillStyle=shapes[i].color;
				ctx.fillRect(
					x,
					y,
					width,
					height
				);
			
				//Paint image
				var img;
				switch(shapes[i].sprite){
					case 4:
						img = img_Eskimo_R;
						break;
					case 3:
						img = img_Bear_R;
						break;
					case 2:
						img = img_Penguin_R;
						break;
					case 1:
					default:
						img = img_Seal_R;
						break;
				}
				ctx.save();
				ctx.drawImage(img,x,y);
				ctx.restore();
				
				//Paint text
				ctx.font= textScale+'px Lato';
				ctx.fillStyle = "#FFFFFF";
				if(shapes[i].displayName.length>0){
					ctx.fillText(shapes[i].displayName,x+textX,y+textY);
				}
				var textToDraw="";
				//classic mode
				if(gameMode==0){
					textToDraw = "Rounds Won: "+shapes[i].score;
				}else if(gameMode==1){
					//points mode
					textToDraw = "Score: "+shapes[i].score;
				}
				ctx.fillText(textToDraw,x+textX,y+textY+textScale);
				
				//incremental paint
				x+=width;
			}
		}
		
		ctx.restore();
	}
}

//For node js, not used on client side
exports.Engine = Engine;
