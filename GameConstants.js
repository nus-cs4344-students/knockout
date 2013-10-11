/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var GameConstants = {
	PORT : 8111,				// port of game
	FRAME_RATE : 30,			// frame rate of game
	SERVER_NAME : "localhost",	// server name of game
	PLATFORM_HEIGHT: 350,
	PLATFORM_WIDTH : 350,
	PLATFORM_DEPTH : 50,
	WINDOW_HEIGHT: 500,
	WINDOW_WIDTH: 500,
	NUM_OF_PLAYERS : 4
}

// For node.js require
global.GameConstants = GameConstants;