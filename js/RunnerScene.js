// RunnerScene.js
const DEBUG_HITBOXES = false;

const OBSTACLE_TYPES = [
    {
        emoji: "⏰",
        hitbox: { width: 38, height: 38 },
        yOffset: 0,
        messages: [
            "You slept through the alarm.",
            "Snooze betrayed you.",
            "Five more minutes was a lie."
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
            "Time management: not your forte."
        ]
    },
    {
        emoji: "📉",
        hitbox: { width: 44, height: 44 },
        yOffset: -36,
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
           Player
        ────────────── */
        this.player = this.add.rectangle(
            120,
            height - this.groundHeight - 30,
            40,
            60,
            0x00ffcc
        );

        this.physics.add.existing(this.player);

        // Physics body NEVER changes
        this.player.body.setSize(40, 60);
        this.player.body.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, this.ground);

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

        if (this.player.body.blocked.down) {
            this.player.body.setVelocityY(-500);
        }
    }

    startDuck() {
        if (this.isGameOver || this.isDucking) return;

        this.isDucking = true;

        // Visual only — physics body unchanged
        this.player.setScale(1, 0.55);
        this.player.y += 13;
    }

    endDuck() {
        if (!this.isDucking) return;

        this.isDucking = false;

        this.player.setScale(1, 1);
        this.player.y -= 13;
    }

    /* ──────────────
       Obstacles
    ────────────── */

    spawnObstacle() {
        if (this.isGameOver) return;

        const width = this.cameras.main.width;
        const groundTop = this.ground.y;

        const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);

        // Base Y position
        let y = groundTop;

        // Duck obstacles float higher
        if (type.requiresDuck) {
            y -= 60;
        }

        // Per-obstacle fine tuning
        y += type.yOffset || 0;

        const obstacle = this.add.text(
            width + 50,
            y,
            type.emoji,
            { fontSize: "48px" }
        )
            .setOrigin(0.5, type.requiresDuck ? 0 : 1)
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

        // Clear previous debug drawings
        if (DEBUG_HITBOXES) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(1, 0xff0000);
        }

        const playerBounds = this.player.getBounds();

        // Player hitbox
        if (DEBUG_HITBOXES) {
            this.debugGraphics.strokeRectShape(playerBounds);
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

            // Obstacle hitbox
            if (DEBUG_HITBOXES) {
                this.debugGraphics.strokeRectShape(obstacleBounds);
            }

            if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                    playerBounds,
                    obstacleBounds
                )
            ) {
                this.gameOver(
                    Phaser.Utils.Array.GetRandom(obstacle.type.messages)
                );
            }
        });

        // ── Age & speed progression ──
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

        const retry = this.add.text(cx, cy + 40, "Press SPACE to retry", {
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
        // Stop spawner & tweens immediately
        this.spawnTimer.remove(false);
        this.tweens.killAll();
        // Freeze player
        this.player.body.setVelocity(0, 0);
        this.player.body.allowGravity = false;
        this.cameras.main.shake(200, 0.01);
        this.showGameOverDialog(reason);
    }
}