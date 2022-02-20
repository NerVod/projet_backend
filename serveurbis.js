const express = require("express");
const path = require("path");
const cors = require("cors");
const Database = require("./public/js/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
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

// app.get('/jeu', (req, res) => {
//     fetchPlayerByToken(req)
//     .then((player) => {
//         res.render('jeu.pug')
//     })
//     .catch((err) => {
//         console.log('erreur de token sur route jeu')
//     })
// })

app.get("/jeu", (req, res) => {
  let cookie = req.cookies;
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
          const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWTPRIVATEKEY
          );
          // console.log("token à la connexion : ", token);
          // res.json({ token: token})
          const leJoueur = Object.values(user);
          let gamertag = leJoueur[2].gamertag;
          console.log(gamertag)
          ;
          // res.cookie( 'gamertag', `${gamertag}`, {maxAge:900000, httpOnly: false})
          res.writeHead(200, {
            "Set-Cookie": `${gamertag}`,
            "Access-Control-Allow-Credentials": true,
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

function fetchPlayerByToken(req) {
  return new Promise((resolve, reject) => {
    if (req.headers && req.headers.authorization) {
      let authorization = req.headers.authorization;
      let decoded;
      try {
        decoded = jwt.verify(authorization, JWTPRIVATEKEY);
      } catch (error) {
        reject("token invalide");
        return;
      }
      let userId = decoded.id;
      Database.User.findOne({ _id: userId })
        .then((user) => {
          resolve(user);
        })
        .catch((error) => {
          reject("Erreur de Token");
        });
    } else {
      reject("Token manquant");
    }
  });
}

const httpServer = app.listen(config.port, () => {
  console.log(`Le serveur écoute le port ${config.port}`);
});

//////////////////////////////////////////  serveur websocket //////////////////////////////////////////

const io = require("socket.io");
const Server = io.Server;
const ioServer = new Server(httpServer);
const uuid = require("uuid");
const randomColor = require("randomcolor");

const allPlayers = {};

ioServer.on("connection", (socket) => {

  console.log("io connecté avec cookie:" + socket.request.headers.cookie);
  let joueurUnique = socket.request.headers.cookie
  
  
   ///////////////////////  création du joueur à la connexion //////////////////////
  const onePlayer = {
    id: joueurUnique,
    width: "100px",
    height: "100px",
    top: 255 + Math.random() * 700 + "px",
    // top: "700px",
    left: "30px",
    position: "absolute",
    backgroundColor: randomColor(),
  };


  ////////////// iD unique pour chaque connexion et envoi à tous les sockets
  allPlayers[onePlayer.id] = onePlayer;

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
      }
    }
    ioServer.emit("updateOrCreatePlayer", onePlayer);
  });


  ////////////// supression jes joueurs à la déconnexion du socket////////////////
  socket.on("disconnect", () => {
    delete allPlayers[onePlayer.id];
    ioServer.emit("removePlayer", onePlayer);
  });


  ///////// gestion démarrage partie et fonctions inversion sens poupée  ///////////
  let sensPoupee = true;
  let partieEnCours = false;

  socket.on("start", () => {
    partieEnCours = true;
    reverse();
    function reverse() {
      if (partieEnCours) {
        setTimeout(() => {
          const value = "scaleX(-1)";
          redresse();
          sensPoupee = false;
          ioServer.emit("begin", value);
        }, 3000);
      } else {
        return;
      }
    }
    function redresse() {
      if (partieEnCours) {
        setTimeout(() => {
          const value = "scaleX(1)";
          reverse();
          sensPoupee = true;
          ioServer.emit("begin", value);
        }, Math.random() * 3500 + 1000);
      } else {
        return;
      }
    }

    ////////////  masquer le bouton de partie après début => évite cumul des timeout
    function hideStart() {
      const boutonValue = "hidden";
      ioServer.emit("hide", boutonValue);
    }
    hideStart();


    //////////// repositionnement des joueurs au début du parcours
    function rebase() {
      for (playerId in allPlayers) {
        onePlayer.left = "30px";
      }
      ioServer.emit("updateOrCreatePlayer", onePlayer);
    }
    rebase();
  });

    /////// réapparition bouton start quand un joueur attend l'arrivée ///////////
  function showStart() {
    const boutonValue = "visible";
    ioServer.emit("hide", "visible");
  }


  ////// fonction gangnant//////////////

  // inscription en BDD à implémenter
  
  
  
  
  
  ////// test  message serveur//////////////
  const messageDuServeur = "do something";

  ioServer.emit("message", messageDuServeur);
});
