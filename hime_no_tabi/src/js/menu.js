var LARGEUR = 706;

function style(taille, couleur, extra) {
  return Object.assign({
    fontFamily: "Trebuchet MS, Verdana, sans-serif",
    fontSize: taille + "px",
    color: couleur || "#ffffff",
    stroke: "#2a1418",
    strokeThickness: Math.max(2, Math.round(taille / 6)),
    fontStyle: "bold"
  }, extra || {});
}

function creerBouton(scene, x, y, texte, action) {
  var bouton = scene.add.image(x, y, "imageBoutonPlay", 0).setDepth(1);
  var etiquette = scene.add.text(x, y, texte, style(22)).setOrigin(0.5).setDepth(2);
  bouton.setInteractive();
  bouton.on("pointerover", function () { bouton.setFrame(1); etiquette.setScale(1.05); });
  bouton.on("pointerout", function () { bouton.setFrame(0); etiquette.setScale(1); });
  bouton.on("pointerup", function () {
    if (scene.son_clic) scene.son_clic.play();
    action();
  });
  return bouton;
}

export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.load.image("menu_fond", "src/assets/menu_fond.png");
    this.load.spritesheet("imageBoutonPlay", "src/assets/bouton_play.png", { frameWidth: 260, frameHeight: 56 });
    this.load.audio("background_menu", "src/assets/musique_menu.mp3");
    this.load.audio("son_clic", "src/assets/clic.mp3");
  }

  create() {
    this.sound.stopAll();
    this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);

    this.musique_de_fond = this.sound.add("background_menu", { loop: true, volume: 0.45 });
    this.musique_de_fond.play();
    this.son_clic = this.sound.add("son_clic", { volume: 0.5 });

    this.add.text(LARGEUR / 2, 62, "HIME NO TABI", style(58, "#ffe9f0", { stroke: "#7a1630", strokeThickness: 10 })).setOrigin(0.5).setDepth(1);
    this.add.text(LARGEUR / 2, 112, "Le voyage de la princesse", style(20, "#fff3c4")).setOrigin(0.5).setDepth(1);

    var lancer = function (mode) {
      this.registry.set("partie", { mode: mode, score: 0, cles: [false, false, false], ennemis: 0 });
      this.musique_de_fond.stop();
      this.scene.start("chargement");
    }.bind(this);
    creerBouton(this, LARGEUR / 2, 178, "1 JOUEUR", function () { lancer(1); });
    creerBouton(this, LARGEUR / 2, 242, "2 JOUEURS", function () { lancer(2); });

    this.add.text(LARGEUR / 2, 296,
      "J1 : flèches gauche/droite = déplacer · flèche HAUT = SAUTER · M = tirer · ESPACE = interagir\nJ2 : Q/D = déplacer · Z = SAUTER · F = tirer · E = interagir",
      style(12, "#ffffff", { align: "center", strokeThickness: 3 })).setOrigin(0.5).setDepth(1);
    this.add.text(LARGEUR / 2, 338, "Trouve la clé de chaque niveau et ouvre la porte ! (5 cœurs par niveau)",
      style(13, "#ffe9a0", { strokeThickness: 3 })).setOrigin(0.5).setDepth(1);
  }

  update() {
  }
}
