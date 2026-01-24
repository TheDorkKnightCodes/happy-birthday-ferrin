export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    getUIScale() {
        const cam = this.cameras.main;
        return Math.min(
            cam.width / 800,
            cam.height / 450
        );
    }

    create() {
        console.log("MenuScene loaded");
        console.log(`UIScale: ${this.getUIScale()}`);
        const { width, height } = this.scale;

        this.add.text(width / 2, 100, "🎂 BIRTHDAY ARCADE 🎂", {
            fontSize: `${96 / this.getUIScale()}px`,
            color: "#ffffff"
        }).setOrigin(0.5);

        const startBtn = this.add.text(width / 2, 320,
            "▶ Run From Responsibilities",
            { fontSize: `${72 / this.getUIScale()}px`, color: "#00ffcc" }
        ).setOrigin(0.5).setInteractive();

        startBtn.on("pointerover", () => startBtn.setScale(1.1));
        startBtn.on("pointerout", () => startBtn.setScale(1));
        startBtn.on("pointerdown", () => {
            this.scene.start("RunnerScene");
        });

        this.add.text(width / 2, 480,
            "\n🔒 (Coming Soon)\n\n🔒 (Coming Soon)",
            { fontSize: `${72 / this.getUIScale()}px`, color: "#777", align: "center" }
        ).setOrigin(0.5);
    }
}