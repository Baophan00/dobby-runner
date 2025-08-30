// Dobby Runner - Chrome Dino Style Game (7 Obstacles, Speed Optimized + Run Animation + Random Distance)

let dobby;
let cursors;
let obstacles;
let groundY;
let score = 0;
let scoreText;
let gameSpeed = 600;
let jumpSound, hitSound;
let gameOver = false;
let gameOverText;
let restartText;
let highScore = localStorage.getItem("dobbyHighScore") || 0;
let highScoreText;
let spaceKey;
let obstacleTimer;
let isJumping = false;
let groundSprite;

// Danh sách obstacle
const obstacleKeys = [
  "obstacle1",
  "obstacle2",
  "obstacle3",
  "obstacle4",
  "obstacle5",
  "obstacle6",
];

function preload() {
  // Load nhân vật (2 frame chạy)
  this.load.image("dobby_run1", "./assets/dobby_run1.png");
  this.load.image("dobby_run2", "./assets/dobby_run2.png");

  // Load obstacles
  this.load.image("obstacle1", "./assets/obstacle1.png");
  this.load.image("obstacle2", "./assets/obstacle2.png");
  this.load.image("obstacle3", "./assets/obstacle3.png");
  this.load.image("obstacle4", "./assets/obstacle4.png");
  this.load.image("obstacle5", "./assets/obstacle5.png");
  this.load.image("obstacle6", "./assets/obstacle6.png");

  // Âm thanh
  this.load.audio("jump", "./assets/jump.wav");
  this.load.audio("hit", "./assets/hit.wav");
}

function createGroundPattern(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const w = 200;
  const h = 8;

  g.fillStyle(0xffffff, 0); // nền trong suốt

  for (let i = 0; i < w; i += Phaser.Math.Between(12, 25)) {
    const dashLength = Phaser.Math.Between(8, 18);
    const yOffset = Phaser.Math.Between(0, 4);
    g.fillStyle(0xbcbcbc, 1);
    g.fillRect(i, yOffset, dashLength, 2);
  }

  g.generateTexture("groundPattern", w, h);
  g.destroy();

  const ground = scene.add.tileSprite(
    scene.scale.width / 2,
    groundY,
    scene.scale.width,
    h,
    "groundPattern"
  );
  scene.physics.add.existing(ground, true);
  return ground;
}

function create() {
  gameOver = false;
  score = 0;
  gameSpeed = 600;
  groundY = 280;

  this.cameras.main.setBackgroundColor("#f7f7f7");

  // Nền đất
  groundSprite = createGroundPattern(this);

  // Nhân vật
  dobby = this.physics.add.sprite(100, groundY - 60, "dobby_run1");
  dobby.setCollideWorldBounds(true);
  dobby.setDisplaySize(100, 120); // rộng 100, cao 120
  dobby.setY(groundY - dobby.displayHeight / 2);
  dobby.body.setSize(dobby.width * 0.7, dobby.height * 0.7);

  // Animation chạy
  this.anims.create({
    key: "run",
    frames: [{ key: "dobby_run1" }, { key: "dobby_run2" }],
    frameRate: 10,
    repeat: -1,
  });
  dobby.play("run");

  // Nhóm obstacle
  obstacles = this.physics.add.group();

  jumpSound = this.sound.add("jump", { volume: 0.3 });
  hitSound = this.sound.add("hit", { volume: 0.5 });

  // Text
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
      "Press SPACE / TAP to restart",
      { fontSize: "16px", fill: "#757575", fontFamily: "monospace" }
    )
    .setOrigin(0.5);
  restartText.visible = false;

  // Input
  cursors = this.input.keyboard.createCursorKeys();
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // Nhảy bằng tap màn hình
  this.input.on("pointerdown", () => {
    if (!gameOver) tryJump();
    else restartGame.call(this);
  });

  startObstacleSpawning.call(this);

  // Va chạm đất
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
      Phaser.Input.Keyboard.JustDown(spaceKey) ||
      Phaser.Input.Keyboard.JustDown(cursors.up)
    ) {
      tryJump();
    }

    if ((dobby.body.touching.down || dobby.body.onFloor()) && isJumping) {
      isJumping = false;
    }

    // Animation chạy hoặc nhảy
    if (dobby.body.touching.down || dobby.body.onFloor()) {
      if (!dobby.anims.isPlaying) dobby.play("run", true);
    } else {
      dobby.anims.stop();
      dobby.setTexture("dobby_run1");
    }

    // Xóa obstacle ra ngoài màn
    obstacles.getChildren().forEach((obstacle) => {
      if (obstacle.x < -50) {
        obstacle.destroy();
        increaseScore();
      }
    });

    increaseDifficulty();

    // Ground scroll
    groundSprite.tilePositionX += gameSpeed / 60;
  } else {
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
      restartGame.call(this);
    }
  }
}

function tryJump() {
  if (dobby.body.touching.down || dobby.body.onFloor()) {
    dobby.setVelocityY(-520);
    jumpSound.play();
    isJumping = true;
  }
}

function startObstacleSpawning() {
  obstacleTimer = this.time.addEvent({
    delay: Phaser.Math.Between(800, 2000),
    callback: () => {
      spawnObstacle.call(this);

      // reset timer với delay mới
      obstacleTimer.reset({
        delay: Phaser.Math.Between(800, 2200),
        callback: () => spawnObstacle.call(this),
        callbackScope: this,
        loop: true,
      });
    },
    callbackScope: this,
    loop: true,
  });
}

function spawnObstacle() {
  if (!gameOver) {
    const key = obstacleKeys[Phaser.Math.Between(0, obstacleKeys.length - 1)];
    const obstacle = obstacles.create(this.scale.width + 20, groundY - 30, key);

    const size = Phaser.Math.Between(50, 70);
    obstacle.setDisplaySize(size, size);
    obstacle.body.setSize(obstacle.width * 0.9, obstacle.height * 0.9);
    obstacle.body.setImmovable(true);
    obstacle.body.allowGravity = false;
    obstacle.setVelocityX(-gameSpeed);
  }
}

function increaseScore() {
  score += 1;
  scoreText.setText("Score: " + score);
  if (score % 10 === 0) gameSpeed += 20;
}

function increaseDifficulty() {
  gameSpeed += 0.05;
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
  gameSpeed = 600;
  isJumping = false;
  gameOverText.visible = false;
  restartText.visible = false;
  scoreText.setText("Score: 0");
  obstacles.clear(true, true);
  dobby.setPosition(100, groundY - dobby.displayHeight / 2);
  dobby.setVelocity(0, 0);
  dobby.play("run");
  startObstacleSpawning.call(this);
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: 300,
  render: { pixelArt: false, antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: "#f7f7f7",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false },
  },
  scene: { preload, create, update },
};

new Phaser.Game(config);
