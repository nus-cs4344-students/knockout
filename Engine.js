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
	var world;
	
	var SCALE = 30,
        destroy_list = [],
        canvas,
        ctx,
        world,
        fixDef,
        orientation,
        shapes = {},
        playerShapes = {},
		score = {p1:10, p2:10, p3:10};
	
	var debug = false;
	
	var that = this;

	
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
	}
	
	var setupCallbacks = function(){
		canvas.addEventListener('click', function(e) {
          var shapeOptions = {
            x: Math.random() * 10 + 10,
            y: Math.random() * 10 + 10,
          };
          addCircle(shapeOptions);
        }, false);

        var listener = new b2Listener;

        listener.EndContact = function(contact) {
			if (contact.GetFixtureA().GetBody().GetUserData() == 1) {
				destroy_list.push(contact.GetFixtureB().GetBody());
			}
			else if (contact.GetFixtureB().GetBody().GetUserData() == 1) {
				destroy_list.push(contact.GetFixtureA().GetBody());
			};
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
		createGround(10);
		
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
	
	var createWorld = function(){		
		world = new b2World(
			new b2Vec2(0, 0)    //gravity is zero since top-down
			,  true                 //allow sleep
		);
		
		var fixDef = new b2FixtureDef;
		fixDef.density = 0.1;
		fixDef.friction = 0.0;
		fixDef.restitution = 0.6;
		
		var bodyDef = new b2BodyDef;
		//create ground
		bodyDef.type = b2Body.b2_staticBody;
		fixDef.shape = new b2PolygonShape;
		//Origin is at middle
		fixDef.shape.SetAsBox(GameConstants.CANVAS_WIDTH/2, 10);
		bodyDef.position.Set(GameConstants.CANVAS_WIDTH/2, 10);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		bodyDef.position.Set(GameConstants.CANVAS_WIDTH/2, GameConstants.CANVAS_HEIGHT-10);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		
		fixDef.shape.SetAsBox(10, GameConstants.CANVAS_HEIGHT/2);
		bodyDef.position.Set(10, GameConstants.CANVAS_HEIGHT/2);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		bodyDef.position.Set(GameConstants.CANVAS_WIDTH-10, GameConstants.CANVAS_HEIGHT/2);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		
		//create some objects
		bodyDef.type = b2Body.b2_dynamicBody;
		bodyDef.fixedRotation = true;
		
		//vertices indicate a eclipsal shape
		var vertices = new Array();
		var size = 30;
		//left most vertex
		vertices.push(new b2Vec2(1.0*size,0.0*size));
		vertices.push(new b2Vec2(0.9*size,0.2*size));
		vertices.push(new b2Vec2(0.6*size,0.4*size));
		//down most vertex
		vertices.push(new b2Vec2(0.0*size,0.5*size));
		vertices.push(new b2Vec2(-0.6*size,0.4*size));
		vertices.push(new b2Vec2(-0.9*size,0.2*size));
		//right most vertex
		vertices.push(new b2Vec2(-1.0*size,0.0*size));
		vertices.push(new b2Vec2(-0.9*size,-0.2*size));
		vertices.push(new b2Vec2(-0.6*size,-0.4*size));
		//up most vertex
		vertices.push(new b2Vec2(0.0*size,-0.5*size));
		vertices.push(new b2Vec2(0.6*size,-0.4*size));
		vertices.push(new b2Vec2(0.9*size,-0.2*size));
		
		
		fixDef.shape = new b2PolygonShape();
		fixDef.shape.SetAsArray(vertices,12);
		
		bodyDef.position.x = GameConstants.CANVAS_WIDTH/2;
		bodyDef.position.y = GameConstants.CANVAS_HEIGHT/2;
		
		myDisk = world.CreateBody(bodyDef);
		myDisk.CreateFixture(fixDef);
		myDiskUI = new PIXI.Sprite(texturePlayer);
		myDiskUI.scale.x = 0.5;
		myDiskUI.scale.y = 0.5;
		stage.addChild(myDiskUI);
		
		bodyDef.position.x = GameConstants.CANVAS_WIDTH/2-100;
		bodyDef.position.y = GameConstants.CANVAS_HEIGHT/2-100;
		var oppo1 = world.CreateBody(bodyDef).CreateFixture(fixDef);
		var oppo2 = world.CreateBody(bodyDef).CreateFixture(fixDef);
		var oppo3 = world.CreateBody(bodyDef).CreateFixture(fixDef);
	}
	
	var draw = function(){
		if (!debug){
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
        for (var i in shapes) {
			shapes[i].draw();
        }
		
		// ctx.font="40px Segoe UI";
        // ctx.fillStyle = "#FFFFFF";
        // ctx.fillText("p1: " + score.p1,100,750);
        // ctx.fillText("p2: " + score.p2,300,750);
        // ctx.fillText("p3: " + score.p3,500,750);
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
		
		checkKeysAndOrientation();
	}
	
	var checkKeysAndOrientation = function(){
		var xPush=0;
		var yPush=0;
		var force = 30;
		
		if(Key.isDown(Key.LEFT)){
			xPush -= force;
			yPush += force;
		}
		
		if(Key.isDown(Key.RIGHT)){
			xPush += force;
			yPush -= force;
		}
		
		if(Key.isDown(Key.UP)){
			xPush -= force;
			yPush -= force;
		}
		
		if(Key.isDown(Key.DOWN)){
			xPush += force;
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
			if(myDisk!= null){
				myDisk.ApplyForce(new b2Vec2(xPush,yPush),myDisk.GetWorldCenter());
			}
		}
	}
	
	var createGround = function(r){
		addCircle({
			radius: r,
            x: canvas.width / SCALE / 2,
            y: canvas.width / SCALE / 2,
            id: 1,
            isStatic: true,
            isSensor: true
        });
	}
	
	var updateGround = function(){
		// console.log(shapes);
        if (shapes["1"].radius > 1.5) {
          var r = shapes["1"].radius;
          world.DestroyBody("1");
          delete shapes["1"];
          delete playerShapes["1"];
		  
          createGround(r - 2.2);
          shapes["1"].radius = r - 0.5;
          playerShapes["1"].radius = r - 0.5;
        }
        // console.log(shapes["1"]);
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
          
          // change to isometric view          
          //ctx.save();
          //ctx.translate(400, 100);
          //ctx.scale(0.8, 0.48);
          //ctx.rotate(45 * Math.PI /180);
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
      // this.categoryBits = v.categoryBits || null;
      // this.maskBits = v.maskBits || null;
      this.isSensor = v.isSensor || false;
      
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