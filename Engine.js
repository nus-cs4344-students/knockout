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
	var world;
	
	var that = this;
	var myDisk = null;
	var myDiskUI = null;
	
	//Rendering Pixi.js parts
	var renderer;
	var stage;
	var texturePlayer;
	
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
		renderer = new PIXI.CanvasRenderer(GameConstants.CANVAS_WIDTH, GameConstants.CANVAS_HEIGHT); 
		renderer.view.id = 'PixiCanvas';
		stage = new PIXI.Stage;
		$('#contentHTML').append(renderer.view);
		texturePlayer = PIXI.Texture.fromImage("images/lambo_the_brocolli_monster.png");
	}
	
	this.startEngine = function(){
		createWorld();
		setupDebugDraw();
		that.animate();
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
	
	var setupDebugDraw = function(){
		//setup debug draw
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
		debugDraw.SetDrawScale(1);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit | b2DebugDraw.e_centerOfMassBit);
		world.SetDebugDraw(debugDraw);
	}
	
	var draw = function(){
		renderer.render(stage);
	}
	
	var update = function(){
		world.Step(1 / 60, 10, 10);
		myDiskUI.position.x = myDisk.GetPosition().x;
		myDiskUI.position.y = myDisk.GetPosition().y;
		draw();
		world.DrawDebugData();
		world.ClearForces();
		checkKeys();
	}
	
	var checkKeys = function(){
		if(myDisk==null){
			return;
		}
		
		var xPush=0;
		var yPush=0;
		var force = 50000;
		
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
		
		if(xPush!=0 || yPush!=0 ){
			//console.log("should move: "+xPush+" "+yPush);
			myDisk.ApplyForce(new b2Vec2(xPush,yPush),myDisk.GetWorldCenter());
		}
	}
	
	
	//http://js-tut.aardon.de/js-tut/tutorial/position.html
	this.getElementPosition = function(element) {
		var elem=element, tagname="", x=0, y=0;
		
		while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
			y += elem.offsetTop;
			x += elem.offsetLeft;
			tagname = elem.tagName.toUpperCase();
			
			if(tagname == "BODY")
			elem=0;
			
			if(typeof(elem) == "object") {
				if(typeof(elem.offsetParent) == "object")
				elem = elem.offsetParent;
			}
		}
		
		return {x: x, y: y};
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