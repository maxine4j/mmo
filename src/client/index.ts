import Engine from './engine/Engine';
import LoginScene from './scenes/LoginScene';
import CharSelectScene from './scenes/CharSelectScene';
import CharCreateScene from './scenes/CharCreateScene';
import WorldScene from './scenes/WorldScene';
import SignupScene from './scenes/SignupScene';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then((registration) => {
            console.log('SW registered');
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

function main(): void {
    Engine.init();
    Engine.addScene(new LoginScene());
    Engine.addScene(new SignupScene());
    Engine.addScene(new CharSelectScene());
    Engine.addScene(new CharCreateScene());
    Engine.addScene(new WorldScene());
    Engine.start();
}

main();
