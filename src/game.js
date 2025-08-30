// Dobby Runner - Chrome Dino Style Game (6 Obstacles, Speed Optimized)

let dobby;
let cursors;
let obstacles;
let groundY;
let score = 0;
let scoreText;
let gameSpeed = 380; // Slightly faster base speed
let jumpSound, hitSound;
let gameOver = false;
let gameOverText;
let restartText;
let highScore = localStorage.getItem("dobbyHighScore") || 0;
let highScoreText;
let spaceKey;
let obstacleTimer;
let isJumping = false;

// 6 vật cản
const obstacleKeys = [
  "obstacle1",
  "obstacle2",
  "obstacle3",
  "obstacle4",
  "obstacle5",
  "obstacle6",
];

function preload() {
  this.load.image("dobby", "./assets/dobby.png");

  // Load tất cả 6 vật cản
  this.load.image("obstacle1", "./assets/obstacle1.png");
  this.load.image("obstacle2", "./assets/obstacle2.png");
  this.load.image("obstacle3", "./assets/obstacle3.png");
  this.load.image("obstacle4", "./assets/obstacle4.png");
  this.load.image("obstacle5", "./assets/obstacle5.png");
  this.load.image("obstacle6", "./assets/obstacle6.png");

  this.load.audio("jump", "./assets/jump.wav");
  this.load.audio("hit", "./assets/hit.wav");
}

function create() {
  gameOver = false;
  score = 0;
  gameSpeed = 380; // Slightly faster starting speed
  groundY = 280;

  this.cameras.main.setBackgroundColor("#f7f7f7");

  dobby = this.physics.add.sprite(100, groundY, "dobby");
  dobby.setCollideWorldBounds(true);

  // Set size nhân vật (chiều rộng 100, chiều cao 120)
  dobby.setDisplaySize(100, 120);
  // Đặt lại vị trí chính xác trên mặt đất
  dobby.setY(groundY - dobby.displayHeight / 2);
  // Hitbox nhỏ hơn để dễ chơi
  dobby.body.setSize(dobby.width * 0.7, dobby.height * 0.7);

  obstacles = this.physics.add.group();

  jumpSound = this.sound.add("jump", { volume: 0.3 });
  hitSound = this.sound.add("hit", { volume: 0.5 });

  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "24px",
    fill: "#535353",
    fontFamily: "monospace",
  });
  highScoreText = this.add.text(16, 50, `High Score: ${highScore}`, {
    fontSize: "18px",
    fill: "#757575",
    fontFamily: "monospace",
  });

  gameOverText = this.add
    .text(
      this.scale.width / 2,
      this.scale.height / 2 - 40,
      "G A M E   O V E R",
      {
        fontSize: "32px",
        fill: "#535353",
        fontFamily: "monospace",
        letterSpacing: "4px",
      }
    )
    .setOrigin(0.5);
  gameOverText.visible = false;

  restartText = this.add
    .text(
      this.scale.width / 2,
      this.scale.height / 2,
      "Press SPACE or TAP to restart",
      { fontSize: "16px", fill: "#757575", fontFamily: "monospace" }
    )
    .setOrigin(0.5);
  restartText.visible = false;

  cursors = this.input.keyboard.createCursorKeys();
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // Support mobile: tap để nhảy
  this.input.on("pointerdown", () => {
    if (!gameOver && (dobby.body.touching.down || dobby.body.onFloor())) {
      dobby.setVelocityY(-450);
      jumpSound.play();
      isJumping = true;
    } else if (gameOver) {
      restartGame.call(this);
    }
  });

  startObstacleSpawning.call(this);

  const ground = this.physics.add.staticGroup();
  const groundRect = this.add
    .rectangle(this.scale.width / 2, groundY, this.scale.width, 20, 0x555555)
    .setAlpha(0);
  ground.add(groundRect);
  this.physics.add.collider(dobby, ground);

  this.physics.add.overlap(dobby, obstacles, hitObstacle, null, this);
}

function update() {
  if (!gameOver) {
    if (
      (Phaser.Input.Keyboard.JustDown(spaceKey) ||
        Phaser.Input.Keyboard.JustDown(cursors.up)) &&
      (dobby.body.touching.down || dobby.body.onFloor())
    ) {
      dobby.setVelocityY(-450);
      jumpSound.play();
      isJumping = true;
    }

    if ((dobby.body.touching.down || dobby.body.onFloor()) && isJumping) {
      isJumping = false;
    }

    obstacles.getChildren().forEach((obstacle) => {
      if (obstacle.x < -50) {
        obstacle.destroy();
        increaseScore();
      }
    });

    increaseDifficulty();
  } else {
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
      restartGame.call(this);
    }
  }
}

function startObstacleSpawning() {
  obstacleTimer = this.time.addEvent({
    delay: Phaser.Math.Between(1200, 2200), // random khoảng cách
    callback: spawnObstacle,
    callbackScope: this,
    loop: true,
  });
}

function spawnObstacle() {
  if (!gameOver) {
    const key = obstacleKeys[Phaser.Math.Between(0, obstacleKeys.length - 1)];
    const obstacle = obstacles.create(this.scale.width + 20, groundY - 30, key);
    obstacle.setDisplaySize(60, 60);
    obstacle.body.setSize(obstacle.width * 0.8, obstacle.height * 0.8);
    obstacle.body.setImmovable(true);
    obstacle.body.allowGravity = false;
    obstacle.setVelocityX(-gameSpeed);
  }
}

function increaseScore() {
  score += 1;
  scoreText.setText("Score: " + score);
  if (score % 10 === 0) gameSpeed += 18;
}

function increaseDifficulty() {
  gameSpeed += 0.04;
}

function hitObstacle(player, obstacle) {
  if (!gameOver) {
    gameOver = true;
    hitSound.play();
    dobby.setVelocityX(0);
    obstacles.getChildren().forEach((obs) => obs.setVelocityX(0));
    if (obstacleTimer) obstacleTimer.destroy();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("dobbyHighScore", highScore);
      highScoreText.setText(`High Score: ${highScore}`);
    }
    gameOverText.visible = true;
    restartText.visible = true;
    this.cameras.main.flash(200, 255, 0, 0, false);
  }
}

function restartGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 380;
  isJumping = false;
  gameOverText.visible = false;
  restartText.visible = false;
  scoreText.setText("Score: 0");
  obstacles.clear(true, true);
  dobby.setPosition(100, groundY - dobby.displayHeight / 2);
  dobby.setVelocity(0, 0);
  dobby.setDisplaySize(100, 120);
  startObstacleSpawning.call(this);
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: 300,
  render: { pixelArt: false, antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: "#f7f7f7",
  physics: { default: "arcade", arcade: { gravity: { y: 800 }, debug: false } },
  scene: { preload, create, update },
};

new Phaser.Game(config);
