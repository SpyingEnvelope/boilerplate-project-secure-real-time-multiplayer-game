class Player {
  constructor({w, h, x, y, score, id, rank}) {
    this.w = w;
    this.h = h;
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.rank = rank;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      //right
      case 68:
        return { x: speed, y: 0}
      //left
      case 65:
        return { x: -speed, y: 0}
      //down
      case 87:
        return { x: 0, y: -speed}
      case 83:
      //up
        return { x: 0, y: speed}
    }    

  }

  collision(item) {

  }

  calculateRank(arr) {

  }
}

module.exports = Player;
