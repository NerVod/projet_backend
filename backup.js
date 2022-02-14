import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import session from 'express-session';
import { uuid } from 'uuidv4';
import jwt from 'jsonwebtoken';
import { MongoClient }from 'mongodb';
import MongoSore from 'connect-mongo';
import { encrypt } from './public/js/user.js';
import MongoStore from 'connect-mongo';



const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const url = "mongodb+srv://NerVod:MotDePasseMongo@cluster0.aykvr.mongodb.net/jeumulti?retryWrites=true&w=majority";
const dbName = "jeumulti";
const coll = "players";



const config = {
    port: process.env.port || 8080,
    host: process.env.HOST || '127.0.0.1'
}


app.use('/html', express.static(path.join(__dirname, "public","html")))
app.use('/css', express.static(path.join(__dirname, "public/css")))
app.use('/js', express.static(path.join(__dirname, "public/js")))
app.use('/img', express.static(path.join(__dirname, "public/images")))
app.use('/.ttf', express.static(path.join(__dirname, "public/font")))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/',(req, res) => {
    console.log('requete pour "/" :' , req)
    const uniqueId = uuid()
    res.send(`page du jeu uuid ${ uniqueId }\n`)
});



// app.use(session({
//     secret:"ThisIsHellOf@TastyBurger",
//     store: MongoStore.create({
//         mongoUrl: url,
//         collectionName: 'sessions'
//     })
    
// }))






app.post('/register', (req, res) => {
    // // auth user
    // const user = { id: 1 };
    // const token = jwt.sign({ user } , 'whatADamnSecret');
    // res.json({
    //     token: token
    // })
    console.log('route /register invoquée');
    console.log('corps de la requête :', req.body);
    const gamertag = req.body.gamertag;
    const email = req.body.email;
    const numero = req.body.numero;
    const password = encrypt(`${req.body.password}`)

    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName)
        const collection = db.collection(coll);

        collection.findOne({email: email}, (err, joueur) => {
            console.log("step 1");
            if (err) {
                console.log("erreur connexion mongo : ", err);
                client.close();
            } else {
                if(!joueur) {
                    console.log('step 2');
                    const token = jwt.sign({ gamertag }, 'WhatADamnSecret');
                    
                    collection.insertOne(
                        {
                            gamertag: gamertag,
                            email: email,
                            numero: numero,
                            password: password,
                            token: token,
                        }, (err, joueur) => {
                            console.log('step 3');
                            console.log(joueur);
                            client.close();
                        }
                    );
                } else {
                    console.log('Un compte existe déjà sur cet email ');
                    res.sendFile(`${__dirname}/erreurcompte.html`)
                }

                console.log('step final')
            };
        })
    })


})



app.post('/login'), (req, res) => {
    session = req.session;
    if(session.userid){
        res.sendFile(`${__dirname}/jeu.html`)
    } else {
        res.sendFile(`${__dirname}/index.html`)
    }
}




// app.get('/jeu', verifToken , function(req, res) {
//     jwt.verify(req.token, 'whatADamnSecret', function(err, data) {
//         if(err) {
//             res.status(403);
//         }else {
//             res.json({
//                 text: ' page du jeu',
//                 data: data
//             });
//         }
//     });
//     })

// function verifToken(req, res, next) {
//     const bearerHeader = req.headers["authorization"];
//     if(typeof bearerHeader != 'undefined') {
//         const bearer = bearerHeader.split(" ");
//         const bearerToken = bearer[1];
//         req.token = bearerToken;
//         next();
//     } else {
//         res.sendStatus(403);
//     }
// }


app.get('/inscription',(req, res) => {
    res.sendFile(`${__dirname}/inscription.html`)
});
// app.get('/',(req, res) => {
//     res.sendFile(`${__dirname}/404.html`)
// });




const httpServer = app.listen(config.port, () => {
    console.log(`le serveur écoute le port ${config.port}`)
});






// websocket

// const io = require('socket.io')
// const Server = io.Server
// const ioServer = new Server(httpServer)

// let players = {};

// ioServer.on('connection', (socket) => {
//     if (players.length <= 2 ){

//         const onePlayer = {
//             id: this.playerName,
//             avatar: this.playerAvatar
//         }

//         players[onePlayer.id] = onePlayer

//     }
// })

