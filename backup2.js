const  express = require('express');
const  { fileURLToPath }= require('url');
const  path = require('path');
const  session = require('express-session');
const  { uuid } = require('uuidv4');
const  FileStore = require('session-file-store')(session);
const  jwt = require('jsonwebtoken');
const  { MongoClient } = require('mongodb');
const  { encrypt } = require('./public/js/user.js');




const app = express();
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);


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


app.set("view engine", "pug");

app.use(session({
    genid: (req) => {
        console.log('inside the session middleware')
        console.log('req.sessionid :' , req.sessionID)
        return uuid()
    },
    store: new FileStore(),
    secret: "ThisIsHellOf@TastyBurger",
    resave:false,
    saveUninitialized:true

}));


app.get('/',(req, res) => {
    console.log('Inside the homepage callback function')
    console.log('req. body route "/" :', req.body)
    res.render("template.html")
});

app.get('/register',(req, res) => {
    console.log('Inside the GET register callback function')
    console.log('req. body route /register :', req.body)
    res.send(`page du register  \n`)
});


app.post('/register', (req, res) => {

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
                    // res.sendFile(`${__dirname}/erreurcompte.html`)
                }

                console.log('step final')
            };
        })
    })


})



app.post('/login'), (req, res) => {
    session = req.session;
    if(session.userid){
        // res.sendFile(`${__dirname}/jeu.html`)
    } else {
        // res.sendFile(`${__dirname}/index.html`)
    }
}





app.get('/inscription',(req, res) => {
    // res.sendFile(`${__dirname}/inscription.html`)
});




const httpServer = app.listen(config.port, () => {
    console.log(`le serveur écoute le port ${config.port}`)
});


