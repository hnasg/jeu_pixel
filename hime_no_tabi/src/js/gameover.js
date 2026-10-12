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

export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  preload() {
  }

  init(data) {
    this.niveau = data.niveau || "niveau1";
    this.raison = data.raison || "";
  }

  create() {
    var partie = this.registry.get("partie");
    this.sound.stopAll();
    this.son_clic = this.sound.add("son_clic", { volume: 0.5 });
    this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);
    this.add.rectangle(0, 0, LARGEUR, 360, 0x000000, 0.7).setOrigin(0).setDepth(0.5);
    this.add.text(LARGEUR / 2, 85, "WASTED", { fontFamily: "Impact, Arial Black, sans-serif", fontSize: "96px", color: "#c81e1e", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setDepth(2);
    this.add.text(LARGEUR / 2, 160, this.raison, style(20)).setOrigin(0.5).setDepth(2);
    this.add.text(LARGEUR / 2, 192, "Score : " + partie.score, style(22, "#ffe28a")).setOrigin(0.5).setDepth(2);
    creerBouton(this, LARGEUR / 2, 245, "REJOUER LE NIVEAU", function () {
      this.scene.start(this.niveau);
    }.bind(this));
    creerBouton(this, LARGEUR / 2, 308, "MENU PRINCIPAL", function () {
      this.scene.start("menu");
    }.bind(this));
  }

  update() {
  }
}
