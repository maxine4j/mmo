import * as io from 'socket.io-client';
import { Key } from 'ts-keycode-enum';
import CharSelectScene from './scenes/CharSelectScene';
import SceneManager from './engine/scene/SceneManager';

const socket = io.connect('http://localhost:3000');
const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const manager: SceneManager = new SceneManager();
let lastrender: number = 0;

function loop(timestamp: number) {
    const delta: number = timestamp - lastrender;

    manager.currentScene.update(delta);
    manager.currentScene.draw();

    lastrender = timestamp;
    window.requestAnimationFrame(loop);
}

function main() {
    const charSelect = new CharSelectScene(manager);
    manager.currentScene = manager.getScene('char-select');

    window.requestAnimationFrame(loop);
}


function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
onResize();
window.addEventListener('resize', () => { onResize(); });

const body = document.getElementById('body');
body.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
});

main();
