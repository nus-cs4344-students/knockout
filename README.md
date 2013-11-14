knockout
========
1) Change GameConstants.js SERVER_NAME to your ip address or "localhost"
2) Double click on run.bat to run the server
3) Go to your web browser, type in the SERVER_NAME you have set, add the server port as well (e.g. localhost:4000 or 192.168.3.4:8111)
4) You can change number of players in GameConstants.js

Requires Node.js
npm install express
npm install sockjs

Libraries used:
jQuery
Foundation (For UI)

Limitations:
Doesn't work on iOS chrome, the contact listener doesn't seem to work
Accelerometer only works on some android devices (tested working on HTC one, does not work on Galaxy S2)

Gameplay:
Classic Mode
Each round, fight till last man standing
Game ends at round 5, player who survived the most rounds wins

Points Mode
Time limit of 60 seconds, last person in contact with player and pushes him down gets points
Player with the most points wins the game

