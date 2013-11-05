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
		lives = {p1:10, p2:10, p3:10, p4:10}, //for lives mode
		score = {p1:0, p2:0, p3:0, p4:0},//for points mode
		WORLD_HEIGHT = GameConstants.CANVAS_HEIGHT,
		WORLD_WIDTH = GameConstants.CANVAS_WIDTH,
		gameMode,
		rounds = 5;//for classic mode
	
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
			}
			else if (contact.GetFixtureB().GetBody().GetUserData() == 'id_Ground') {
				tempBody = contact.GetFixtureA().GetBody();
			}
			
			if (tempBody!=null && tempBody.IsActive() && typeof tempBody.GetUserData() !== 'undefined' && tempBody.GetUserData() != null){
				shapes[tempBody.GetUserData()].isFalling = true;
				//console.log(shapes[tempBody.GetUserData()]);
				if(gameMode == 1)
				{
					//console.log("display name: "+shapes[tempBody.GetUserData()].displayName);
					if(shapes[tempBody.GetUserData()].id=="playerDisk1")
					 lives.p1--;
					if(shapes[tempBody.GetUserData()].id=="playerDisk2")
					 lives.p2--;
					if(shapes[tempBody.GetUserData()].id=="playerDisk3")
					 lives.p3--;
					if(shapes[tempBody.GetUserData()].id=="playerDisk4")
					 lives.p4--;
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

				//flag all current contacts for filtering again since we changed the filter
				var contactList = tempBody.GetContactList();
				for(var ce = contactList; ce; ce = ce.next){
					var contact = ce.contact;
					contact.FlagForFiltering();
				}
				
				tempBody.GetFixtureList().SetFilterData(filter);
			}
        }
        world.SetContactListener(listener);

		
        if (!that.bol_Server){
		
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
			
			//For mobile devices
			$(window).bind('orientationchange', function(){
				autoScaleWithScreenSize();
			});
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
		//Create circles according to number of player
		for(var i=1;i<=GameConstants.NUM_OF_PLAYERS;i++){
			addCircle({
				radius: GameConstants.PLAYER_RADIUS,
				color: getRandomColor(),
				x:shapes["id_Ground"].x + (GameConstants.PLATFORM_RADIUS-GameConstants.PLAYER_RADIUS)*Math.cos(angle*(i-1)*Math.PI/180),
				y:shapes["id_Ground"].y + (GameConstants.PLATFORM_RADIUS-GameConstants.PLAYER_RADIUS)*Math.sin(angle*(i-1)*Math.PI/180),
				id: GameConstants.SHAPE_NAME+i,
			});
		}		
		
		//FOR TESTING ONLY, SHOULD BE SET BY SERVER
		currentPlayerShapeID = 'playerDisk1';
		that.setShapeName(currentPlayerShapeID,"omg test bbq");

        setupCallbacks();
		
		//update will auto setTimeout recursively
		update();
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
			ctx.translate(WORLD_WIDTH/2, WORLD_HEIGHT);
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
		if(gameMode == 1)//points mode
		{
			console.log("Printing livess");
			//draw lives
			ctx.font="40px Lato";
	        ctx.fillStyle = "#FFFFFF";
	        // ctx.fillText("p1: " + lives.p1,10,50);
	        // ctx.fillText("p2: " + lives.p2,10,100);
	        // ctx.fillText("p3: " + lives.p3,10,150);
	        // ctx.fillText("p4: " + lives.p4,10,200);

			if(shapes["playerDisk1"]){
	        ctx.fillText(shapes["playerDisk1"].displayName+": " + lives.p1,10,50);
			}
			if(shapes["playerDisk2"]){
				ctx.fillText(shapes["playerDisk2"].displayName+": " + lives.p2,10,100);
			}
			if(shapes["playerDisk3"]){
				ctx.fillText(shapes["playerDisk3"].displayName+": " + lives.p3,10,150);
			}
			if(shapes["playerDisk4"]){
				ctx.fillText(shapes["playerDisk4"].displayName+": " + lives.p4,10,200);
			}
    	}
		
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
			setTimeout(update,GameConstants.FRAME_RATE);
			world.Step(1 / 60, 10, 10);
			world.ClearForces();
			checkToDestroy();
			updateShapeUIFromBox2D();
			updateCustomGravity();
			//for points mode only
			if(gameMode==1){//***************************************************************************************************************************
				resetPositionAfterFall(); // this causing problems
			}
			
			if(!that.bol_Server){
				checkKeysAndOrientation();
				draw();
			}
		}
	}
	
	//Checks to see which object is in destroy_list and must be removed from game
	var checkToDestroy = function(){
		for (var i in destroy_list) {
			world.DestroyBody(destroy_list[i]);
			delete shapes[destroy_list[i].GetUserData()];
			delete bodies[destroy_list[i].GetUserData()];
		}
        // Reset the array
        destroy_list.length = 0;
	}
	
	//Make objects fall if isFalling is true
	var updateCustomGravity = function(){
		var customGravityForce = 150;
	
		for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            if(shapes[b.GetUserData()].isFalling==true && b.GetPosition().y <= (WORLD_HEIGHT*2)/SCALE){
				b.ApplyForce(new b2Vec2(0,customGravityForce),b.GetWorldCenter());
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
	
	//Move player around
	this.pushPlayerShape = function(shapeID,xPush,yPush){
		var force=30;
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
				var force = 60;
				var xForce = (x-targetPlayerShape.GetPosition().x)*force;
				var yForce = (y-targetPlayerShape.GetPosition().y)*force;
				console.log("xForce: "+xForce+" yForce: "+yForce);
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
	
	//Shrink platform
	var shrinkGround = function(){
		//This reduces the platform radius
		var r = shapes["id_Ground"].radius;
        if (r > 1.5) {
		  r = r-0.1;
		  that.shrinkGroundToRadius(r);
        }
	}
	
	//Shrinks platform to a target radius
	this.shrinkGroundToRadius = function(radius){
		shapes["id_Ground"].radius = radius;
		bodies["id_Ground"].radius = radius;
		//Fixture will determine where the player will drop (minus off PLAYER_RADIUS so that player drops when half of it's ellipse is outside the platform)
		bodies["id_Ground"].GetFixtureList().GetShape().SetRadius(radius-GameConstants.PLAYER_RADIUS);
		//Change color of ground everytime it shrinks
		shapes["id_Ground"].color = getRandomColor();
	}

	//for points mode
	//When sphere drops out of map, reset position to middle
	var resetPositionAfterFall = function(){
		for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
			//if it is out of screen for a long time
			if(shapes[b.GetUserData()].isFalling==true && b.GetPosition().y > (WORLD_HEIGHT*2)/SCALE && getPointsForShape(shapes[b.GetUserData()])> 0){
				shapes[b.GetUserData()].isFalling = false;
				shapes[b.GetUserData()].fallDirection = 0;
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
	
	var getPointsForShape = function(shape){
		if(shape.id=="playerDisk1")
			return lives.p1;
		if(shape.id=="playerDisk2")
			return lives.p2;
		if(shape.id=="playerDisk3")
			return lives.p3;
		if(shape.id=="playerDisk4")
			return lives.p4;
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
          fixDef.density = 0.6; //0.3
          // fixDef.friction = 0.5;
          fixDef.restitution = 0.3; //1.5
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
	  this.fallDirection = 0;
	  this.sprite = Math.floor((Math.random()*4)+1); //return random number between 1 and 4
	  this.displayName = "";
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
        ctx.save();
        ctx.translate(this.x * SCALE, this.y * SCALE);
        ctx.rotate(this.angle);
        ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);

        //ctx.fillStyle = this.color;
		ctx.fillStyle = this.color;
		//temporary remove gradient as it slows down firefox
        /*var grd=ctx.createRadialGradient(this.x * SCALE*0.9,this.y * SCALE*0.9,this.radius*SCALE*0.1,this.x * SCALE,this.y * SCALE,this.radius*SCALE);
        grd.addColorStop(0,this.color);
        grd.addColorStop(1,darkerShade(this.color, 0.1));
        ctx.fillStyle=grd;*/
        ctx.beginPath();
        ctx.arc(this.x * SCALE, this.y * SCALE, this.radius * SCALE, 0, Math.PI * 2, true);
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
		if(world.IsLocked()){
			bol_Stop = true;
			if(!that.bol_Server){
				$(window).unbind('resize');
			}
			setTimeout(stopAndDestroyWorld, 1000 / 60);
		}else{
			world.ClearForces();
			var bodies = world.GetBodyList();
			for(var i in bodies){
				destroy_list.push(i);
			}
			checkToDestroy();
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
	
	//Used for server to generate states (x,y,vx,vy) to send to players
	this.getPlayerStates = function(){
		var playerStatesArray = [];
		for(var i in bodies){
			if(bodies[i].GetUserData()!=null && bodies[i].GetUserData()!='undefined' && bodies[i].GetUserData()!='id_Ground'){
				playerStatesArray.push({shapeID: bodies[i].GetUserData(), x: bodies[i].GetPosition().x, y: bodies[i].GetPosition().y, vx: bodies[i].GetLinearVelocity().x, vy: bodies[i].GetLinearVelocity().y, isFalling: shapes[i].isFalling});
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
			ctx.translate(WORLD_WIDTH/2, WORLD_HEIGHT*0.5);
			//Scale the image according to UI Scaling
			ctx.scale(SCALE/DEFAULT_SCALE,SCALE/DEFAULT_SCALE);
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
		if(shape.displayName.length>0){
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
}

//For node js, not used on client side
exports.Engine = Engine;
