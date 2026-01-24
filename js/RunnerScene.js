// RunnerScene.js

const OBSTACLE_TYPES = [
    {
        emoji: "⏰",
        hitbox: { width: 34, height: 34 },
        message: "You slept through the alarm."
    },
    {
        emoji: "🧾",
        hitbox: { width: 28, height: 36 },
        message: "Bills and paperwork buried you alive."
    },
    {
        emoji: "⏳",
        hitbox: { width: 36, height: 36 },
        message: "Your deadlines caught up with you."
    }
];

export default class RunnerScene extends Phaser.Scene {
    constructor() {
        super("RunnerScene");
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Game state
        this.speed = 300;
        this.age = 18;
        this.ageTimer = 0;
        this.isGameOver = false;

        // Ground
        this.ground = this.add.rectangle(0, height - 40, width * 2, 40, 0x444444)
            .setOrigin(0, 0);
        this.physics.add.existing(this.ground, true);

        // Player
        this.player = this.add.rectangle(120, height - 100, 40, 60, 0x00ffcc);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.ground);

        // Obstacles (manual handling)
        this.obstacleTexts = [];

        // Input
        this.input.keyboard.on("keydown-SPACE", this.jump, this);
        this.input.on("pointerdown", this.jump, this);

        // UI
        this.ageText = this.add.text(20, 20, "Age: 18", {
            fontSize: "18px",
            color: "#ffffff"
        });

        // Spawn timer
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
    }

    jump() {
        if (!this.isGameOver && this.player.body.blocked.down) {
            this.player.body.setVelocityY(-500);
        }
    }

    spawnObstacle() {
        if (this.isGameOver) return;

        const width = this.cameras.main.width;
        const groundY = this.ground.y;

        const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);

        const obstacle = this.add.text(
            width + 50,
            groundY - 80,
            type.emoji,
            {
                fontSize: "48px"
            }
        );

        obstacle.type = type;
        obstacle.setDepth(10);

        this.tweens.add({
            targets: obstacle,
            x: -100,
            duration: Math.max(1200, 3000 - this.age * 20),
            onComplete: () => {
                this.obstacleTexts = this.obstacleTexts.filter(o => o !== obstacle);
                obstacle.destroy();
            }
        });

        this.obstacleTexts.push(obstacle);
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Manual collision detection
        const playerBounds = this.player.getBounds();

        this.obstacleTexts.forEach(obstacle => {
            const hb = obstacle.type.hitbox;

            const obstacleBounds = new Phaser.Geom.Rectangle(
                obstacle.x + obstacle.width / 2 - hb.width / 2,
                obstacle.y + obstacle.height / 2 - hb.height / 2,
                hb.width,
                hb.height
            );

            if (Phaser.Geom.Intersects.RectangleToRectangle(
                playerBounds,
                obstacleBounds
            )) {
                this.gameOver(obstacle.type.message);
            }
        });

        // Age progression
        this.ageTimer += delta;
        if (this.ageTimer > 10000) {
            this.age++;
            this.speed += 30;
            this.ageTimer = 0;
            this.ageText.setText(`Age: ${this.age}`);
        }
    }

    gameOver(reason = "Life happened.") {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.player.body.setVelocity(0, 0);
        this.player.body.allowGravity = false;

        this.cameras.main.shake(200, 0.01);

        const msg = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            reason,
            {
                fontSize: "24px",
                color: "#ffffff",
                align: "center"
            }
        ).setOrigin(0.5);

        this.time.delayedCall(1400, () => {
            msg.destroy();
            this.scene.start("MenuScene");
        });
    }
}