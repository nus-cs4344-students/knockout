/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var GameConstants = {
	PORT : 4000,	// port of game
	SERVER_NAME : 'localhost',
	//SERVER_NAME : '192.168.2.6',
	SERVER_INTERNAL_IP : '0.0.0.0',
	CANVAS_HEIGHT: 500,
	CANVAS_WIDTH: 600,
	SHAPE_NAME: 'playerDisk',
	PLATFORM_RADIUS : 10,
	PLAYER_RADIUS : 1.4,
	FRAME_RATE : 1000/60,
	CONVERGENCE_SENSITIVITY : 0.8, //if server position player is <CONVERGENCE_SENSITIVITY> pixels away then converge
	SERVER_ADDRESS : "", //for clients to connect to (can only be initialized later)
	NUM_OF_PLAYERS : 2
}

// For node.js require
global.GameConstants = GameConstants;
GameConstants.SERVER_ADDRESS = GameConstants.SERVER_NAME+':'+GameConstants.PORT;