window.document.addEventListener('DOMContentLoaded', () => {

    console.log('index.js chargé')

const players=[]


const socket = io('http://localhost:8080');

socket.on('addOnePlayer', (player) => {
    players.push(onePlayer)
})

console.log(players[0])








})
