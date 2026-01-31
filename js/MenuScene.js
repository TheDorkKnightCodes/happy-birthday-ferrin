export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    getUIScale() {
        const cam = this.cameras.main;
        return Math.min(
            cam.width / 1200,
            cam.height / 900
        );
    }

    preload() {
        this.load.audio("bgm", ["./resources/mp3/Outro.mp3"]);
        this.load.audio("collect", ["./resources/wav/collect_2.wav"]);
    }

    create() {
        this.scene.bringToTop();
        if (window.location.hash !== "#menu") {
            window.location.hash = "menu";
        }
        /* _________ Audio _________ */
        this.sound.volume = 0.8;
        this.sound.add("collect");

        if (!this.sound.get('bgm')) {
            this.bgm = this.sound.add('bgm', {
                loop: true,
                volume: 0.04
            });
            this.bgm.pauseOnBlur = true;
            if (!this.bgm.isPlaying) {
                this.bgm.play();
            }
        }

        /* ───────── Menu Text ───────── */
        this.messageShown = false;
        console.log("MenuScene loaded");
        console.log(`UIScale: ${this.getUIScale()}`);
        const { width, height } = this.scale;

        // Mute button for all sounds
        const muteBtn = this.add.text(width - 20, 20, "🔊",
            { fontSize: `${40 / this.getUIScale()}px`, color: "#ffffff", padding: { x: 10, y: 10 } }
        ).setOrigin(1, 0).setInteractive().on("pointerdown", () => {
            if (this.sound.mute) {
                this.sound.mute = false;
                muteBtn.setText("🔊");
            } else {
                this.sound.mute = true;
                muteBtn.setText("🔇");
            }
        });
        if (this.sound.mute) {
            muteBtn.setText("🔇");
        }
        muteBtn.on("pointerover", () => muteBtn.setStyle({ color: "#ff7496ff" }));
        muteBtn.on("pointerout", () => muteBtn.setStyle({ color: "#ffffff" }));

        this.add.text(width / 2, 160, "🎂 FERRIN'S ARCADE 🎂", {
            fontSize: `${72 / this.getUIScale()}px`,
            color: "#ffffff"
        }).setOrigin(0.5).setInteractive().on("pointerdown", () => {
            this.showMessageDialog();
        });

        const runnerBtn = this.add.text(width / 2, 380,
            "▶ Responsibility Runner",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#ff7496ff" }
        ).setOrigin(0.5).setInteractive();
        runnerBtn.on("pointerover", () => runnerBtn.setScale(1.1));
        runnerBtn.on("pointerout", () => runnerBtn.setScale(1));
        runnerBtn.on("pointerdown", () => {
            if ((this.sound.get("collect") && !this.sound.get("collect").isPlaying)) {
                this.sound.play("collect");
            }
            window.location.hash = "runner";
        });

        const catcherBtn = this.add.text(width / 2, 480,
            "▶ Cake Catcher",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#ff7496ff" }
        ).setOrigin(0.5).setInteractive();
        catcherBtn.on("pointerover", () => catcherBtn.setScale(1.1));
        catcherBtn.on("pointerout", () => catcherBtn.setScale(1));
        catcherBtn.on("pointerdown", () => {
            if ((this.sound.get("collect") && !this.sound.get("collect").isPlaying)) {
                this.sound.play("collect");
            }
            window.location.hash = "catcher";
        });

        const inboxBtn = this.add.text(
            width / 2, 580,
            "▶ Inbox Invasion",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#ff7496ff" }
        )
            .setOrigin(0.5)
            .setInteractive();

        inboxBtn.on("pointerover", () => inboxBtn.setScale(1.1));
        inboxBtn.on("pointerout", () => inboxBtn.setScale(1));
        inboxBtn.on("pointerdown", () => {
            if ((this.sound.get("collect") && !this.sound.get("collect").isPlaying)) {
                this.sound.play("collect");
            }
            window.location.hash = "inbox";
        });


        // this.add.text(width / 2, 660,
        //     "\n🔒 (Coming soon..?)\n",
        //     { fontSize: `${64 / this.getUIScale()}px`, color: "#777", align: "center" }
        // ).setOrigin(0.5);
    }

    showMessageDialog() {
        if (this.messageShown) return;
        this.messageShown = true;
        const { centerX, centerY } = this.cameras.main;
        const uiScale = this.getUIScale();

        // Darken background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.90)
            .setOrigin(0)
            .setDepth(100);

        const audio = new Audio("./resources/mp3/wishes.mp3");
        const listenBtn = this.add.text(40, 20, "Listen 🔉", {
            fontSize: `${40 / uiScale}px`,
            color: "#ffffff",
            align: "center",
            padding: { x: 10, y: 10 },
            backgroundColor: "#303030ff",
            wordWrap: { width: 1440 * uiScale }
        }).setOrigin(0, 0).setDepth(101).setInteractive().on("pointerdown", () => {
            if (audio.paused) {
                this.bgm.volume = 0.01;
                audio.play();
                listenBtn.setText("Pause ⏸️");
            } else {
                audio.pause();
                this.bgm.volume = 0.04;
                listenBtn.setText("Resume ▶️");
            }
        });
        listenBtn.on("pointerover", () => listenBtn.setStyle({ backgroundColor: "#424242ff" }));
        listenBtn.on("pointerout", () => listenBtn.setStyle({ backgroundColor: "#303030ff" }));
        audio.onended = () => {
            listenBtn.setText("Listen 🔉");
            this.bgm.volume = 0.04;
        };

        this.add.text(centerX, centerY, `Happy Birthday Ferrin! 🥳

I am so grateful to have met you this year, and to have had the chance to call you my friend.
Hope you have an amazing birthday and an even better year ahead!

I don't know what else to write, I didn't even know how to wish you, especially after you told me that you did not want me to make a big deal out of it by involving others. But after all this time waiting for you to come back, I still wanted to do something special for you, so I decided to create this website for you. I don't have a lot of experience making web-based games so I know the games are pretty bad and I don't expect you to play them again after today, but I hope you at least have some fun trying them out.

With best wishes,
Sam
`, {
            fontSize: `${38 / uiScale}px`,
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 1160 * uiScale }
        }).setOrigin(0.5, 0.45).setDepth(101).setInteractive().on("pointerdown", () => {
            if (audio && !audio.paused) {
                audio.pause();
            }
            this.scene.restart();
        });

    }
}