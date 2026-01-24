// RunnerScene.js
const DEBUG_HITBOXES = true;

const TARGET_WIDTH = 60;
const TARGET_HEIGHT = 80;
const CROUCH_FACTOR = 0.55;

const OBSTACLE_TYPES = [
    {
        emoji: "⏰",
        hitbox: { width: 38, height: 38 },
        yOffset: 0,
        messages: [
            "You slept through the alarm.",
            "Snooze betrayed you.",
            "\"Five more minutes\" was a lie."
        ]
    },
    {
        emoji: "🧾",
        hitbox: { width: 32, height: 40 },
        yOffset: 0,
        messages: [
            "Bills and paperwork buried you alive.",
            "You should’ve read the fine print."
        ]
    },
    {
        emoji: "⏳",
        hitbox: { width: 28, height: 36 },
        yOffset: 0,
        messages: [
            "Your deadlines caught up.",
            "If only you had more time.",
            "Time management is not your forte."
        ]
    },
    {
        emoji: "📉",
        hitbox: { width: 44, height: 44 },
        yOffset: -60,
        requiresDuck: true,
        messages: [
            "You didn’t duck in time.",
            "Limbo skills: insufficient.",
            "The market is down and so are you."
        ]
    }
];

export default class RunnerScene extends Phaser.Scene {
    constructor() {
        super("RunnerScene");
    }

    preload() {
        this.load.image("player", "resources/model.png");
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        /* ──────────────
           Debug
        ────────────── */
        this.debugGraphics = this.add.graphics();

        /* ──────────────
           Game state
        ────────────── */
        this.baseSpeed = 300;
        this.speed = this.baseSpeed;
        this.age = 18;
        this.ageTimer = 0;
        this.isGameOver = false;
        this.isDucking = false;

        /* ──────────────
           Ground
        ────────────── */
        this.groundHeight = 40;

        this.ground = this.add
            .rectangle(0, height - this.groundHeight, width * 2, this.groundHeight, 0x444444)
            .setOrigin(0, 0);

        this.physics.add.existing(this.ground, true);

        /* ──────────────
           Player PHYSICS BODY (authoritative)
        ────────────── */
        this.playerBody = this.physics.add
            .sprite(
                120,
                height - this.groundHeight - 30,
                null
            )
            .setOrigin(0.5, 1);

        // AFTER size is set
        this.playerBody.body.setSize(TARGET_WIDTH, TARGET_HEIGHT);

        // 🔑 snap body so its bottom sits on ground
        this.playerBody.y = height - this.groundHeight - 30;
        this.playerBody.body.y = this.playerBody.y - TARGET_HEIGHT;
        this.playerBody.body.updateFromGameObject();

        this.playerBody.body.setSize(TARGET_WIDTH, TARGET_HEIGHT);
        this.playerBody.body.setCollideWorldBounds(true);
        this.playerBody.setVisible(false);

        this.physics.add.collider(this.playerBody, this.ground);

        /* ──────────────
           Player VISUAL
        ────────────── */
        this.player = this.add.image(0, 0, "player")
            .setOrigin(0.5, 0.7);

        this.player.baseScaleX = TARGET_WIDTH / 1080;
        this.player.baseScaleY = TARGET_HEIGHT / 1920;
        this.player.setScale(this.player.baseScaleX, this.player.baseScaleY);

        /* ──────────────
           Obstacles
        ────────────── */
        this.obstacleTexts = [];

        /* ──────────────
           Input
        ────────────── */
        this.input.keyboard.on("keydown-SPACE", this.jump, this);
        this.input.keyboard.on("keydown-UP", this.jump, this);
        this.input.keyboard.on("keydown-W", this.jump, this);

        this.input.keyboard.on("keydown-DOWN", this.startDuck, this);
        this.input.keyboard.on("keydown-S", this.startDuck, this);
        this.input.keyboard.on("keydown-CTRL", this.startDuck, this);

        this.input.keyboard.on("keyup-DOWN", this.endDuck, this);
        this.input.keyboard.on("keyup-S", this.endDuck, this);
        this.input.keyboard.on("keyup-CTRL", this.endDuck, this);

        this.input.on("pointerdown", pointer => {
            if (pointer.rightButtonDown()) {
                this.startDuck();
            } else {
                this.jump();
            }
        });

        this.input.on("pointerup", () => {
            this.endDuck();
        });

        /* ──────────────
           UI
        ────────────── */
        this.ageText = this.add.text(20, 20, "Age: 18", {
            fontSize: "18px",
            color: "#ffffff"
        });

        /* ──────────────
           Spawner
        ────────────── */
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
    }

    /* ──────────────
       Controls
    ────────────── */

    jump() {
        if (this.isGameOver) return;

        if (this.playerBody.body.blocked.down) {
            this.playerBody.body.setVelocityY(-500);
        }
    }

    startDuck() {
        if (this.isGameOver || this.isDucking) return;

        this.isDucking = true;

        // Visual only
        this.player.setScale(
            this.player.baseScaleX,
            this.player.baseScaleY * CROUCH_FACTOR
        );
        this.player.y -= 1000;
        this.playerBody.body.setSize(
            TARGET_WIDTH,
            TARGET_HEIGHT * CROUCH_FACTOR
        );
    }

    endDuck() {
        if (!this.isDucking) return;

        this.isDucking = false;

        this.player.setScale(
            this.player.baseScaleX,
            this.player.baseScaleY
        );
        this.playerBody.body.setSize(
            TARGET_WIDTH,
            TARGET_HEIGHT
        );
        this.player.y -= TARGET_HEIGHT - (TARGET_HEIGHT * CROUCH_FACTOR);
        this.playerBody.y -= TARGET_HEIGHT - (TARGET_HEIGHT * CROUCH_FACTOR);
    }

    /* ──────────────
       Obstacles
    ────────────── */

    spawnObstacle() {
        if (this.isGameOver) return;

        const width = this.cameras.main.width;
        const groundTop = this.ground.y;

        const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);

        let y = groundTop;

        y += type.yOffset || 0;

        const obstacle = this.add.text(
            width + 50,
            y,
            type.emoji,
            { fontSize: "48px" }
        )
            .setOrigin(0.5, 1)
            .setDepth(10);

        obstacle.type = type;

        this.tweens.add({
            targets: obstacle,
            x: -100,
            duration: Math.max(800, 3000 - this.speed),
            onComplete: () => {
                this.obstacleTexts = this.obstacleTexts.filter(o => o !== obstacle);
                obstacle.destroy();
            }
        });

        this.obstacleTexts.push(obstacle);
    }

    /* ──────────────
       Update
    ────────────── */

    update(_, delta) {
        if (this.isGameOver) return;

        // Sync visual to physics (feet-locked)
        this.player.x = this.playerBody.x;
        this.player.y = this.playerBody.y;

        if (DEBUG_HITBOXES) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(1, 0xff0000);

            const body = this.playerBody.body;
            this.debugGraphics.strokeRect(
                body.x,
                body.y,
                body.width,
                body.height
            );
        }

        this.obstacleTexts.forEach(obstacle => {
            const hb = obstacle.type.hitbox;
            const displayBounds = obstacle.getBounds();

            const obstacleBounds = new Phaser.Geom.Rectangle(
                displayBounds.centerX - hb.width / 2,
                displayBounds.centerY - hb.height / 2,
                hb.width,
                hb.height
            );

            if (DEBUG_HITBOXES) {
                this.debugGraphics.strokeRect(
                    obstacleBounds.x,
                    obstacleBounds.y,
                    obstacleBounds.width,
                    obstacleBounds.height
                );
            }

            if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                    this.playerBody.body,
                    obstacleBounds
                )
            ) {
                this.gameOver(
                    Phaser.Utils.Array.GetRandom(obstacle.type.messages)
                );
            }
        });

        this.ageTimer += delta;
        if (this.ageTimer > 10000) {
            this.age++;
            this.speed += 30;
            this.ageTimer = 0;
            this.ageText.setText(`Age: ${this.age}`);
        }
    }

    /* ──────────────
       Game Over
    ────────────── */

    showGameOverDialog(reason) {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const panel = this.add.rectangle(cx, cy, 360, 180, 0x000000, 0.85)
            .setDepth(100);

        const text = this.add.text(cx, cy - 30, reason, {
            fontSize: "18px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 320 }
        }).setOrigin(0.5).setDepth(101);

        const retry = this.add.text(cx, cy + 40, "Jump to retry", {
            fontSize: "14px",
            color: "#a8a8a8ff"
        }).setOrigin(0.5).setDepth(101);

        const restart = () => {
            this.input.keyboard.off("keydown-SPACE", restart);
            this.scene.restart();
        };

        this.input.keyboard.once("keydown-SPACE", restart);
        this.input.once("pointerdown", restart);
    }

    gameOver(reason = "Life happened.") {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.spawnTimer.remove(false);
        this.tweens.killAll();

        this.playerBody.body.setVelocity(0, 0);
        this.playerBody.body.allowGravity = false;

        this.cameras.main.shake(200, 0.01);
        this.showGameOverDialog(reason);
    }
}