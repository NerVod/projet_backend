const express = require('express');
const PORT = 8080;
const path = require('path');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb')

const { encrypt } = require('./public/js/user.js')

const app = express();

const url = "mongodb+srv://NerVod:MotDePasseMongo@cluster0.aykvr.mongodb.net/bddAjax?retryWrites=true&w=majority";

const dbName = "jeumulti";
const coll = "players";

const config = {
    port: process.env.port || 8080,
    host: process.env.HOST || '127.0.0.1'
}
// const __filename = fileURLtoPath(import.meta.url);
// const __dirname = dirname(__filename);


app.use('/html', express.static(path.join(__dirname, "public/html")))
app.use('/css', express.static(path.join(__dirname, "public/css")))
app.use('/js', express.static(path.join(__dirname, "public/js")))
app.use('/img', express.static(path.join(__dirname, "public/images")))
app.use('/.ttf', express.static(path.join(__dirname, "public/font")))


app.post('/login', (req, res) => {
    // // auth user
    // const user = { id: 1 };
    // const token = jwt.sign({ user } , 'whatADamnSecret');
    // res.json({
    //     token: token
    // })
    console.log('route /login invoquée');
    console.log('corps de la requeête :', req.body);
    const gamertag = req.body.gamertag;
    const email = req.body.email;
    const password = encrypt(body.passord)

    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName)
        const collection = db.collection(coll);

        collection.findOne({email : email}, (err, document) => {
            console.log("step 1");
            if (err) {
                console.log("erreur connecion mongo : ", err);
                client.close();
            } else {
                if(!joueur) {
                    console.log('step 2');
                    collection.insertOne(
                        {
                            gamertag: gamertag,
                            email: email,
                            password: encrypt(password)
                        }, (err, document) => {
                            console.log('step 3');
                            console.log(joueur);
                            client.close();
                        }
                    );
                } else {
                    console.log('Un compote existe déjà sur cet email ')
                }

                console.log('step final')
            };
        })
    })


})

app.get('/jeu', verifToken , function(req, res) {
    jwt.verify(req.token, 'whatADamnSecret', function(err, data) {
        if(err) {
            res.status(403);
        }else {
            res.json({
                text: ' page du jeu',
                data: data
            });
        }
    });
    })

function verifToken(req, res, next) {
    const bearerHeader = req.headers["authorization"];
    if(typeof bearerHeader != 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

app.use('/squid',(req, res) => {
    res.sendFile(`${__dirname}/index.html`)
});
app.use('/',(req, res) => {
    res.sendFile(`${__dirname}/404.html`)
});




const httpServer = app.listen(config.port, () => {
    console.log(`le serveur écoute le port ${config.port}`)
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

