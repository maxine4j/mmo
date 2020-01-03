import Engine from './engine/Engine';
import LoginScene from './scenes/LoginScene';
import CharSelectScene from './scenes/CharSelectScene';


function main() {
    Engine.init();
    Engine.addScene(new LoginScene());
    Engine.addScene(new CharSelectScene());
    Engine.start();
}

main();
