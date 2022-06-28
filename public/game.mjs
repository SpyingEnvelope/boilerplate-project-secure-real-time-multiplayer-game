// import Player  from './Player.js';
import Collectible from './Collectible.mjs';



const socket = io();
let id;

socket.on('init', (data) => {
    id = data.id
    console.log(id)
});

document.addEventListener('keydown', handleKeydown)

socket.on('gamestate', updateGameState)
// socket.on('gamestate', handleGameState);
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

const clientPlayer = new Image(50, 70);
clientPlayer.src = '../public/graycat.png'

const otherPlayers = new Image(50, 70);
otherPlayers.src = '../public/redcat.png';

const foodImage = new Image(10, 10);
foodImage.src = '../public/food.png';

// function handleGameState(gameState) {
//     gameState = JSON.parse(gameState);
//     requestAnimationFrame(() => paintGame(gameState));
// }

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawBorders() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.strokeRect(5,45, canvas.width - 10, canvas.height - 50);

    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Controls: WASD', 5, 30);

    ctx.fillText('Coin Race', 260, 30);
    ctx.fillText('Rank :', canvas.width - 120, 30);
}

function handleKeydown(e){
    socket.emit('keydown', e.keyCode);
}

function drawFood(x, y) {
    ctx.drawImage(foodImage, x, y, 40, 40);
}

function drawPlayer(x, y, w, h, playerId, score) {
    if (playerId == id) {
        ctx.drawImage(clientPlayer, x, y, w, h)

        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(score.rank + ' / ' + score.numOfPlayers, canvas.width - 55, 30)
    } else {
        ctx.drawImage(otherPlayers, x, y, w, h)
    }

}

function drawGame(gameState) {
    const keysFromGameState = Object.keys(gameState);
    const numberOfPlayers = keysFromGameState.length - 1

    Object.keys(gameState).forEach((key) => {
        if (key == 'food') {
            drawFood(gameState[key].x, gameState[key].y)
        } else {
            drawPlayer(gameState[key].x, gameState[key].y, gameState[key].w, gameState[key].h, key, {rank: gameState[key].rank, numOfPlayers: numberOfPlayers})
        }
        
    })
}

function updateGameState(gameState) {
    clear();
    drawBorders();

    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => {
        drawGame(gameState)
    })
}
