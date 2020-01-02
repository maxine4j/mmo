import * as io from 'socket.io-client';
import { Key } from 'ts-keycode-enum';

import {
    TextBox, CheckBox, Button, Label, UIParent, Dropdown, RadioButton, Image,
} from './ui/components';


const socket = io.connect('http://localhost:3000');
const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function main() {
    const btn = new Button('my-button', UIParent.get(), 'This is the button text');
    btn.addEventListener('click', (self: Button, ev: MouseEvent) => {
        socket.emit('message', `button was clicked! selected radio button is ${RadioButton.getCheckedInGroup('mygroup')}`);
    });

    const chatBox = new TextBox('tb-chat', UIParent.get());
    chatBox.placeholder = 'Enter message...';
    chatBox.addEventListener('keyup', (self: TextBox, e: KeyboardEvent) => {
        if (e.keyCode === Key.Enter && self.text !== '') {
            socket.emit('message', `Chat Message: ${self.text}`);
            self.text = '';
        }
    });

    const lblCheck = new Label('lbl-my-check', UIParent.get(), 'This is a checkbox');
    const checkBox = new CheckBox('cb-test', lblCheck);
    checkBox.addEventListener('change', (self: CheckBox, ev: Event) => {
        socket.emit('message', `checkbox changed: ${self.checked}`);
    });

    const ddDrop = new Dropdown('my-dd', UIParent.get());
    ddDrop.addOption('1', 'this is the first option');
    ddDrop.addOption('2', 'this is the second option');
    ddDrop.addOption('3', 'this is the thrid option');
    ddDrop.addOption('4', 'this is the fourth option');
    ddDrop.addEventListener('change', (self: Dropdown, ev: Event) => {
        socket.emit('message', `new selection is ${self.selected}`);
    });

    const radBtn1 = new RadioButton('my-rad-btn', UIParent.get(), '1', 'mygroup');
    const radBtn2 = new RadioButton('my-rad-btn', UIParent.get(), '2', 'mygroup');

    const img = new Image('my-img', UIParent.get(), 'https://i.ytimg.com/vi/MPV2METPeJU/maxresdefault.jpg');
    img.style.width = '200px';

    window.addEventListener('click', (ev: MouseEvent) => {
        socket.emit('message', `canvas clicked at (${ev.clientX},${ev.clientY})`);
    });
}

function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
onResize();
window.addEventListener('resize', () => { onResize(); });

main();
