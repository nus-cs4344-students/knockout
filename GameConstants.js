/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var GameConstants = {
	PORT : 8111,				// port of game
	FRAME_RATE : 30,			// frame rate of game
	SERVER_NAME : "localhost",	// server name of game
	CANVAS_HEIGHT: 500,
	CANVAS_WIDTH: 600,
	NUM_OF_PLAYERS : 4
}

// For node.js require
global.GameConstants = GameConstants;