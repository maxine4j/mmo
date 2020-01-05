import Engine from './engine/Engine';
import LoginScene from './scenes/LoginScene';
import CharSelectScene from './scenes/CharSelectScene';
import CharCreateScene from './scenes/CharCreateScene';

function main() {
    Engine.init();
    Engine.addScene(new LoginScene());
    Engine.addScene(new CharSelectScene());
    Engine.addScene(new CharCreateScene());
    Engine.start();
}

main();
