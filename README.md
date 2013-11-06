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
Rounds = 5
score = {p1:0, p2:0, p3:0, p4:0}
For each round, last one standing wins and gets a point.
At the end of 5 rounds, whoever with most points win

Lives Mode (easier than points mode)
lives = {p1:5, p2:5, p3:5, p4:5}
When all other players reach 0 except 1, that person wins
