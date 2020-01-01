import * as io from "socket.io-client"

console.log("hi!");
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
    window.addEventListener('click', onClick);
}

function main() {
    registerInputs();
}

main();