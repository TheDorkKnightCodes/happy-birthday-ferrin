const DEBUG_HITBOXES = false;

export default class InboxScene extends Phaser.Scene {
    constructor() {
        super("InboxScene");
    }

    preload() {
        this.load.image("background", "resources/png/ocean_and_islands_night.png");
        this.load.audio("watchthisaudio", ["resources/ogg/watchthis.ogg", "resources/mp3/watchthis.mp3"]);
        this.load.audio("partofmyplan", ["resources/ogg/partofmyplan.ogg", "resources/mp3/partofmyplan.mp3"]);
        this.load.audio("collect", ["resources/wav/collect_2.wav"]);
        this.load.audio("hit", ["resources/wav/Hit4.wav"]);
    }

    create() {
        this.scene.bringToTop();
        if (window.location.hash !== "#inbox") {
            window.location.hash = "inbox";
        }

        if (DEBUG_HITBOXES) {
            this.debugGraphics = this.add.graphics().setDepth(999);
        }

        const { width, height } = this.cameras.main;
        this.gameStarted = false;
        this.isGameOver = false;
        this.score = 0;
        this.misses = 0;
        this.maxMisses = 3;
        this.spawnDelay = 1000;         // base
        this.minSpawnDelay = 300;       // hard cap
        this.spawnAcceleration = 20;    // ms reduction per level
        this.difficultyLevel = 0;
        this.multiSpawnChance = 0.1;    // 15% chance to spawn extra
        this.maxMultiSpawn = 3;         // max extra spawns


        /* ---------- Background ---------- */
        this.add.image(0, 0, "background")
            .setOrigin(0, 0)
            .setDisplaySize(width, height)
            .setDepth(-1);

        /* ---------- Audio ---------- */
        this.sound.volume = 0.8;
        this.sound.add("watchthisaudio");
        this.sound.add("partofmyplan");
        this.sound.add("collect");
        this.sound.add("hit");

        /* ---------- UI ---------- */
        const uiScale = this.getUIScale();

        this.scoreText = this.add.text(20, 20, "Cleared: 0", {
            fontSize: `${48 / uiScale}px`,
            color: "#ffffff"
        });

        this.missText = this.add.text(
            width / 2,
            20,
            "❤️❤️❤️",
            { fontSize: `${48 / uiScale}px`, color: "#ffffff" }
        ).setOrigin(0.5, 0);

        this.highScore = this.loadHighScore();
        if (this.highScore > -1) {
            this.highScoreText = this.add.text(
                width - 20,
                20,
                `Best: ${this.highScore}`,
                {
                    fontSize: `${48 / uiScale}px`,
                    color: "#ffffff"
                }
            ).setOrigin(1, 0);
        }

        /* ---------- Emails ---------- */
        this.emails = [];

        this.EMAIL_TYPES = [
            { emoji: "📧", label: "Unread email" },
            { emoji: "📎", label: "See attached" },
            { emoji: "📆", label: "Meeting moved" },
            { emoji: "💬", label: "Quick question" },

            // Priority
            {
                emoji: "⚠️",
                label: "URGENT",
                priority: true,
                color: "#ff7c7cff"
            }
        ];

        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            loop: true,
            callback: () => {
                this.spawnEmailWave();
            }
        });


        /* ---------- Global Input ---------- */
        this.bindGlobalInput();

        this.events.once("shutdown", this.shutdown, this);
        this.events.once("destroy", this.shutdown, this);

        this.showIntroOverlay();
    }

    spawnEmail() {
        if (!this.gameStarted || this.isGameOver) return;

        const { width, height } = this.cameras.main;
        const type = Phaser.Utils.Array.GetRandom(this.EMAIL_TYPES);

        const x = Phaser.Math.Between(100, width - 100);
        const y = Phaser.Math.Between(140, height - 140);

        const icon = this.add.text(0, 0, type.emoji, {
            fontSize: "72px",
            padding: { top: 12 }
        }).setOrigin(0.5);

        const label = this.add.text(0, 56, type.label, {
            fontSize: "20px",
            color: type.color || "#ffffff",
            align: "center",
            wordWrap: { width: 140 }
        }).setOrigin(0.5, 0);

        // HARD disable child input
        icon.input = null;
        label.input = null;

        const email = this.add.container(x, y);
        email.add([icon, label]);

        email
            .setSize(160, 140)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        email.spawnTime = this.time.now;
        const difficultyFactor = Math.min(0.6, this.score * 0.02);

        const baseLife = type.priority ? 1400 : 2600;
        const adjustedLife = baseLife * (1 - difficultyFactor);

        email.lifespan = Phaser.Math.Between(
            adjustedLife,
            adjustedLife + 600
        );


        email.on("pointerdown", () => {
            if (this.isGameOver) return;
            this.sound.play("collect");
            email.destroy();
            this.emails = this.emails.filter(e => e !== email);
            this.score++;
            this.scoreText.setText(`Cleared: ${this.score}`);
        });

        if (type.priority) {
            this.tweens.add({
                targets: email,
                angle: { from: -4, to: 4 },
                duration: 120,
                yoyo: true,
                repeat: -1
            });
        }

        this.tweens.add({
            targets: email,
            y: y + 6,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });

        this.emails.push(email);
    }

    spawnEmailWave() {
        if (!this.gameStarted || this.isGameOver) return;

        // Always spawn at least one
        this.spawnEmail();

        // Chance to spawn extra emails
        if (Math.random() < this.multiSpawnChance) {
            const extra = Phaser.Math.Between(1, this.maxMultiSpawn - 1);
            for (let i = 0; i < extra; i++) {
                // slight stagger so they don't overlap perfectly
                this.time.delayedCall(i * 80, () => this.spawnEmail());
            }
        }
    }

    update(time) {
        if (!this.gameStarted || this.isGameOver) return;
        if (DEBUG_HITBOXES) {
            this.debugGraphics.clear().lineStyle(2, 0xff0000);
            this.emails.forEach(email => {
                const bounds = email.getBounds();
                this.debugGraphics.strokeRect(
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                );
            });
        }

        this.emails.forEach(email => {
            if (time - email.spawnTime > email.lifespan) {
                this.sound.play("hit");
                email.destroy();
                this.misses++;
                this.emails = this.emails.filter(e => e !== email);
                this.missText.setText("❤️".repeat(this.maxMisses - this.misses));

                if (this.misses >= this.maxMisses) {
                    this.gameOver();
                }
            }
        });

        if (this.highScoreText) {
            this.highScoreText.x = this.cameras.main.width - 20;
        }

        // Difficulty scaling based on score
        const targetLevel = Math.floor(this.score / 6);

        if (targetLevel > this.difficultyLevel) {
            this.difficultyLevel = targetLevel;

            this.spawnDelay = Math.max(
                this.minSpawnDelay,
                this.spawnDelay - this.spawnAcceleration
            );

            // Make multi-spawns more likely (cap it)
            this.multiSpawnChance = Math.min(0.45, this.multiSpawnChance + 0.03);

            // Apply new delay
            this.spawnTimer.reset({
                delay: this.spawnDelay,
                loop: true,
                callback: () => this.spawnEmailWave()
            });
        }

    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.gameStarted = false;

        if (DEBUG_HITBOXES) {
            this.debugGraphics.clear();
        }

        this.tweens.killAll();

        this.spawnTimer.remove(false);
        this.emails.forEach(e => e.destroy());
        this.emails = [];

        this.sound.play("partofmyplan");
        this.cameras.main.shake(200, 0.01);

        let newHighScore = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
            newHighScore = true;
        }

        this.showGameOverDialog(newHighScore);
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
            "Clear emails before your inbox overflows.\n\n" +
            "🖱️ Click / Tap emails to clear them\n" +
            "⚠️ Priority emails expire faster\n" +
            "❤️ Miss 3 emails and it's over",
            {
                fontSize: `${42 / uiScale}px`,
                color: "#ffffff",
                align: "center",
                lineSpacing: 12,
                wordWrap: { width: 1100 * uiScale }
            }
        ).setOrigin(0.5);

        const hint = this.add.text(
            centerX,
            centerY + 200 * uiScale,
            "Tap / Click / Press SPACE to start",
            {
                fontSize: `${40 / uiScale}px`,
                color: "#ff7496"
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: hint,
            alpha: { from: 0.5, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.introOverlay.add([bg, body, hint]);

        // Start game on first input
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
        this.introOverlay = null;

        if (this.sound.get("watchthisaudio") && !this.sound.get("watchthisaudio").isPlaying) {
            this.sound.play("watchthisaudio");
        }
    }


    showGameOverDialog(newHighScore) {
        const { centerX, centerY } = this.cameras.main;
        const uiScale = this.getUIScale();

        this.add.rectangle(centerX, centerY, 1000 * uiScale, 600, 0x000000, 0.75)
            .setDepth(100);

        this.add.text(centerX, centerY - 120 * uiScale,
            "Your inbox spiraled out of control.",
            {
                fontSize: `${56 / uiScale}px`,
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 800 * uiScale }
            }
        ).setOrigin(0.5).setDepth(101);

        if (newHighScore) {
            this.add.text(
                centerX,
                centerY + 40 * uiScale,
                "🎉 New High Score!",
                {
                    fontSize: `${40 / uiScale}px`,
                    color: "#ffd700"
                }
            ).setOrigin(0.5).setDepth(101);
        }

        this.add.text(centerX, centerY + 120 * uiScale,
            "↻ Tap here or SPACE to retry",
            {
                fontSize: `${48 / uiScale}px`,
                color: "#ff7496ff"
            }
        ).setOrigin(0.5).setDepth(101)
            .setInteractive()
            .on("pointerdown", () => this.scene.restart());

        this.add.text(centerX, centerY + 200 * uiScale,
            "< Back to menu",
            {
                fontSize: `${48 / uiScale}px`,
                color: "#ff7496ff"
            }
        ).setOrigin(0.5).setDepth(101)
            .setInteractive()
            .on("pointerdown", () => {
                window.location.hash = "menu";
            });

        this.input.keyboard.once("keydown-SPACE", () => this.scene.restart());
    }

    bindGlobalInput() {
        document.addEventListener("contextmenu", e => e.preventDefault());
    }

    shutdown() {
        document.removeEventListener("contextmenu", e => e.preventDefault());
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
            return Number(localStorage.getItem("highScore_inbox")) || -1;
        } catch {
            return -1;
        }
    }

    saveHighScore(score) {
        try {
            localStorage.setItem("highScore_inbox", score);
        } catch {
            // fail silently
        }
    }
}
