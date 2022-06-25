require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const Player = require('./public/Player.js');

const app = express();
const http = require('http').createServer(app);
const options = {
  cors: true,
  origins: ['*']
}


const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next()
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 
const io = socket(http);

playerObj = {};

io.on('connection', client => {
  // On connection, create a new player and add the player to the player object
  let newPlayer = new Player({w: 40, h: 40, x: 20, y: 200, score: 0, id: client.id})
  playerObj[newPlayer.id] = newPlayer;

  // update the gamestate to all sockets connected
  io.emit('gamestate', JSON.stringify(playerObj));

  // send the id back to the client
  client.emit('init', {
    id: client.id
  })

  // a function for wall detection
  function detectWalls() {
    //Left wall
    if (playerObj[client.id].x < 0) {
      playerObj[client.id].x = 0;
    }

    //Right wall
    if (playerObj[client.id].x + playerObj[client.id].w > 640) {
      playerObj[client.id].x = 640 - playerObj[client.id].w;
    }

    //Top wall
    if (playerObj[client.id].y < 0) {
      playerObj[client.id].y = 0;
    }

    if (playerObj[client.id].y + playerObj[client.id].h > 480) {
      playerObj[client.id].y = 480 - playerObj[client.id].h;
    }

    io.emit('gamestate', JSON.stringify(playerObj));
  }

  
  // on keydown emit, move the player and run the detect walls function
  client.on('keydown', (keyCode) => {
    try {
      keyCode = parseInt(keyCode)
    } catch (e) {
      console.error(e);
      return
    }

    let move = playerObj[client.id].movePlayer(keyCode, 10)

    if (move) {
      playerObj[client.id].x += move.x
      playerObj[client.id].y += move.y
    }

    detectWalls();
  })

  // on disconnect, remove the player from the player object and emit to all sockets
  client.on('disconnect', () => {
    delete playerObj[client.id]
    io.emit('gamestate', JSON.stringify(playerObj));
  })
})
// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
