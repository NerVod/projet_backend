const express = require('express');
const path = require("path");
const cors = require('cors');
const Database = require('./public/js/db')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()

const app = express();

const config = {
    port: process.env.PORT || 8080,
    host: process.env.HOST || "127.0.0.1",
  };




  
  app.use("/css", express.static(path.join(__dirname, "public/css")));
  app.use("/js", express.static(path.join(__dirname, "public/js")));
  app.use("/img", express.static(path.join(__dirname, "public/images")));
  app.use("/.ttf", express.static(path.join(__dirname, "public/font")));
  app.use("/.pug", express.static(path.join(__dirname, "views")));
  app.use(express.json());
  app.use(express.urlencoded({ extended : true}));
  app.use(cookieParser())
  
  app.set('view-engine', 'pug');


app.get('/accueil', (req, res) => {
    res.render('accueil.pug')
})
app.get('/register', (req, res) => {
    res.render('register.pug')
})

// app.get('/jeu', (req, res) => {
//     fetchPlayerByToken(req)
//     .then((player) => {
//         res.render('jeu.pug')
//     })
//     .catch((err) => {
//         console.log('erreur de token sur route jeu')
//     })
// })

app.get('/jeu', (req, res) => {
    let cookie = req.cookies;
    console.log('detection du cookie :', cookie);
    if(cookie) {
        res.render('jeu.pug')
    } else {
        res.render("accueil.pug", {
            message: "Erreur d'identifiants route /jeu, Veuillez vous enregistrer !",
          });
    }
})

app.get('*', (req, res) => {
    res.render('404.pug')
})

///////////////////////////////// création du compte utilisateur
app.post('/register', (req, res) => {
    if(!req.body.email || !req.body.password) {
        // res.json({ success: false, error: 'Veuillez vous identifier'})
        res.render("register.pug", {
            message: "Veuillez vous identifier !",
          });
        return
    }

    Database.User.create({
        email: req.body.email,
        gamertag: req.body.gamertag,
        password: bcrypt.hashSync(req.body.password, salt),
    }).then((user) => {
        console.log('compte créé dans BDD')
        const token = jwt.sign({ id: user._id, email: user.email, gamertag: user.gamertag}, process.env.JWTPRIVATEKEY)
        console.log('token créé à la création du compte :', token)
        // res.json({ success: true, token: token })
        res.setHeader('Authorization', 'Bearer ' + token);
        res.render("accueil.pug", {
            message: "Vous pouvez commencer la partie !",
          });
    }).catch((err) => {
        // res.json({ success: false, error : err})
        console.error(err)
        res.render("register.pug", {
            message: "Erreur d'identification, veuillez recommencer !",
          });
    })
})





app.post('/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
        // res.json({ success: false, error: 'Veuillez vous enregistrer'})
        res.render("accueil.pug", {
            message: "Veuillez vous connecter !",
          });
    return
    }

    Database.User.findOne({ email: req.body.email })
        .then((user) => {
            if(!user) {
                // res.json({ success: false, error: "Pas de compte sur cet email"})
                res.render("register.pug", {
                    message: "Pas de compte sur cet email, Veuillez vous enregistrer !",
                  });
            } else {
            if(!bcrypt.compareSync(req.body.password, user.password)) {
                // res.json({success: false, error: 'Mot de passe incorrect'})
                res.render("accueil.pug", {
                    message: "Erreur d'identifiants, Veuillez vous enregistrer !",
                  });
            } else {
                const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWTPRIVATEKEY)
                console.log('token à la connexion : ', token)
                // res.json({ token: token})
                const leJoueur = Object.values(user);
                const gamertag = leJoueur[2].gamertag
                console.log(gamertag)
                res.cookie( 'gamertag', `${gamertag}`, {maxAge:900000, httpOnly: false})
                // console.log(`joueur trouvé `, leJoueur[2].gamertag)
                // res.setHeader('Authorization', 'Bearer ' + token);

                

            }
        }

    })
    .catch((err) => {
        // res.json({ success: false, error: err})
        console.error(err)
        res.render("accueil.pug", {
            message: "Erreur lors de l'identification, connectez-vous ou créez un compte !",
          });

    })

})


function fetchPlayerByToken(req){
    return new Promise((resolve, reject) => {
        if(req.headers && req.headers.authorization) {
            let authorization = req.headers.authorization
            let decoded
            try{
                decoded = jwt.verify(authorization, JWTPRIVATEKEY)
            } catch(error) {
                reject('token invalide')
                return
            }
            let userId = decoded.id
            Database.User.findOne({ _id: userId })
                .then((user) => {
                    resolve(user)
                })
                .catch((error) => {
                    reject('Erreur de Token')
                })
        } else {
            reject('Token manquant')
        }
    })
}


const httpServer = app.listen(config.port, () => {
    console.log(`Le serveur écoute le port ${config.port}`)
})