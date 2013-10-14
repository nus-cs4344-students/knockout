var context;

var GameEngine = function() {
	using(Box2D, "b2.+");
    //constructor
	var PTM = 32;
	var world = null;
	var canvas;       
	var myQueryCallback; 
	var myDebugDraw; 
	var run = true;
	var frameTime60 = 0; 
	var that = this;
	var mySphere = null;
       
	var canvasOffset = {
		x: 0,
		y: 0
	};        
	var viewCenterPixel = {
		x:320,
		y:240
	};
	
	this.init = function(){
		canvas = document.getElementById("canvas");
		context = canvas.getContext( '2d' );
		
		canvasOffset.x = canvas.width/2;
		canvasOffset.y = canvas.height/2;
		
		myDebugDraw = getCanvasDebugDraw();   
		myDebugDraw.SetFlags(e_shapeBit|e_jointBit);
		
		myQueryCallback = new b2QueryCallback();
		
		Box2D.customizeVTable(myQueryCallback, [{
			original: Box2D.b2QueryCallback.prototype.ReportFixture,
			replacement:
			function(thsPtr, fixturePtr) {
				var ths = Box2D.wrapPointer( thsPtr, b2QueryCallback );
				var fixture = Box2D.wrapPointer( fixturePtr, b2Fixture );
				if ( fixture.GetBody().GetType() != Box2D.b2_dynamicBody ) //mouse cannot drag static bodies around
                return true;
				if ( ! fixture.TestPoint( ths.m_point ) )
                return true;
				ths.m_fixture = fixture;
				return false;
			}
		}]);
	}
	
	this.zoomIn = function(){
		var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
		PTM *= 1.1;
		var newViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
		canvasOffset.x += (newViewCenterWorld.x-currentViewCenterWorld.x) * PTM;
		canvasOffset.y -= (newViewCenterWorld.y-currentViewCenterWorld.y) * PTM;
		draw();
	}
	
	this.zoomOut = function(){
		var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
		PTM /= 1.1;
		var newViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
		canvasOffset.x += (newViewCenterWorld.x-currentViewCenterWorld.x) * PTM;
		canvasOffset.y -= (newViewCenterWorld.y-currentViewCenterWorld.y) * PTM;
		draw();
	}
	
	this.getWorldPointFromPixelPoint = function(pixelPoint) {
		return {                
			x: (pixelPoint.x - canvasOffset.x)/PTM,
			y: (pixelPoint.y - (canvas.height - canvasOffset.y))/PTM
		};
	}
	
	this.setViewCenterWorld = function(b2vecpos, instantaneous) {
		var currentViewCenterWorld = this.getWorldPointFromPixelPoint( viewCenterPixel );
		var toMoveX = b2vecpos.get_x() - currentViewCenterWorld.x;
		var toMoveY = b2vecpos.get_y() - currentViewCenterWorld.y;
		var fraction = instantaneous ? 1 : 0.25;
		canvasOffset.x -= myRound(fraction * toMoveX * PTM, 0);
		canvasOffset.y += myRound(fraction * toMoveY * PTM, 0);
	}
	
	this.resetScene = function() {
		createWorld();
		draw();
	}
	
	var createWorld = function() {
		if ( world != null ){
			Box2D.destroy(world);
		}
        
		world = new b2World( new b2Vec2(0.0, 0.0) );
		world.SetDebugDraw(myDebugDraw);
		
		that.setViewCenterWorld( new b2Vec2(0,7.5), true );
		
		var ground = world.CreateBody(new b2BodyDef());
		
        var shape = new b2EdgeShape();
        shape.Set(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
        ground.CreateFixture(shape, 0.0);
		shape.Set(new b2Vec2(-40.0, 14.0), new b2Vec2(40.0, 14.0));
		ground.CreateFixture(shape, 0.0);
		shape.Set(new b2Vec2(-8.0, 40.0), new b2Vec2(-8.0, -40.0));
		ground.CreateFixture(shape, 0.0);
		shape.Set(new b2Vec2(8.0, 40.0), new b2Vec2(8.0, -40.0));
		ground.CreateFixture(shape, 0.0);
		
		var a = 0.5;
		var shape = new b2CircleShape();
		shape.set_m_radius(a);
		
        var bd = new b2BodyDef();
        bd.set_type( b2_dynamicBody );
		
		bd.set_position(new b2Vec2(0,3));
		mySphere =  world.CreateBody(bd);
		mySphere.CreateFixture(shape, 5.0);
		world.CreateBody(bd).CreateFixture(shape, 5.0);
		world.CreateBody(bd).CreateFixture(shape, 5.0);
		world.CreateBody(bd).CreateFixture(shape, 5.0);
	}
	
	var step = function() {		
		var current = Date.now();
		world.Step(1/60, 3, 2);
		checkKeys();
		
		//This is for stats
		var frametime = (Date.now() - current);
		frameTime60 = frameTime60 * (59/60) + frametime * (1/60);
		
		draw();
	}
	
	var draw = function () {
		//black background
		context.fillStyle = 'rgb(0,0,0)';
		context.fillRect( 0, 0, canvas.width, canvas.height );
		
		context.save();
        context.translate(canvasOffset.x, canvasOffset.y);
        context.scale(1,-1);                
        context.scale(PTM,PTM);
        context.lineWidth /= PTM;
		
		drawAxes(context);
        
        context.fillStyle = 'rgb(255,255,0)';
		world.DrawDebugData();
		
		context.restore();
	}
	
	this.animate = function(){
		if ( run ){
			requestAnimFrame( that.animate );
		}
		step();
	}
	
	var checkKeys = function(){
		if(mySphere==null){
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
			yPush += 15;
		}
		
		if(Key.isDown(Key.DOWN)){
			yPush -= 15;
		}
		
		if(xPush!=0 || yPush!=0 ){
			console.log("should move: "+xPush+" "+yPush);
			mySphere.ApplyForceToCenter(new b2Vec2(xPush,yPush));
		}
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