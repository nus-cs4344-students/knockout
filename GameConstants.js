/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var GameConstants = {
	PORT : 8111,				// port of game
	//SERVER_NAME : "localhost",	// server name of game
	SERVER_NAME : "192.168.2.9",	// server name of game
	CANVAS_HEIGHT: 500,
	CANVAS_WIDTH: 600,
	SHAPE_NAME: 'playerDisk',
	PLATFORM_RADIUS : 10,
	PLAYER_RADIUS : 1.4,
	FRAME_RATE : 1000/60,
	CONVERGENCE_SENSITIVITY : 0.5, //if server position player is <CONVERGENCE_SENSITIVITY> pixels away then converge
	NUM_OF_PLAYERS : 4
}

// For node.js require
global.GameConstants = GameConstants;