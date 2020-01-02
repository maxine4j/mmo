import * as io from "socket.io-client";
import { Key } from "ts-keycode-enum";

import UIParent from "./ui/uiparent";
import Button from "./ui/button";
import TextBox from "./ui/textbox";

const socket = io.connect("http://localhost:3000");
const canvas = <HTMLCanvasElement> document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function main() {
    let btn = new Button("my-button", UIParent.get(), "This is the button text");
    btn.addEventListener("click", (self: Button, ev: MouseEvent) => {
        socket.emit("message", "add event click triggered!");
    });

    let chatBox = new TextBox("tb-chat", UIParent.get());
    chatBox.setPlaceholder("Enter message...");
    chatBox.addEventListener("keyup", (self: TextBox, e: KeyboardEvent) => {
        if (e.keyCode === Key.Enter && self.getText() !== "") {
            socket.emit("message", "Chat Message: " + self.getText());
            self.setText("");
        }
    })
}

function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
onResize();
window.addEventListener("resize", () => { onResize(); });

main();