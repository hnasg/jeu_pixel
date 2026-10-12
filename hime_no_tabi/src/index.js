import menu from "./js/menu.js";
import chargement from "./js/chargement.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import gameover from "./js/gameover.js";
import fin from "./js/fin.js";

var LARGEUR = 706;
var HAUTEUR = 360;

var config = {
  type: Phaser.AUTO,
  width: LARGEUR,
  height: HAUTEUR,
  parent: "jeu",
  backgroundColor: "#f6e5c1",
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1400 },
      debug: false,
      tileBias: 32
    }
  },
  scene: [menu, chargement, niveau1, niveau2, niveau3, gameover, fin]
};

var game = new Phaser.Game(config);
