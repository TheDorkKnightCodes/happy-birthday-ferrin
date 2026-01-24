export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    console.log("MenuScene loaded");
    const { width, height } = this.scale;

    this.add.text(width / 2, 100, "🎂 BIRTHDAY ARCADE 🎂", {
      fontSize: "36px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const startBtn = this.add.text(width / 2, 220,
      "▶ Run From Responsibilities",
      { fontSize: "24px", color: "#00ffcc" }
    ).setOrigin(0.5).setInteractive();

    startBtn.on("pointerover", () => startBtn.setScale(1.1));
    startBtn.on("pointerout", () => startBtn.setScale(1));
    startBtn.on("pointerdown", () => {
      this.scene.start("RunnerScene");
    });

    this.add.text(width / 2, 300,
      "🔒 (Coming Soon)\n🔒 (Coming Soon)",
      { fontSize: "16px", color: "#777", align: "center" }
    ).setOrigin(0.5);
  }
}