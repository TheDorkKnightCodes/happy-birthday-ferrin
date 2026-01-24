import MenuScene from "./MenuScene.js";
import RunnerScene from "./RunnerScene.js";

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#000000",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: BASE_WIDTH,
        height: BASE_HEIGHT
    },

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },

    scene: [MenuScene, RunnerScene]
};

new Phaser.Game(config);