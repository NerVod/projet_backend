installer packages node : npm install
démarrer app : npm start ou node serveur.js

l'IP du serveur est détectée au lancement dans la console.
saisir le numéro de l'adresse IP dans le fichier public/js/index.js
===> io(`http://<ip à saisir>:8080)

créer un identifiant de joueur et se rendre à la zone de jeu
fonctionne avec plusieurs postes connectés sur l'ip du serveur
