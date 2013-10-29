var Engine = function() {
	var b2Vec2;
	var b2AABB;
	var b2BodyDef;
	var b2Body;
	var b2FixtureDef;
	var b2Fixture;
	var b2World;
	var b2MassData;
	var b2PolygonShape;
	var b2CircleShape;
	var b2DebugDraw;
	var b2MouseJointDef;
	var b2Listener;
	var b2FilterData;
	var world;
	
	var SCALE = 30,
        destroy_list = [],
        canvas,
        ctx, //context of canvas
        world, //game world of box2d
        fixDef,
        orientation, //used for mobile devices
        shapes = {}, //used for UI
        playerShapes = {}, //body of box2d
		score = {p1:10, p2:10, p3:10, p4:10};
	
	var debug = false;
	var that = this;
	var PLATFORM_RADIUS = 10;
	
	this.init = function(){
		b2Vec2 = Box2D.Common.Math.b2Vec2;
		b2AABB = Box2D.Collision.b2AABB;
		b2BodyDef = Box2D.Dynamics.b2BodyDef;
		b2Body = Box2D.Dynamics.b2Body;
		b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
		b2Fixture = Box2D.Dynamics.b2Fixture;
		b2World = Box2D.Dynamics.b2World;
		b2MassData = Box2D.Collision.Shapes.b2MassData;
		b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
		b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
		b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
		b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;
		b2Listener = Box2D.Dynamics.b2ContactListener;
		b2FilterData = Box2D.Dynamics.b2FilterData;
	}
	
	var setupCallbacks = function(){
		//Add circles for testing
		/*canvas.addEventListener('click', function(e) {
          var shapeOptions = {
            x: Math.random() * 10 + 10,
            y: Math.random() * 10 + 10,
          };
          addCircle(shapeOptions);
        }, false);*/

        var listener = new b2Listener;

		//listener waits for contact between ground ("1") and object to end
        listener.EndContact = function(contact) {
			var tempBody;
			if (contact.GetFixtureA().GetBody().GetUserData() == 1) {
				tempBody = contact.GetFixtureB().GetBody();
			}
			else if (contact.GetFixtureB().GetBody().GetUserData() == 1) {
				tempBody = contact.GetFixtureA().GetBody();
			}
			
			//destroy_list.push(tempBody);
			if (tempBody!=null && tempBody.IsActive() && typeof tempBody.GetUserData() !== 'undefined' && tempBody.GetUserData() != null){
				shapes[tempBody.GetUserData()].isFalling = true;

				//Set groupIndex to -1 so that it will not hit anyone when falling
				var filter = new b2FilterData;
				filter.groupIndex = -1;
				filter.categoryBits = 0x0002;
				filter.maskBits = 0x0000
				tempBody.GetFixtureList().SetFilterData(filter);
			}
        }
        world.SetContactListener(listener);

		
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
	
	this.start = function(id){
		setCanvas(id);

        box2d.create.world();
        box2d.create.defaultFixture();

		//Create Ground
		createGround(PLATFORM_RADIUS);
		
		//Create Player
		addCircle({
			color: "#e00707",
            x:9,
            y:9,
            id: "myDisk",
        });
		
		//Create other Players
		addCircle({
           color: "#fdb813",
            x:18,
            y:9,
            id: "p2Disk",
        });
		addCircle({
           color: "#69ab35",
            x:9,
            y:18,
            id: "p3Disk",
		});
		

        setupCallbacks();
		
		that.animate();
		window.setInterval(updateGround, 3000);
	}
	
	var setCanvas = function(id){
		canvas = document.getElementById(id);
        ctx = canvas.getContext("2d");
	}
	
	this.animate = function(){
		requestAnimFrame( that.animate );
		update();
	}
	
	
	var draw = function(){
		// change to isometric view          
		ctx.save();
		//ctx.rotate(45 * Math.PI /180);
		ctx.scale(1, 0.5);
		ctx.translate(0, GameConstants.CANVAS_HEIGHT/2);
		
		if (!debug){
			ctx.clearRect(0, 0, GameConstants.CANVAS_WIDTH, GameConstants.CANVAS_HEIGHT);
		}
		
		/*var drawOrder = [];
        for (var i in shapes) {
			if(drawOrder.length==0){
				drawOrder.push(shapes[i]);
			}else{
				var bol_added = false;
				for(var k in drawOrder){
					var kZ = drawOrder[k].x+drawOrder[k].y;
					var iZ = shapes[i].x+shapes[i].y;
					if(iZ<kZ){
						drawOrder.splice(k,0,shapes[i]);
						bol_added = true;
						break;
					}
				}
				if(bol_added == false){
					drawOrder.push(shapes[i]);
				}
			}
        }
		
		for (var i in drawOrder){
			drawOrder[i].draw();
		}*/
		
		for(var i in shapes){
			shapes[i].draw();
		}
		
		// ctx.font="40px Segoe UI";
        // ctx.fillStyle = "#FFFFFF";
        // ctx.fillText("p1: " + score.p1,100,750);
        // ctx.fillText("p2: " + score.p2,300,750);
        // ctx.fillText("p3: " + score.p3,500,750);
		ctx.restore();
		
		//
		var myDisk = playerShapes["myDisk"];
		if(myDisk!= null){
			drawSpriteOnBody(myDisk);
		}
	}
	
	var update = function(){
		world.Step(1 / 60, 10, 10);
		world.ClearForces();

		draw();
		if (debug){
			world.DrawDebugData();
		}
		
		for (var i in destroy_list) {
			world.DestroyBody(destroy_list[i]);
			delete shapes[destroy_list[i].GetUserData()];
			delete playerShapes[destroy_list[i].GetUserData()];
			// var id = destroy_list[i].GetUserData();
			// if (id == "myDisk"){init.gameobjects.player1(); score.p1--;}
			// else if (id == "p2Disk"){init.gameobjects.player2(); score.p2--;}
			// else if (id == "p3Disk"){init.gameobjects.player3(); score.p3--;}
		}
        // Reset the array
        destroy_list.length = 0;
        for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
          }
        }
		updateCustomGravity();
		checkKeysAndOrientation();
		resetPositionAfterFall();
	}
	
	var updateCustomGravity = function(){
		var customGravityForce = 150;
	
		for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
            if(shapes[b.GetUserData()].isFalling==true){
				b.ApplyForce(new b2Vec2(0,customGravityForce),b.GetWorldCenter());
			}
          }
        }
	}
	
	var checkKeysAndOrientation = function(){
		var xPush=0;
		var yPush=0;
		var force = 30;
		
		if(Key.isDown(Key.LEFT)){
			xPush -= force;
		}
		
		if(Key.isDown(Key.RIGHT)){
			xPush += force;
		}
		
		if(Key.isDown(Key.UP)){
			yPush -= force;
		}
		
		if(Key.isDown(Key.DOWN)){
			yPush += force;
		}
		
		if(window.DeviceOrientationEvent && orientation != undefined){
			if(orientation.tiltFB != null){
				xPush += orientation.tiltFB * 1.5; 
				yPush += orientation.tiltFB * 1.5;
			}
			
			if(orientation.tiltLR != null){
				xPush += orientation.tiltLR * 1.5; 
				yPush -= orientation.tiltLR * 1.5;
			}
		}
      
		
		if(xPush!=0 || yPush!=0 ){
			//console.log("should move: "+xPush+" "+yPush);
			var myDisk = playerShapes["myDisk"];
			if(myDisk!= null && shapes[myDisk.GetUserData()].isFalling==false){
				myDisk.ApplyForce(new b2Vec2(xPush,yPush),myDisk.GetWorldCenter());
			}
		}
	}
	
	var createGround = function(r){
		addCircle({
			radius: r,
            x: GameConstants.CANVAS_WIDTH / SCALE / 2,
            y: GameConstants.CANVAS_HEIGHT / SCALE / 2,
            id: 1,
            isStatic: true,
            isSensor: true
        });
	}
	
	var updateGround = function(){
		//This reduces the platform radius
        if (shapes["1"].radius > 1.5) {
          var r = shapes["1"].radius;
          world.DestroyBody("1");
          delete shapes["1"];
          delete playerShapes["1"];
		  
          createGround(r - 2.2);
          shapes["1"].radius = r - 0.5;
          playerShapes["1"].radius = r - 0.5;
        }
	}
	
	var resetPositionAfterFall = function(){
		for (var b = world.GetBodyList(); b; b = b.m_next) {
          if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
			//if it is out of screen for a long time
			if(shapes[b.GetUserData()].isFalling==true && b.GetPosition().y > (GameConstants.CANVAS_HEIGHT + 50)/SCALE){
				shapes[b.GetUserData()].isFalling = false;
				//Stop movements
				b.SetAngularVelocity(0);
				b.SetLinearVelocity(new b2Vec2(0,0));
				b.SetPosition(new b2Vec2(canvas.width / SCALE / 2,canvas.height / SCALE / 2));
				//Set back groupIndex to default 0 so that they will hit each other
				b.GetFixtureList().SetFilterData(new b2FilterData);
				//Update UI
				shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
			}
          }
        }
	
	}
	
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
      this.x = v.x || Math.random()*23 + 1;
      this.y = v.y || 0;
      this.angle = 0;
	  this.color = v.color || getRandomColor();
      this.center = { x: null, y: null };
      this.isStatic = v.isStatic || false;
      //this.categoryBits = v.categoryBits || null;
      //this.maskBits = v.maskBits || null;
      this.isSensor = v.isSensor || false;
	  this.isFalling = false;
	  
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
		// ctx.fillStyle = this.color;
        var grd=ctx.createRadialGradient(this.x * SCALE*0.9,this.y * SCALE*0.9,this.radius*SCALE*0.1,this.x * SCALE,this.y * SCALE,this.radius*SCALE);
        grd.addColorStop(0,this.color);
        grd.addColorStop(1,darkerShade(this.color, 0.1));
        ctx.fillStyle=grd;
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

	var drawSpriteOnBody = function(body){
		var img = new Image();
		img.src = '/images/lambo_the_brocolli_monster.png';
		var spriteWidth  = 245,
			spriteHeight = 361,
			pixelsLeft   = 0,
			pixelsTop    = 0,

			canvasPosX   = (body.GetPosition().x*SCALE-spriteWidth/2);
			canvasPosY   = (body.GetPosition().y*SCALE-spriteHeight)*0.5;
		
		//For more complex sprite
		/*ctx.drawImage(img,
			pixelsLeft,
			pixelsTop,
			spriteWidth,
			spriteHeight,
			canvasPosX,
			canvasPosY,
			spriteWidth,
			spriteHeight
		);*/
		
		ctx.drawImage(img,
			canvasPosX,
			canvasPosY
		);
		

	}
}


window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
})();