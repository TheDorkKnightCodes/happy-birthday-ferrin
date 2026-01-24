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
        console.log("MenuScene loaded");
        console.log(`UIScale: ${this.getUIScale()}`);
        const { width, height } = this.scale;

        this.add.text(width / 2, 100, "🎂 FERRIN'S ARCADE 🎂", {
            fontSize: `${72 / this.getUIScale()}px`,
            color: "#ffffff"
        }).setOrigin(0.5);

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
}