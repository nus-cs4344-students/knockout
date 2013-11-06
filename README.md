knockout
========
1) Change GameConstants.js SERVER_NAME to your ip address or "localhost"
2) Double click on run.bat to run the server
3) Go to your web browser, type in the SERVER_NAME you have set, add the server port as well (e.g. localhost:8111 or 192.168.3.4:8111)

Requires Node.js
npm install express
npm install sockjs

Limitations:
Doesn't work on iOS chrome, the contact listener doesn't seem to work

Gameplay:
Classic Mode
Each round, fight till last man standing
Game ends when everybody lost all the lives except for one (can be everybody loses all lives)

Points Mode
Time limit of 60 seconds, last person in contact with player and pushes him down gets points
