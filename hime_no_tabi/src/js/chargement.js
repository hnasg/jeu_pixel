var LARGEUR = 706;
var HAUTEUR = 360;

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

export default class chargement extends Phaser.Scene {
  constructor() {
    super({ key: "chargement" });
  }

  preload() {
    var a = "src/assets/";
    this.add.text(LARGEUR / 2, HAUTEUR / 2 - 40, "Chargement...", style(24)).setOrigin(0.5);
    this.add.rectangle(LARGEUR / 2, HAUTEUR / 2, 304, 24, 0x2a1418).setStrokeStyle(2, 0xffffff);
    var barre = this.add.rectangle(LARGEUR / 2 - 148, HAUTEUR / 2, 0, 16, 0xe0405a).setOrigin(0, 0.5);
    this.load.on("progress", function (v) { barre.width = 296 * v; });
    this.load.image("img_ciel", a + "Sky.png");
    this.load.image("img_ciel_couchant", a + "Sky_couchant.png");
    this.load.image("img_ciel_nuit", a + "Sky_nuit.png");
    this.load.image("img_nuages", a + "Clouds.png");
    this.load.image("img_fuji", a + "Fuji.png");
    this.load.image("img_montagne_fond", a + "Mountain_Back.png");
    this.load.image("img_montagne_milieu", a + "Mountain_Middle.png");
    this.load.image("img_montagne_devant", a + "Mountain_Front.png");
    this.load.image("img_arbres_fond", a + "BackgroundTrees.png");
    this.load.image("img_arbres", a + "Trees.png");
    this.load.image("img_maison", a + "House.png");
    this.load.image("img_sanctuaire1", a + "Shrine_Single.png");
    this.load.image("img_sanctuaire2", a + "Shrine_Multiple.png");
    this.load.image("img_cle", a + "cle.png");
    this.load.image("img_plateforme_mobile", a + "plateforme_mobile.png");
    this.load.image("img_torii", a + "torii.png");
    this.load.image("img_levier", a + "levier.png");
    this.load.spritesheet("img_perso", a + "NPC_Hime.png", { frameWidth: 40, frameHeight: 58 });
    this.load.spritesheet("img_samourai0", a + "samourai_0.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("img_samourai1", a + "samourai_1.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("img_samourai2", a + "samourai_2.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("img_boss", a + "boss_geisha.png", { frameWidth: 56, frameHeight: 72 });
    this.load.spritesheet("img_bullet", a + "sakura.png", { frameWidth: 20, frameHeight: 20 });
    this.load.spritesheet("img_boule_feu", a + "boule_feu.png", { frameWidth: 28, frameHeight: 20 });
    this.load.spritesheet("img_porte", a + "spritesheet_porte.png", { frameWidth: 96, frameHeight: 120 });
    this.load.spritesheet("img_coeur", a + "coeur.png", { frameWidth: 24, frameHeight: 22 });
    this.load.image("Phaser_tuilesdejeu", a + "tuilesJeu.png");
    this.load.tilemapTiledJSON("carte1", a + "map1.json");
    this.load.tilemapTiledJSON("carte2", a + "map2.json");
    this.load.tilemapTiledJSON("carte3", a + "map3.json");
    this.load.audio("background", a + "musique_jour.mp3");
    this.load.audio("background_couchant", a + "musique_couchant.mp3");
    this.load.audio("background_temple", a + "musique_temple.mp3");
    this.load.audio("coupDeFeu", a + "tir.mp3");
    this.load.audio("son_saut", a + "saut.mp3");
    this.load.audio("son_touche", a + "touche.mp3");
    this.load.audio("son_cle", a + "cle.mp3");
    this.load.audio("son_porte", a + "porte.mp3");
    this.load.audio("son_levier", a + "levier.mp3");
    this.load.audio("son_mort", a + "mort.mp3");
    this.load.audio("son_ennemi", a + "ennemi.mp3");
    this.load.audio("son_victoire", a + "victoire.mp3");
    this.load.audio("son_defaite", a + "defaite.mp3");
  }

  create() {
    var A = this.anims;
    if (!A.exists("anim_face")) {
      A.create({ key: "anim_tourne_droite", frames: A.generateFrameNumbers("img_perso", { start: 0, end: 9 }), frameRate: 14, repeat: -1 });
      A.create({ key: "anim_tourne_gauche", frames: A.generateFrameNumbers("img_perso", { start: 0, end: 9 }), frameRate: 14, repeat: -1 });
      A.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 0 }], frameRate: 20 });
      A.create({ key: "anim_tourne_droite_j2", frames: A.generateFrameNumbers("img_perso", { start: 10, end: 19 }), frameRate: 14, repeat: -1 });
      A.create({ key: "anim_tourne_gauche_j2", frames: A.generateFrameNumbers("img_perso", { start: 10, end: 19 }), frameRate: 14, repeat: -1 });
      A.create({ key: "anim_face_j2", frames: [{ key: "img_perso", frame: 10 }], frameRate: 20 });
      for (var i = 0; i < 3; i++) {
        A.create({ key: "anim_samourai_" + i, frames: A.generateFrameNumbers("img_samourai" + i, { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      }
      A.create({ key: "anim_boss", frames: A.generateFrameNumbers("img_boss", { start: 0, end: 5 }), frameRate: 7, repeat: -1 });
      A.create({ key: "anim_boss_attaque", frames: A.generateFrameNumbers("img_boss", { start: 6, end: 7 }), frameRate: 6, repeat: -1 });
      A.create({ key: "anim_bullet", frames: A.generateFrameNumbers("img_bullet", { start: 0, end: 3 }), frameRate: 16, repeat: -1 });
      A.create({ key: "anim_boule_feu", frames: A.generateFrameNumbers("img_boule_feu", { start: 0, end: 3 }), frameRate: 12, repeat: -1 });
      A.create({ key: "anim_ouvreporte", frames: A.generateFrameNumbers("img_porte", { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
      A.create({ key: "anim_fermeporte", frames: A.generateFrameNumbers("img_porte", { start: 5, end: 0 }), frameRate: 10, repeat: 0 });
    }
    this.scene.start("niveau1");
  }

  update() {
  }
}
