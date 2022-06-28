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

playerObj = {
  food: {
    x: 200,
    y: 200
  }
};

io.on('connection', client => {
  // On connection, create a new player and add the player to the player object
  let newPlayer = new Player({w: 40, h: 40, x: 20, y: 200, score: 0, id: client.id, rank: Object.keys(playerObj).length})
  playerObj[newPlayer.id] = newPlayer;

  // update the gamestate to all sockets connected
  io.emit('gamestate', JSON.stringify(playerObj));

  // send the id back to the client
  client.emit('init', {
    id: client.id
  })

  function calculateRank() {
    // create array to push to
    let rankArr = [];
    
    // push each player score to the new array
    Object.keys(playerObj).forEach((key) => {
      if (key == 'food') {
        return
      } else {
        rankArr.push({'id': playerObj[key].id, 'score': playerObj[key].score})
      }
      
      // sort the array by score and enter a rank based on it
      rankArr = rankArr.sort((a, b) => {
        return b.score - a.score
      }).map((e, i) => {
        e.rank = (i + 1);
        return e;
      })

      rankArr.forEach(entry => {
          playerObj[entry.id].rank = entry.rank;
      })

      // emit the gamestate to everybody
      io.emit('gamestate', JSON.stringify(playerObj));
      
    })
  }

  function collectFood() {
    // add to the player score
    playerObj[client.id].score += 1;

    // generate a random number for position
    let randomX = Math.floor(Math.random() * 570);
    let randomY = Math.floor(Math.random() * 430);
    
    // if randomY is under fifty, add fifty to it
    if (randomY < 50) {
      randomY = randomY + 50;
    }
    // if random x is under 10, add 10 to it
    if (randomX < 10) {
      randomX = randomX + 10;
    }

    // position the food
    playerObj.food.x = Math.floor(randomX / 10) * 10;
    playerObj.food.y = Math.floor(randomY / 10) * 10;

    calculateRank();

    // io.emit('gamestate', JSON.stringify(playerObj));

  }

  // a function for wall detection
  function detectWalls() {
    //Left wall
    if (playerObj[client.id].x < 10) {
      playerObj[client.id].x = 10;
    }

    //Right wall
    if (playerObj[client.id].x + playerObj[client.id].w > 630) {
      playerObj[client.id].x = 630 - playerObj[client.id].w;
    }

    //Top wall
    if (playerObj[client.id].y < 50) {
      playerObj[client.id].y = 50;
    }

    //Bottom wall
    if (playerObj[client.id].y + playerObj[client.id].h > 470) {
      playerObj[client.id].y = 470 - playerObj[client.id].h;
    }

    if (playerObj[client.id].x == playerObj.food.x && playerObj[client.id].y == playerObj.food.y) {
      collectFood();
    } else {
      io.emit('gamestate', JSON.stringify(playerObj));
    }
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
