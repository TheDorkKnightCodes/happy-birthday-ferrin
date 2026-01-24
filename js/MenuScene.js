export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    getUIScale() {
        const cam = this.cameras.main;
        return Math.min(
            cam.width / 1600,
            cam.height / 900
        );
    }

    create() {
        this.scene.bringToTop();
        if (window.location.hash !== "#menu") {
            window.location.hash = "menu";
        }
        this.messageShown = false;
        console.log("MenuScene loaded");
        console.log(`UIScale: ${this.getUIScale()}`);
        const { width, height } = this.scale;

        this.add.text(width / 2, 100, "🎂 FERRIN'S ARCADE 🎂", {
            fontSize: `${72 / this.getUIScale()}px`,
            color: "#ffffff"
        }).setOrigin(0.5).setInteractive().on("pointerdown", () => {
            this.showMessageDialog();
        });

        const runnerBtn = this.add.text(width / 2, 320,
            "▶ Responsibility Runner",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#ff7496ff" }
        ).setOrigin(0.5).setInteractive();
        runnerBtn.on("pointerover", () => runnerBtn.setScale(1.1));
        runnerBtn.on("pointerout", () => runnerBtn.setScale(1));
        runnerBtn.on("pointerdown", () => {
            window.location.hash = "runner";
        });

        const catcherBtn = this.add.text(width / 2, 420,
            "▶ Cake Catcher",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#ff7496ff" }
        ).setOrigin(0.5).setInteractive();
        catcherBtn.on("pointerover", () => catcherBtn.setScale(1.1));
        catcherBtn.on("pointerout", () => catcherBtn.setScale(1));
        catcherBtn.on("pointerdown", () => {
            window.location.hash = "catcher";
        });

        this.add.text(width / 2, 520,
            "\n🔒 (Coming Soon)\n",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#777", align: "center" }
        ).setOrigin(0.5);
    }

    showMessageDialog() {
        if (this.messageShown) return;
        this.messageShown = true;
        const { centerX, centerY } = this.cameras.main;
        const uiScale = this.getUIScale();

        // Darken background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.85)
            .setOrigin(0)
            .setDepth(100);

        this.add.text(centerX, centerY, `Happy Birthday Ferrin! 🥳

I am so grateful to have met you this year, and to have had the chance to call you my friend.
Hope you have an amazing birthday and an even better year ahead!

I don't know what else to write, I didn't even know how to wish you, especially after you told me that you did not want me to make a big deal out of it by involving others. But after all this time waiting for you to come back, I still wanted to do something special for you, so I decided to create this website for you. I don't have a lot of experience making web-based games so I know the games are pretty bad and I don't expect you to play them again after today, but I hope you at least have some fun trying them out.

With best wishes,
Sam
`, {
            fontSize: `${42 / uiScale}px`,
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 1440 * uiScale }
        }).setOrigin(0.5).setDepth(101).setInteractive().on("pointerdown", () => {
            this.scene.restart();
        });

    }
}