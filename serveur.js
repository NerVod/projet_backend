const  express = require('express');
const  path = require('path');
const  session = require('express-session');
const  jwt = require('jsonwebtoken');
const  { MongoClient } = require('mongodb');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');


const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds)



const app = express();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


const url = "mongodb+srv://NerVod:MotDePasseMongo@cluster0.aykvr.mongodb.net/jeumulti?retryWrites=true&w=majority";
const dbName = "jeumulti";
const coll = "players";
const collsession = "sessions"
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
const connection = mongoose.createConnection(url, dbOptions)



const config = {
    port: process.env.port || 8080,
    host: process.env.HOST || '127.0.0.1'
}



// app.use('/html', express.static(path.join(__dirname, "public","html")))
app.use('/css', express.static(path.join(__dirname, "public/css")))
app.use('/js', express.static(path.join(__dirname, "public/js")))
app.use('/img', express.static(path.join(__dirname, "public/images")))
app.use('/.ttf', express.static(path.join(__dirname, "public/font")))
app.use('/', express.static(path.join(__dirname, 'views')))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// passport.use(new LocalStrategy (
//     function(username, password, done) {
//         User.findOne({gamertag: gamertag}, function(err, user) {
//             if(err) { return done(err); }
//             if(!user) { return done(null, flase); }
//             if(!user.verifyPassword(password)) { return done(null, false);}
//             return done(null, user);
//         });
//     }
// ));


app.set("view engine", "pug");

const sessionStore = new MongoStore({
    mongooseConnection: connection,
    collection: collsession
})
app.use(session({
    secret: "ThisIsHellOf@TastyBurger",
    resave:false,
    saveUninitialized:true,
    store: sessionStore,
    cookie: {
        maxAge: 1000*60*60*24
    },
    

}));


app.get('/accueil',(req, res) => {
    console.log('req.session : ', req.session)
    console.log('Inside the homepage callback function')
    console.log('req. body route "/" :', req.body)
    res.render('accueil.pug')
});

app.get('/register',(req, res) => {
    console.log('Inside the GET register callback function')
    console.log('req. body route /register :', req.body)
    res.render('register.pug')
});

app.get('*',(req, res) => {
    res.render('404.pug')
});

////////////////////////////////// création du compte utilisateur //////////////////////////////////
app.post('/register', (req, res) => {

    console.log('route /register invoquée');
    console.log('corps de la requête :', req.body);
    const gamertag = req.body.gamertag;
    const email = req.body.email;
    const numero = req.body.numero;
    // const password = encrypt(`${req.body.password}`)
    
    const password = bcrypt.hashSync(`${req.body.password}`, salt)
    console.log('bcrypt création :', password)




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
                    console.log('compte créé en BDD ');
                    res.render('accueil', {
                        message : 'Connectez-vous à votre compte recrue !'
                    });
                     

                } else {
                    console.log('Un compte existe déjà sur cet email ');
                    res.render('register', {
                        message : 'Un compte existe déjà sur cet email !'
                    });
                }

                console.log('step final')
            };
        })
    })


})

////////////////////////////////////// Connexion au compte utilisateur //////////////////////////////////////




app.post('/login', (req, res) => {

    console.log('route /login invoquée');
    console.log('corps de la requête :', req.body);
    // const gamertag = req.body.gamertag;
    const email = req.body.emaillog;
    // const numero = req.body.numero;
    const password = req.body.password
    

    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName)
        const collection = db.collection(coll);
        // const query = {
        //     Gamertag: gamertag,
        //     Email: email,
        //     Numero: numero,
        //     Password: password
        // }


        collection.findOne({email: email})
                .then((joueur) => {
                    console.log('joueur trouvé ', joueur);
                    if(joueur) {
                        bcrypt
                        .compare(password, joueur.password)
                        .then((isValid) => {
                            if(!isValid) {
                                console.log('Erreur d\'identification ');
                                res.render('accueil', {
                                message : 'Erreur d\'identification, vérifiez votre saisie !'
                            });
                            client.close()
                            } else {
                                const leJoueur = Object.values(joueur)
                                console.log('comparaison mdp réussie', leJoueur[1]);
                                const token = jwt.sign({name: `${leJoueur[1]}`}, 'WhatADamnSecret');
                                console.log('token au login :', token);
                                req.session[req.sessionID]={
                                    alias: `${leJoueur[1]}`,
                                    token: token
                                }
                                const joueurAlias = jwt.verify(token, 'WhatADamnSecret')
                                console.log('joueurAlias du verifToken :',joueurAlias)
                                res.render('jeu', {
                                    message : 'Que la partie commence recrue !'
                                });

                            }
                     })
                    };
                })            
    })

   
})

const httpServer = app.listen(config.port, () => {
    console.log(`le serveur écoute le port ${config.port}`)
});


/////////////////  serveur websocket /////////////////


const io = require('socket.io');
const Server = io.Server;
const ioServer = new Server(httpServer);
const uuid = require('uuid');
const randomColor = require('randomcolor')
// const req = require('express/lib/request');

const allPlayers= {}

ioServer.on('connection', (socket) => {
    const onePlayer = {
        id: uuid.v4(),
        width: '100px',
        height: '100px',
        top: 255 + Math.random()*700+'px',
        left: '30px',
        position: 'absolute',
        backgroundColor: randomColor()
    }


    allPlayers[onePlayer.id] = onePlayer

    // Créer mon carré
    // envoyer des données à cette connexion websocket uniquement
    // socket.emit('identifiant', 'données');
    // envoyer des données à toutes les connexions websocket sauf la mienne
    // socket.broadcast.emit('identifiant', 'données');
    // Ici on envoi des données à travers tous les sockets à tous les front-end
    ioServer.emit('updateOrCreatePlayer', onePlayer);


    // Créer tous les carrés de tous les autres joueurs
    for(playerId in allPlayers) {
        const player = allPlayers[playerId];
        // permet d'envoyer des données à tous les front-end
        ioServer.emit('updateOrCreatePlayer', player);
    }

    socket.on('mousemove', (position) => {
        onePlayer.top = (parseFloat(position.y) - (parseFloat(onePlayer.height) / 2)) + 'px';
        onePlayer.left = (parseFloat(position.x) - (parseFloat(onePlayer.width) / 2)) + 'px';

        if (parseFloat(onePlayer.top) < 260 || parseFloat(onePlayer.top)> 1060) return;
        if (parseFloat(onePlayer.left) < 5 || parseFloat(onePlayer.left)> 1410) return;

        // for(playerId in allPlayers) {
        //     const player = allPlayers[playerId];
        //     if (parseFloat(player.top) < parseFloat(onePlayer.top)) {
        //         console.log(onePlayer.id, 'est en dessous de', player.id);
        //     }
        //     if (parseFloat(player.left) < parseFloat(onePlayer.left)) {
        //         console.log(onePlayer.id, ' est à droite de ', player.id);
        //     };
        // }
        // permet d'envoyer des données à tous les front-end
        ioServer.emit('updateOrCreatePlayer', onePlayer);
    });

    socket.on('disconnect', () => {
        delete allPlayers[onePlayer.id]
        // permet d'envoyer des données à tous les front-end
        ioServer.emit('removePlayer', onePlayer);
    })


    socket.on('start', () => {
        
        startCount()
        function reverse() {
            setTimeout(() => {
                const value = 'scaleX(-1)'
                redresse()
                ioServer.emit('begin', value)
            }, Math.random()*4000);
        }
        function redresse() {
            setTimeout(() => {
                const value = 'scaleX(1)'
                reverse()
                ioServer.emit('begin', value)
            }, Math.random()*3500);
        }
        
        function startCount() {
            reverse()
            rebase()

        }

        function hideStart() {
            const boutonValue = 'hidden';
            ioServer.emit('hide', boutonValue)
        }

       function rebase() {
        allPlayers[onePlayer.left] = onePlayer
        ioServer.emit('begin', onePlayer)
       }


    })
    






})












