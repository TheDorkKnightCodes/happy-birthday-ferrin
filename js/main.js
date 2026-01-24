import MenuScene from "./MenuScene.js";
import RunnerScene from "./RunnerScene.js";

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    backgroundColor: "#1e1e1e",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: [MenuScene, RunnerScene]
};

const game = new Phaser.Game(config);
game.scene.start("MenuScene");