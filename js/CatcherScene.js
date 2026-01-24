export default class CatcherScene extends Phaser.Scene {
    constructor() {
        super("CatcherScene");
    }

    create() {
        this.scene.bringToTop();
        if (window.location.hash !== "#catcher") {
            window.location.hash = "catcher";
        }
        const { width, height } = this.cameras.main;
        this.isMobile =
            this.sys.game.device.input.touch ||
            this.sys.game.device.os.android ||
            this.sys.game.device.os.iOS;

        /* ---------------- DEBUG ---------------- */
        this.debugGraphics = this.add.graphics();

        /* ---------------- STATE ---------------- */

        this.score = 0;
        this.moveDir = 0; // -1 left, 1 right, 0 idle
        this.lives = 3;
        this.isGameOver = false;

        /* ---------------- UI ---------------- */
        const uiScale = this.getUIScale();
        this.livesText = this.add.text(width / 2, 40, "❤️❤️❤️", {
            fontSize: `${48 / uiScale}px`,
            color: "#ffffff"
        }).setOrigin(0.5);


        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: `${48 / uiScale}px`,
            color: "#ffffff"
        });

        this.highScore = this.loadHighScore();
        if (this.highScore > -1) {
            console.log(`Loaded high score: ${this.highScore}`);
            this.highScoreText = this.add.text(
                this.cameras.main.width - 20,
                20,
                `Best: ${this.highScore}`,
                {
                    fontSize: `${48 / uiScale}px`,
                    color: "#ffffff"
                }
            )
                .setOrigin(1, 0); // top-right
        }

        /* ---------------- PLAYER ---------------- */

        this.plate = this.add.text(width / 2, height - 100, "🍽️", {
            fontSize: "64px"
        }).setOrigin(0.5);

        this.physics.add.existing(this.plate);
        this.plate.body.setImmovable(true);
        this.plate.body.setAllowGravity(false);

        /* ---------------- CAKES ---------------- */

        this.cakes = this.physics.add.group();

        this.physics.add.overlap(
            this.plate,
            this.cakes,
            this.catchCake,
            null,
            this
        );

        this.spawnTimer = this.time.addEvent({
            delay: 900,
            loop: true,
            callback: this.spawnCake,
            callbackScope: this
        });

        /* ---------------- INPUT ---------------- */

        this.keys = this.input.keyboard.addKeys({
            leftA: Phaser.Input.Keyboard.KeyCodes.A,
            rightD: Phaser.Input.Keyboard.KeyCodes.D,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });
        this.input.on("pointerdown", pointer => {
            if (this.isGameOver) return;
            const worldPoint = pointer.positionToCamera(this.cameras.main);
            this.moveDir = worldPoint.x < this.plate.x ? -1 : 1;
        });
        this.input.on("pointerup", () => {
            this.moveDir = 0;
        });

        this.bindGlobalInput();

        /* ---------------- BACK TO MENU ---------------- */

        this.input.keyboard.on("keydown-ESC", () => {
            window.location.hash = "menu";
        });
    }

    spawnCake() {
        const x = Phaser.Math.Between(160, this.scale.width - 160);

        const cake = this.add.text(x, -40, "🍰", {
            fontSize: "48px"
        }).setOrigin(0.5);

        this.physics.add.existing(cake);
        cake.body.setVelocityY(200 + this.score * 5);
        cake.body.setAllowGravity(false);

        this.cakes.add(cake);
    }

    catchCake(plate, cake) {
        cake.destroy();
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    update() {
        if (this.isGameOver) return;
        const speed = 1200;
        let dir = 0;

        if (
            this.keys.leftA.isDown ||
            this.keys.left.isDown
        ) {
            dir = -1;
        } else if (
            this.keys.rightD.isDown ||
            this.keys.right.isDown
        ) {
            dir = 1;
        } else {
            dir = this.moveDir;
        }

        this.plate.x += dir * speed * this.game.loop.delta / 1000;

        // Clamp plate inside screen
        this.plate.x = Phaser.Math.Clamp(
            this.plate.x,
            40,
            this.scale.width - 40
        );

        // Cleanup missed cakes
        this.cakes.getChildren().forEach(cake => {
            if (cake.y > this.scale.height + 50) {
                cake.destroy();
                if (this.isGameOver) return;
                this.lives--;
                if (this.lives <= 0) {
                    this.lives = 0;
                    this.livesText.setText("");
                    this.gameOver();
                } else {
                    this.livesText.setText("❤️".repeat(this.lives));
                }
            }
        });
    }


    /* ───────── Game Over ───────── */

    gameOver() {
        this.cakes.getChildren().forEach(cake => {
            cake.destroy();
        });
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.spawnTimer.remove(false);
        this.cameras.main.shake(200, 0.01);
        var newHighScore = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
            newHighScore = true;
        }
        this.showGameOverDialog(newHighScore);
    }

    showGameOverDialog(newHighScore) {
        const { centerX, centerY } = this.cameras.main;
        const uiScale = this.getUIScale();

        this.add.rectangle(centerX, centerY, 900 * uiScale, 600, 0x000000, 0.85)
            .setDepth(100);

        this.add.text(centerX, centerY - 120 * uiScale, "You dropped too much cake, better get cleaning!", {
            fontSize: `${56 / uiScale}px`,
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 800 * uiScale }
        }).setOrigin(0.5).setDepth(101);

        if (newHighScore) {
            this.add.text(
                centerX,
                centerY + 40 * this.getUIScale(),
                "🎉 New High Score!",
                {
                    fontSize: `${40 / this.getUIScale()}px`,
                    color: "#ffd700"
                }
            )
                .setOrigin(0.5)
                .setDepth(101);
        }

        this.add.text(centerX, centerY + 120 * uiScale, "↻ Tap here or press SPACE to restart", {
            fontSize: `${48 / uiScale}px`,
            color: "#ff7496ff"
        }).setOrigin(0.5).setDepth(101).setInteractive().on("pointerdown", () => {
            this.scene.restart();
        });

        this.add.text(centerX, centerY + 200 * uiScale, "< Back to menu", {
            fontSize: `${48 / uiScale}px`,
            color: "#ff7496ff"
        }).setOrigin(0.5).setDepth(101).setInteractive().on("pointerdown", () => {
            window.location.hash = "menu";
        });

        const restart = () => this.scene.restart();
        // this.input.once("pointerdown", restart);
        this.input.keyboard.once("keydown-SPACE", restart);
    }

    getUIScale() {
        const cam = this.cameras.main;
        return Math.min(
            cam.width / 1600,
            cam.height / 900
        );
    }

    loadHighScore() {
        try {
            return Number(localStorage.getItem("highScore_catcher")) || -1;
        } catch {
            return -1;
        }
    }

    saveHighScore(score) {
        try {
            localStorage.setItem("highScore_catcher", score);
        } catch {
            // storage might be disabled — fail silently
        }
    }

    bindGlobalInput() {
        const canvas = this.game.canvas;
        const scale = this.scale;

        this.domPointerDown = e => {
            if (this.isGameOver) return;

            // Canvas position in page
            const rect = canvas.getBoundingClientRect();

            // DOM → canvas coordinates
            const canvasX = e.clientX - rect.left;

            // Canvas → world coordinates
            const worldX = canvasX / scale.displayScale.x;

            this.moveDir = worldX < this.plate.x ? -1 : 1;
        };

        this.domPointerUp = () => {
            this.moveDir = 0;
        };

        document.addEventListener("pointerdown", this.domPointerDown);
        document.addEventListener("pointerup", this.domPointerUp);
    }

    shutdown() {
        document.removeEventListener("pointerdown", this.domPointerDown);
        document.removeEventListener("pointerup", this.domPointerUp);
    }
}