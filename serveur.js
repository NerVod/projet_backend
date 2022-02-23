const express = require("express");
const path = require("path");
const cors = require("cors");
const Database = require("./public/js/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Cookies = require('cookies');
require("dotenv").config();

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view-engine", "pug");

app.get("/accueil", (req, res) => {
  res.render("accueil.pug");
});
app.get("/register", (req, res) => {
  res.render("register.pug");
});



app.get("/jeu", (req, res) => {
  let cookie = req.headers.cookie;
  console.log('cookie :', cookie)
  

  console.log("detection du cookie :", cookie);
  if (cookie) {
    res.render("jeu.pug");
  } else {
    res.render("accueil.pug", {
      message: "Erreur d'identifiants route /jeu, Veuillez vous enregistrer !",
    });
  }
});


app.get("*", (req, res) => {
  res.render("404.pug");
});

///////////////////////////////// création du compte utilisateur
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    // res.json({ success: false, error: 'Veuillez vous identifier'})
    res.render("register.pug", {
      message: "Veuillez vous identifier !",
    });
    return;
  }

  Database.User.create({
    email: req.body.email,
    gamertag: req.body.gamertag,
    password: bcrypt.hashSync(req.body.password, salt),
  })
    .then((user) => {
      console.log("compte créé dans BDD");
      const token = jwt.sign(
        { id: user._id, email: user.email, gamertag: user.gamertag },
        process.env.JWTPRIVATEKEY
      );
      console.log("token créé à la création du compte :", token);
      // res.json({ success: true, token: token })
      res.setHeader("Authorization", "Bearer " + token);
      res.render("accueil.pug", {
        message: "Vous pouvez commencer la partie !",
      });
    })
    .catch((err) => {
      // res.json({ success: false, error : err})
      console.error(err);
      res.render("register.pug", {
        message: "Erreur d'identification, veuillez recommencer !",
      });
    });
});

///////////////// connexion au compte utilisateur/////////////////////////////////////

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    // res.json({ success: false, error: 'Veuillez vous enregistrer'})
    res.render("accueil.pug", {
      message: "Veuillez vous connecter !",
    });
    return;
  }

  Database.User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        // res.json({ success: false, error: "Pas de compte sur cet email"})
        res.render("register.pug", {
          message: "Pas de compte sur cet email, Veuillez vous enregistrer !",
        });
      } else {
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          // res.json({success: false, error: 'Mot de passe incorrect'})
          res.render("accueil.pug", {
            message: "Erreur d'identifiants, Veuillez vous enregistrer !",
          });
        } else {
          let leJoueur = Object.values(user);
          let gamertag = leJoueur[2].gamertag;
          let victories = leJoueur[2].victories
          let token = jwt.sign(
            { id: user._id, email: user.email, gamertag: `${gamertag}` },
            process.env.JWTPRIVATEKEY
          );
          
          
          console.log(gamertag)
          ;
          console.log('token après login dans route post:',token)
  
        
        new Cookies(req,res).set('access_token', token, { httpOnly: false, MaxAge: 1000*60*60})
        res.render("accueil.pug", {
          message: "Vous pouvez vous rendre à la zone de jeu !",
        });
            
         
        }
      }
    })
    .catch((err) => {
      // res.json({ success: false, error: err})
      console.error(err);
      res.render("accueil.pug", {
        message:
          "Erreur lors de l'identification, connectez-vous ou créez un compte !",
      });
    });
});





const httpServer = app.listen(config.port, () => {
  console.log(`Le serveur écoute le port ${config.port}`);
});

//////////////////////////////////////////  serveur websocket //////////////////////////////////////////

const io = require("socket.io");
const Server = io.Server;
const ioServer = new Server(httpServer);
const randomColor = require("randomcolor");
const { setInterval } = require("timers");


const allPlayers = {};

ioServer.on("connection", (socket) => {

  console.log("io connecté avec cookie:" + socket.request.headers.cookie);
  
  let uniquePlayer = socket.request.headers.cookie
  let parsedToken = uniquePlayer.substring(13)
  console.log('parsedToken', parsedToken)
  let dataJoueur = jwt.verify(parsedToken, process.env.JWTPRIVATEKEY)
  console.log(dataJoueur['id'])
  console.log(dataJoueur['gamertag'])
  
  
   ///////////////////////  création du joueur à la connexion //////////////////////
  const onePlayer = {
    id: dataJoueur['id'],
    gamertag: dataJoueur['gamertag'],
    width: "100px",
    height: "100px",
    top: 255 + Math.random() * 500 + "px",
    left: "30px",
    position: "absolute",
    backgroundColor: randomColor(),
  };



  ////////////// iD unique pour chaque connexion et envoi à tous les sockets
  allPlayers[onePlayer.id] = onePlayer;
  allPlayers[onePlayer.gamertag] = onePlayer;

  ioServer.emit("updateOrCreatePlayer", onePlayer);

  for (playerId in allPlayers) {
    const player = allPlayers[playerId];

    ioServer.emit("updateOrCreatePlayer", player);
  }

  /////////////  déplacement du jouer avec les flèches clvier

  socket.on("deplacement", (mouvement) => {
    if (mouvement.haut) {
      onePlayer.top = parseFloat(onePlayer.top) - 2 + "px";
    }
    if (mouvement.droite) {
      console.log('flèche droite', onePlayer.gamertag)
      onePlayer.left = parseFloat(onePlayer.left) + 2 + "px";
    }
    if (mouvement.bas) {
      onePlayer.top = parseFloat(onePlayer.top) + 2 + "px";
    }
    if (mouvement.gauche) {
      onePlayer.left = parseFloat(onePlayer.left) - 2 + "px";
    }

    if (parseFloat(onePlayer.top) < 260 || parseFloat(onePlayer.top) > 1060)
      return;
    if (parseFloat(onePlayer.left) < 5 || parseFloat(onePlayer.left) > 1510)
      return;

    if (sensPoupee && parseFloat(onePlayer.left) < 1200) {
      onePlayer.left = 0 + "px";
    }

    ///////////////// détection de l'arrivée d'un joueur derrière la poupée //////////////
    for (playerId in allPlayers) {
      const player = allPlayers[playerId];

      if (parseFloat(player.left) > 1200) {
        console.log(onePlayer.id, " à dépassé la poupée ");
        partieEnCours = false;
        showStart();
        addOneVictory()
      }
    }
    ioServer.emit("updateOrCreatePlayer", onePlayer);
  });



  ////////////// déplacement à la souris///////////////////////

  socket.on("mousemove", (position) => {
    onePlayer.top = parseFloat(position.y) - parseFloat(onePlayer.height) / 2 + "px";

    if (
      parseFloat(position.x) <= parseFloat(onePlayer.left) + parseFloat(onePlayer.width)
    ) {
      onePlayer.left = parseFloat(position.x) - parseFloat(onePlayer.width) / 2 + "px";
      console.log("joueur :", onePlayer.id);
    }

    if (parseFloat(onePlayer.top) < 260 || parseFloat(onePlayer.top) > 1060)
      return;
    if (parseFloat(onePlayer.left) < 5 || parseFloat(onePlayer.left) > 1510)
      return;

    if (sensPoupee && parseFloat(onePlayer.left) < 1200) {
      onePlayer.left = 0 + "px";
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    /////////////// Condition de Victoire : dépassement poupée
    
    for (playerId in allPlayers) {
      const player = allPlayers[playerId];
      if (parseFloat(player.left) > 1100) {
        console.log(onePlayer.id, " à dépassé la poupée ");
        partieEnCours = false;
        showStart();
        // stopToggle(toggleEnnemi);
        addOneVictory();
        
        
      }
    }
    ioServer.emit("updateOrCreatePlayer", onePlayer);
    });


  ////////////// supression jes joueurs à la déconnexion du socket////////////////
  socket.on("disconnect", () => {
    delete allPlayers[onePlayer.id];
    ioServer.emit("removePlayer", onePlayer);
  });



/////////////////////////////////////////////////////////////////////////////////////
  ///////// gestion démarrage partie et fonctions inversion sens poupée  ///////////
  let sensPoupee = true;
  let partieEnCours = false;
  let valeur = 1
  let value = `scaleX(${valeur})`

  let retournerPoupee = function () {
    if(partieEnCours){
      valeur = -valeur
      if(valeur === 1) {
        value = 'scaleX(1)';
        sensPoupee = true;
        ioServer.emit('begin', value)
      } else {
        value = 'scaleX(-1)'
        sensPoupee = false;
        ioServer.emit('begin', value)
      }
      console.log('valeur du scalex :',valeur)
  }}



function stopToggle() {
  clearInterval(toggleEnnemi)
}
  
let boutonValue = 'visible'

  function hideStart() {
    for (playerId in allPlayers){
       boutonValue = "hidden";
      ioServer.emit("hide", boutonValue);
      return boutonValue
    }
  }

  
  /////// réapparition bouton start quand un joueur attend l'arrivée ///////////
  function showStart() { 
    for (playerId in allPlayers){
      boutonValue = "visible";
      ioServer.emit("hide", "visible");
      return boutonValue
    }
  }





  function rebase() {
    for (playerId in allPlayers) {
      onePlayer.left = "30px";
    }
    ioServer.emit("updateOrCreatePlayer", onePlayer);
  }
  ////// fonction gangnant//////////////

  const addOneVictory = function (winner){
    let victories = dataJoueur['victories']
    Database.User.findOneAndUpdate({gamertag: dataJoueur['gamertag']}, {victories: victories++}, console.log('victoire ajoutée'))
  }  
  
   ////////////////////////////////////////////////////////////////////////////////////////////
   ////////////////////////////////////////////////////////////////////////////////////////////
   ////////////  Démarrage partie

  let toggleEnnemi;
  socket.on("start", () => {
    partieEnCours = true;
    toggleEnnemi = setInterval(function() {
      retournerPoupee()
      if(!partieEnCours){
        clearInterval(toggleEnnemi);
        console.log('clear interval')
        toggleEnnemi=null;
        console.log('valeur toggleennemi', toggleEnnemi)
      }
      }, Math.random()*3500+4000)
    ////////////  masquer le bouton de partie après début => évite cumul des timeout
    hideStart();
    //////////// repositionnement des joueurs au début du parcours
    rebase();
    for (playerId in allPlayers) {
      const player = allPlayers[playerId];
      if (parseFloat(player.left) > 1100) {
        console.log(onePlayer.id, " à dépassé la poupée ");
        partieEnCours = false;
        clearInterval(toggleEnnemi); 
      }
    }

  });




   
  
  
  
  ////// test  message serveur//////////////
  const messageDuServeur = "do something";

  ioServer.emit("message", messageDuServeur);

  });