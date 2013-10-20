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
	}
	
	this.startEngine = function(){
		createWorld();
		setupDebugDraw();
		that.animate();
	}
	
	this.animate = function(){
		requestAnimFrame( that.animate );
		that.update();
	}
	
	var createWorld = function(){
		world = new b2World(
			new b2Vec2(0, 0)    //gravity is zero since top-down
			,  true                 //allow sleep
		);
		
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0.0;
		fixDef.restitution = 0.6;
		
		var bodyDef = new b2BodyDef;
		//create ground
		bodyDef.type = b2Body.b2_staticBody;
		fixDef.shape = new b2PolygonShape;
		fixDef.shape.SetAsBox(20, 2);
		bodyDef.position.Set(10, 400 / 30 + 1.8);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		bodyDef.position.Set(10, -1.8);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		fixDef.shape.SetAsBox(2, 14);
		bodyDef.position.Set(-1.8, 13);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		bodyDef.position.Set(21.8, 13);
		world.CreateBody(bodyDef).CreateFixture(fixDef);
		
		
		//create some objects
		bodyDef.type = b2Body.b2_dynamicBody;
		// for(var i = 0; i < 10; ++i) {
		//    if(Math.random() > 0.5) {
		//       fixDef.shape = new b2PolygonShape;
		//       fixDef.shape.SetAsBox(
		//             Math.random() + 0.1 //half width
		//          ,  Math.random() + 0.1 //half height
		//       );
		//    } else {
		//       fixDef.shape = new b2CircleShape(
		//          Math.random() + 0.1 //radius
		//       );
		//    }
		//    bodyDef.position.x = Math.random() * 10;
		//    bodyDef.position.y = Math.random() * 10;
		//    world.CreateBody(bodyDef).CreateFixture(fixDef);
		// }
		//my disk
		fixDef.shape = new b2CircleShape(
		1 //radius
		);
		bodyDef.position.x = Math.random() * 10;
		bodyDef.position.y = Math.random() * 10;
		
		myDisk = world.CreateBody(bodyDef);
		myDisk.CreateFixture(fixDef);
		
		var oppo1 = world.CreateBody(bodyDef).CreateFixture(fixDef);
		var oppo2 = world.CreateBody(bodyDef).CreateFixture(fixDef);
		var oppo3 = world.CreateBody(bodyDef).CreateFixture(fixDef);
	}
	
	var setupDebugDraw = function(){
		//setup debug draw
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
		debugDraw.SetDrawScale(30.0);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		world.SetDebugDraw(debugDraw);
	}
	
	this.update = function(){
		world.Step(1 / 60, 10, 10);
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
		
		if(Key.isDown(Key.LEFT)){
			xPush -= 15;
		}
		
		if(Key.isDown(Key.RIGHT)){
			xPush += 15;
		}
		
		if(Key.isDown(Key.UP)){
			yPush -= 15;
		}
		
		if(Key.isDown(Key.DOWN)){
			yPush += 15;
		}
		
		if(xPush!=0 || yPush!=0 ){
			console.log("should move: "+xPush+" "+yPush);
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