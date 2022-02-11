const express = require('express');
const PORT = 8080;
const path = require('path');
// const { dirname } = require('path');
// const { fileURLtoPath } = require('url');

const app = express();
// const __filename = fileURLtoPath(import.meta.url);
// const __dirname = dirname(__filename);


app.use('/css', express.static(path.join(__dirname, "public/css")))
app.use('/js', express.static(path.join(__dirname, "public/js")))
app.use('/img', express.static(path.join(__dirname, "public/images")))
app.use('/.ttf', express.static(path.join(__dirname, "public/font")))

app.use('/',(req, res) => {
    res.sendFile(`${__dirname}/index.html`)
})

const httpServer = app.listen(PORT, () => {
    console.log(`le serveur écoute le port ${PORT}`)
});






// websocket

const io = require('socket.io')
const Server = io.Server
const ioServer = new Server(httpServer)

let players = {};

ioServer.on('connection', (socket) => {
    if (players.length <= 2 ){

        const onePlayer = {
            id: this.playerName,
            avatar: this.playerAvatar
        }

        players[onePlayer.id] = onePlayer

    }
})

