import MenuScene from "./MenuScene.js";
import RunnerScene from "./RunnerScene.js";
import CatcherScene from "./CatcherScene.js";

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

    // 👇 MenuScene will auto-start
    scene: [MenuScene, RunnerScene, CatcherScene]
};

const game = new Phaser.Game(config);

/* ---------------- ROUTER ---------------- */

const ROUTES = {
    menu: "MenuScene",
    runner: "RunnerScene",
    catcher: "CatcherScene"
};

function getSceneFromHash() {
    const hash = window.location.hash.replace("#", "");
    return ROUTES[hash] || "MenuScene";
}

function switchScene(target) {
    const active = game.scene.getScenes(true)[0];

    if (active?.scene.key === target) return;

    if (active) {
        game.scene.stop(active.scene.key);
    }

    game.scene.start(target);
}

// After Phaser boots, redirect if needed
setTimeout(() => {
    switchScene(getSceneFromHash());
}, 0);

// Browser navigation support
window.addEventListener("hashchange", () => {
    switchScene(getSceneFromHash());
});