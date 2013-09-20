/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var GameConstants = {
	WINDOW_HEIGHT : 400,				// height of game window
	WINDOW_WIDTH : 400,				// width of game window
	PORT : 8111,				// port of game
	FRAME_RATE : 30,			// frame rate of game
	SERVER_NAME : "localhost"	// server name of game
}

// For node.js require
global.GameConstants = GameConstants;