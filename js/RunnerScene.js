// RunnerScene.js
const DEBUG_HITBOXES = true;

const TARGET_WIDTH = 40;
const TARGET_HEIGHT = 108;
const IMG_WIDTH = 184;
const IMG_HEIGHT = 480;
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
        yOffset: - (TARGET_HEIGHT * CROUCH_FACTOR * 1.2),
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
        const { width, height } = this.cameras.main;
        this.isMobile =
            this.sys.game.device.input.touch ||
            this.sys.game.device.os.android ||
            this.sys.game.device.os.iOS;

        /* ───────── Debug ───────── */
        this.debugGraphics = this.add.graphics();

        /* ───────── Game State ───────── */
        this.baseSpeed = 600;
        this.speed = this.baseSpeed;
        this.age = 18;
        this.ageTimer = 0;
        this.isGameOver = false;
        this.isDucking = false;

        /* ───────── Ground ───────── */
        this.groundHeight = 40;

        this.ground = this.add
            .rectangle(0, height - this.groundHeight, width * 2, this.groundHeight, 0x444444)
            .setOrigin(0, 0);

        this.physics.add.existing(this.ground, true);

        /* ───────── Player Physics ───────── */
        this.playerBody = this.physics.add
            .sprite(120, height - this.groundHeight, null)
            .setOrigin(0.5, 1);

        this.playerBody.body.setSize(TARGET_WIDTH, TARGET_HEIGHT);
        this.playerBody.body.setCollideWorldBounds(true);
        this.playerBody.setVisible(false);
        // AFTER size is set
        this.playerBody.body.setSize(TARGET_WIDTH, TARGET_HEIGHT);

        // 🔑 snap body so its bottom sits on ground
        this.playerBody.y = height - this.groundHeight - TARGET_HEIGHT / 2;
        this.playerBody.body.y = this.playerBody.y - TARGET_HEIGHT;
        this.playerBody.body.updateFromGameObject();

        this.physics.add.collider(this.playerBody, this.ground);

        /* ───────── Player Visual ───────── */
        this.player = this.add.image(0, 0, "player")
            .setOrigin(0.5, 0.65);

        this.player.baseScaleX = TARGET_WIDTH / IMG_WIDTH;
        this.player.baseScaleY = TARGET_HEIGHT / IMG_HEIGHT;
        this.player.setScale(this.player.baseScaleX, this.player.baseScaleY);

        /* ───────── Obstacles ───────── */
        this.obstacleTexts = [];

        /* ───────── Input Setup ───────── */
        this.setupInput();

        /* ───────── UI ───────── */
        this.ageText = this.add.text(20, 20, "Age: 18", {
            fontSize: "18px",
            color: "#ffffff"
        });

        /* ───────── Spawner ───────── */
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.events.once("shutdown", this.shutdown, this);
        this.events.once("destroy", this.shutdown, this);
    }

    /* ───────── Input ───────── */

    setupInput() {
        // Disable browser context menu everywhere
        document.addEventListener("contextmenu", e => e.preventDefault());

        const kb = this.input.keyboard;

        kb.on("keydown-SPACE", this.jump, this);
        kb.on("keydown-UP", this.jump, this);
        kb.on("keydown-W", this.jump, this);

        kb.on("keydown-DOWN", this.startDuck, this);
        kb.on("keydown-S", this.startDuck, this);
        kb.on("keydown-CTRL", this.startDuck, this);

        kb.on("keyup-DOWN", this.endDuck, this);
        kb.on("keyup-S", this.endDuck, this);
        kb.on("keyup-CTRL", this.endDuck, this);

        // Phaser canvas input (still works)
        this.input.on("pointerdown", p => this.handlePointerDown(p));
        this.input.on("pointerup", () => this.endDuck());

        // 🌍 GLOBAL INPUT (outside canvas)
        this.domPointerDown = e => {
            if (this.isGameOver) {
                this.scene.restart();
                return;
            };

            if (this.isMobile) {
                const midX = window.innerWidth / 2;
                e.clientX < midX ? this.startDuck() : this.jump();
            } else {
                e.button === 2 ? this.startDuck() : this.jump();
            }
        };

        this.domPointerUp = () => this.endDuck();

        document.addEventListener("pointerdown", this.domPointerDown);
        document.addEventListener("pointerup", this.domPointerUp);
    }

    /* ───────── Controls ───────── */

    jump() {
        if (this.isGameOver) return;

        if (this.playerBody.body.blocked.down) {
            this.playerBody.setVelocityY(-500);
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
        this.player.setOrigin(0.5, 0.8);
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
        this.player.setOrigin(0.5, 0.65);
        this.playerBody.body.setSize(
            TARGET_WIDTH,
            TARGET_HEIGHT
        );
        if (this.playerBody.body.y + TARGET_HEIGHT > this.cameras.main.height - this.groundHeight) {
            this.player.y -= TARGET_HEIGHT * (1 - CROUCH_FACTOR);
            this.playerBody.y -= TARGET_HEIGHT * (1 - CROUCH_FACTOR);
        }
    }

    /* ───────── Obstacles ───────── */

    spawnObstacle() {
        if (this.isGameOver) return;

        const width = this.cameras.main.width;
        const y = this.ground.y;

        const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);

        const obstacle = this.add.text(
            width + 50,
            y + (type.yOffset || 0),
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

    /* ───────── Update ───────── */

    update(_, delta) {
        if (this.isGameOver) return;

        // Feet-locked sync
        this.player.x = this.playerBody.x;
        this.player.y = this.playerBody.y;

        if (DEBUG_HITBOXES) {
            this.debugGraphics.clear().lineStyle(1, 0xff0000);
            const b = this.playerBody.body;
            this.debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
        }

        this.obstacleTexts.forEach(obstacle => {
            const hb = obstacle.type.hitbox;
            const bounds = obstacle.getBounds();

            const obstacleBounds = new Phaser.Geom.Rectangle(
                bounds.centerX - hb.width / 2,
                bounds.centerY - hb.height / 2,
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
        if (this.ageTimer > 5000) {
            this.age++;
            this.speed += this.baseSpeed * 0.1;
            this.ageTimer = 0;
            this.ageText.setText(`Age: ${this.age}`);
        }
    }

    /* ───────── Game Over ───────── */

    gameOver(reason = "Life happened.") {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.spawnTimer.remove(false);
        this.tweens.killAll();

        this.playerBody.setVelocity(0, 0);
        this.playerBody.body.allowGravity = false;

        this.cameras.main.shake(200, 0.01);
        this.showGameOverDialog(reason);
    }

    showGameOverDialog(reason) {
        const { centerX, centerY } = this.cameras.main;

        this.add.rectangle(centerX, centerY, 360, 180, 0x000000, 0.85)
            .setDepth(100);

        this.add.text(centerX, centerY - 30, reason, {
            fontSize: "18px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 320 }
        }).setOrigin(0.5).setDepth(101);

        this.add.text(centerX, centerY + 10, `You survived until age ${this.age}.`, {
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101);

        this.add.text(centerX, centerY + 45, "Tap or press SPACE to retry", {
            fontSize: "14px",
            color: "#aaaaaa"
        }).setOrigin(0.5).setDepth(101);

        const restart = () => this.scene.restart();
        this.input.once("pointerdown", restart);
        this.input.keyboard.once("keydown-SPACE", restart);
    }

    shutdown() {
        document.removeEventListener("pointerdown", this.domPointerDown);
        document.removeEventListener("pointerup", this.domPointerUp);
    }
}