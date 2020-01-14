import Engine from '../client/engine/Engine';
import EditorScene from './EditorScene';

function main() {
    Engine.init(false);
    Engine.addScene(new EditorScene());
    Engine.start();
}

main();
