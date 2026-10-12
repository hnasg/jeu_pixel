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

export default class fin extends Phaser.Scene {
  constructor() {
    super({ key: "fin" });
  }

  preload() {
  }

  create() {
    var partie = this.registry.get("partie");
    this.sound.stopAll();
    this.sound.add("son_victoire", { volume: 0.8 }).play();
    this.son_clic = this.sound.add("son_clic", { volume: 0.5 });
    this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);
    this.add.text(LARGEUR / 2, 70, "VICTOIRE !", style(60, "#fff2a8", { stroke: "#7a4a10", strokeThickness: 10 })).setOrigin(0.5).setDepth(2);
    var qui = (partie.mode === 2) ? "aux deux princesses" : "princesse";
    this.add.text(LARGEUR / 2, 130, "Les 3 clés sont réunies, merci " + qui + " !", style(18)).setOrigin(0.5).setDepth(2);
    var nbCles = partie.cles.filter(Boolean).length;
    this.add.text(LARGEUR / 2, 185,
      "Score final : " + partie.score + "\nClés : " + nbCles + "/3   Ennemis vaincus : " + partie.ennemis,
      style(20, "#ffe28a", { align: "center" })).setOrigin(0.5).setDepth(2);
    this.add.text(LARGEUR / 2, 336, "Un jeu par Hina SEGURA MARTINEZ", style(16, "#fff2a8")).setOrigin(0.5).setDepth(2);
    creerBouton(this, LARGEUR / 2, 280, "REJOUER", function () {
      this.scene.start("menu");
    }.bind(this));
  }

  update() {
  }
}
