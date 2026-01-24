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

        const startBtn = this.add.text(width / 2, 320,
            "▶ Run From Responsibilities",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#ff7496ff" }
        ).setOrigin(0.5).setInteractive();

        startBtn.on("pointerover", () => startBtn.setScale(1.1));
        startBtn.on("pointerout", () => startBtn.setScale(1));
        startBtn.on("pointerdown", () => {
            window.location.hash = "runner";
        });

        this.add.text(width / 2, 480,
            "\n🔒 (Coming Soon)\n\n🔒 (Coming Soon)",
            { fontSize: `${64 / this.getUIScale()}px`, color: "#777", align: "center" }
        ).setOrigin(0.5);
    }
}