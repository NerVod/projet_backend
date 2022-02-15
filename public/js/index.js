window.document.addEventListener('DOMContentLoaded', () => {

    console.log('index.js chargé')

const players=[]


const socket = io('http://localhost:8080');

// socket.on('addOnePlayer', (player) => {
//     players.push(onePlayer)
// })


socket.on('addOnePlayer', (oneplayer) => {


        if(players.length < 2 && (!players.includes(oneplayer))){
            players.push(oneplayer)
        }
    





    console.log('tableau des joueurs : ', players)
})


socket.on('testMessage', (message) => {
    console.log('message du serveur ', message)
})


socket.on('removePlayer', (onePlayer) => {
    const playerToRemove = players.indexOf(`${onePlayer}`);
    if(playerToRemove !== -1) {
        players.splice(playerToRemove, 1);
    }
    console.log('tableau vidé du joueur :', players)
})






})
