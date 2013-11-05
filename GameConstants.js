/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var GameConstants = {
	PORT : 8080,	// port of game
	SERVER_NAME : 'localhost',
	SERVER_INTERNAL_IP : '0.0.0.0',
	CANVAS_HEIGHT: 500,
	CANVAS_WIDTH: 600,
	SHAPE_NAME: 'playerDisk',
	PLATFORM_RADIUS : 10,
	PLAYER_RADIUS : 1.4,
	FRAME_RATE : 1000/60,
	CONVERGENCE_SENSITIVITY : 0.5, //if server position player is <CONVERGENCE_SENSITIVITY> pixels away then converge
	SERVER_ADDRESS : "", //for clients to connect to (can only be initialized later)
	NUM_OF_PLAYERS : 4
}

// For node.js require
global.GameConstants = GameConstants;
GameConstants.SERVER_ADDRESS = GameConstants.SERVER_NAME+':'+GameConstants.PORT;

//For Openshift network, will run if server exist
if(process.env.OPENSHIFT_APP_NAME){
	GameConstants.PORT = process.env.OPENSHIFT_NODEJS_PORT
	GameConstants.SERVER_INTERNAL_IP = process.env.OPENSHIFT_NODEJS_IP;
}