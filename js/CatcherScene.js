export default class CatcherScene extends Phaser.Scene {
    constructor() {
        super("CatcherScene");
    }

    preload() {
        this.load.image("model", "resources/png/model_arms_up.png");
        this.load.image("background", "resources/png/ocean_and_islands_night.png");
        this.load.audio("watchthisaudio", ["resources/ogg/watchthis.ogg", "resources/mp3/watchthis.mp3"]);
        this.load.audio("ohoknvm", ["resources/ogg/ohoknvm.ogg", "resources/mp3/ohoknvm.mp3"]);
        this.load.audio("partofmyplan", ["resources/ogg/partofmyplan.ogg", "resources/mp3/partofmyplan.mp3"]);
        this.load.audio("collect", ["resources/wav/collect_2.wav"]);
        this.load.audio("hit", ["resources/wav/Hit4.wav"]);
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
        this.gameStarted = false;
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


        this.add.image(0, 0, "background")
            .setOrigin(0, 0)
            .setDepth(-1)
            .setDisplaySize(width, height);

        /* --------------- Audio --------------- */
        this.sound.volume = 0.8;
        this.sound.add("watchthisaudio");
        this.sound.add("partofmyplan");
        this.gameoversounds = ["partofmyplan"];

        /* ---------------- PLAYER ---------------- */
        // Plate (gameplay body)
        const plate = this.add.text(0, 0, "🍽️", {
            fontSize: "64px"
        }).setOrigin(0.5);

        // Human model (visual only)
        const model = this.add.image(0, 0, "model")
            .setOrigin(0.5, 0).setScale(0.8);

        // Offset model downward so hands touch plate
        model.y = plate.height / 2 - 24;

        this.player = this.add.container(
            this.scale.width / 2,
            this.scale.height - 100,
            [plate, model]
        );

        this.plate = plate;
        this.physics.add.existing(this.plate);
        this.plate.body.setImmovable(true);
        this.plate.body.setAllowGravity(false);

        this.tweens.add({
            targets: model,
            y: model.y + 12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

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
            this.moveDir = worldPoint.x < this.player.x ? -1 : 1;
        });
        this.input.on("pointerup", () => {
            this.moveDir = 0;
        });

        this.bindGlobalInput();
        this.showIntroOverlay();
    }

    spawnCake() {
        if (!this.gameStarted || this.isGameOver) return;

        const x = Phaser.Math.Between(200, this.scale.width - 200);

        const cake = this.add.text(x, -40, "🍰", {
            fontSize: "48px"
        }).setOrigin(0.5);

        this.physics.add.existing(cake);
        cake.body.setVelocityY(200 + this.score * 5);
        cake.body.setAllowGravity(false);

        this.cakes.add(cake);
    }

    catchCake(plate, cake) {
        this.sound.play("collect");
        cake.destroy();
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    update() {
        if (!this.gameStarted || this.isGameOver) return;
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

        this.player.x += dir * speed * this.game.loop.delta / 1000;

        // Clamp plate inside screen
        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            40,
            this.scale.width - 40
        );

        // Cleanup missed cakes
        this.cakes.getChildren().forEach(cake => {
            if (cake.y > this.scale.height + 50) {
                this.sound.play("hit");
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
        if (this.isGameOver) return;
        this.cakes.getChildren().forEach(cake => {
            cake.destroy();
        });
        this.isGameOver = true;
        this.tweens.killAll();

        this.sound.play(Phaser.Utils.Array.GetRandom(this.gameoversounds));

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

        this.add.rectangle(centerX, centerY, 1000 * uiScale, 600, 0x000000, 0.75)
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

        this.add.text(centerX, centerY + 120 * uiScale, "↻ Tap here or SPACE to retry", {
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

    showIntroOverlay() {
        const { centerX, centerY, width, height } = this.cameras.main;
        const uiScale = this.getUIScale();

        this.introOverlay = this.add.container(0, 0).setDepth(200);

        const bg = this.add.rectangle(
            centerX,
            centerY,
            width,
            height,
            0x000000,
            0.75
        );

        const body = this.add.text(
            centerX,
            centerY - 40 * uiScale,
            "Catch the falling cake.\n\n" +
            "⬅️➡️ Move the plate with arrow keys or A/D\n" +
            "📱 Tap left/right on mobile\n" +
            "🍰 Each miss costs a heart\n" +
            "❤️ Lose 3 hearts and it’s over",
            {
                fontSize: `${36 / uiScale}px`,
                color: "#ffffff",
                align: "center",
                lineSpacing: 12,
                wordWrap: { width: 900 * uiScale }
            }
        ).setOrigin(0.5);

        const hint = this.add.text(
            centerX,
            centerY + 200 * uiScale,
            "Tap / Click / Press SPACE to start",
            {
                fontSize: `${32 / uiScale}px`,
                color: "#ff7496"
            }
        ).setOrigin(0.5);

        this.introOverlay.add([bg, body, hint]);

        this.tweens.add({
            targets: hint,
            alpha: { from: 0.5, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        const startHandler = () => {
            if (this.gameStarted) return;
            this.startGame();
        };

        this.input.once("pointerdown", startHandler);
        this.input.keyboard.once("keydown-SPACE", startHandler);
    }

    startGame() {
        this.gameStarted = true;
        this.introOverlay?.destroy();

        if (this.sound.get("watchthisaudio") && !this.sound.get("watchthisaudio").isPlaying) {
            this.sound.play("watchthisaudio");
        }
    }


    getUIScale() {
        const cam = this.cameras.main;
        return Math.min(
            cam.width / 1200,
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
        // Disable browser context menu everywhere
        document.addEventListener("contextmenu", e => e.preventDefault());
        this.domPointerDown = e => {
            if (this.isGameOver) return;
            const pointerX = e.clientX;
            // Convert to game world coordinates
            const rect = this.game.canvas.getBoundingClientRect();
            const scaleX = this.game.config.width / rect.width;
            const worldX = (pointerX - rect.left) * scaleX;
            this.moveDir = worldX < this.player.x ? -1 : 1;
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