import * as io from "socket.io-client"

import UIParent from "./ui/uiparent";
import Button from "./ui/button";

const socket = io.connect("http://localhost:3000");
const canvas = <HTMLCanvasElement> document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function sendMsg() {
    socket.emit("message", "this is sent from the client");
}

function onClick(e: MouseEvent) {
    socket.emit("message", `Mouse clicked at (${e.clientX},${e.clientX})`);

}

function registerInputs() {
    canvas.addEventListener('click', onClick);
    const tbtn = document.getElementById("testbtn");
    tbtn.addEventListener('click', (e: MouseEvent) => {
        socket.emit("message", `BUTTON CLICKED`);
        e.stopPropagation();
    })
}

function main() {
    registerInputs();
    let btn = new Button("my-button", UIParent.get(), "This is the button text");
}

main();