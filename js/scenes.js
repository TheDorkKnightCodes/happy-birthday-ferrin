import MenuScene from "./MenuScene.js";
import RunnerScene from "./RunnerScene.js";

export const SCENE_ROUTES = {
    menu: "MenuScene",
    runner: "RunnerScene",
};

export const SCENES = [
    { key: "MenuScene", scene: MenuScene, active: false },
    { key: "RunnerScene", scene: RunnerScene, active: false }
];