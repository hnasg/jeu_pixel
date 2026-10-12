var LARGEUR = 706;
var HAUTEUR = 360;
var TUILE = 36;
var VITESSE = 210;
var SAUT = 640;
var GRAVITE_DESCENTE = -650;
var COEURS = 5;

function prop(objet, nom, defaut) {
  var p = objet.properties;
  if (Array.isArray(p)) {
    var trouve = p.find(function (e) { return e.name === nom; });
    if (trouve) return trouve.value;
  } else if (p && p[nom] !== undefined) {
    return p[nom];
  }
  return defaut;
}

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

function tirer(player) {
  if (player.peutTirer == true) {
    var coefDir = (player.direction == "left") ? -1 : 1;
    var bullet = this.groupe_bullets.create(player.x + 25 * coefDir, player.y - 28, "img_bullet").setDepth(95).setScale(1.3);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.body.allowGravity = false;
    bullet.body.setSize(14, 14);
    bullet.setVelocity(560 * coefDir, 0);
    bullet.estBalle = true;
    bullet.anims.play("anim_bullet");
    this.son_feu.play();

    player.peutTirer = false;
    this.time.delayedCall(320, function () {
      player.peutTirer = true;
    }, null, this);
    this.time.delayedCall(1100, function () {
      if (bullet.active) bullet.destroy();
    }, null, this);
  }
}

function hit(uneBalle, unEnnemi) {
  if (unEnnemi.mort) return;
  if (!this.estVisible(uneBalle) || !this.estVisible(unEnnemi)) return;
  uneBalle.destroy();
  this.toucherEnnemi(unEnnemi, 1);
}

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  init() {
    this.fini = false;
    this.aLaCle = false;
    this.joueurs = [];
    this.player2 = null;
    this.porte = null;
  }

  preload() {
  }

  create() {
    this.partie = this.registry.get("partie");
    this.numero = 1;
    this.suivant = "niveau2";
    this.temps = 160;
    this.vitesseEnnemis = 45;
    this.delaiTirEnnemis = 6000;
    this.sound.stopAll();

    this.couches = [];
    var decor = [["img_ciel", 0, 0], ["img_nuages", 0.05, 0.012], ["img_fuji", 0.08, 0], ["img_montagne_fond", 0.15, 0],
      ["img_montagne_milieu", 0.25, 0], ["img_montagne_devant", 0.35, 0], ["img_maison", 0.6, 0]];
    decor.forEach(function (d, i) {
      var t = this.add.tileSprite(0, 0, LARGEUR, HAUTEUR, d[0]).setOrigin(0).setScrollFactor(0).setDepth(-100 + i);
      if (d[3]) t.setTint(d[3]);
      this.couches.push({ t: t, facteur: d[1], auto: d[2] });
    }, this);

    this.carteDuNiveau = this.add.tilemap("carte1");
    var tileset = this.carteDuNiveau.addTilesetImage("tuiles_de_jeu", "Phaser_tuilesdejeu");
    this.calque_background = this.carteDuNiveau.createLayer("calque_background", tileset).setDepth(-10);
    this.calque_background_2 = this.carteDuNiveau.createLayer("calque_background_2", tileset).setDepth(-9);
    this.calque_bois = this.carteDuNiveau.createLayer("calque_bois", tileset).setDepth(-6);
    this.calque_plateformes = this.carteDuNiveau.createLayer("calque_plateformes", tileset).setDepth(-5);

    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    if (this.calque_plateformes.findTile(function (t) { return t.index > -1 && t.collides; }) === null) {
      this.calque_plateformes.setCollisionByExclusion([-1]);
    }
    this.groupe_planches = this.physics.add.staticGroup();
    for (var ligne = 0; ligne < this.carteDuNiveau.height; ligne++) {
      var debut = -1;
      for (var col = 0; col <= this.carteDuNiveau.width; col++) {
        var t = (col < this.carteDuNiveau.width) ? this.calque_bois.getTileAt(col, ligne) : null;
        var plein = !!(t && t.index > -1);
        if (plein && debut < 0) debut = col;
        if (!plein && debut >= 0) {
          var largeur = (col - debut) * TUILE;
          var bloc = this.add.zone(debut * TUILE + largeur / 2, ligne * TUILE + 7, largeur, 14);
          this.physics.add.existing(bloc, true);
          this.groupe_planches.add(bloc);
          debut = -1;
        }
      }
    }
    this.largeurMonde = this.carteDuNiveau.widthInPixels;
    this.physics.world.setBounds(0, 0, this.largeurMonde, HAUTEUR + 140, true, true, true, true);

    this.groupe_ennemis = this.physics.add.group();
    this.groupe_bullets = this.physics.add.group();
    this.groupe_boules_feu = this.physics.add.group();
    this.groupe_cles = this.physics.add.group();
    this.groupe_torii = this.physics.add.staticGroup();

    this.spawns = {};
    var objets = this.carteDuNiveau.getObjectLayer("objets").objects;
    objets.forEach(function (o) {
      var nom = o.name || o.type;
      if (nom == "spawn_p1") this.spawns[1] = { x: o.x, y: o.y };
      else if (nom == "spawn_p2") this.spawns[2] = { x: o.x, y: o.y };
      else if (nom == "checkpoint") {
        var torii = this.groupe_torii.create(o.x, o.y, "img_torii").setOrigin(0.5, 1).setDepth(-3);
        torii.refreshBody();
        torii.actif = false;
      } else if (nom == "ennemi") {
        var skin = prop(o, "skin", 0) % 3;
        var e = this.groupe_ennemis.create(o.x, o.y, "img_samourai" + skin, 0).setOrigin(0.5, 1).setScale(2).setDepth(8);
        e.body.setSize(12, 29);
        e.body.setOffset(10, 3);
        e.setCollideWorldBounds(true);
        e.body.onWorldBounds = true;
        e.pv = prop(o, "pv", 2);
        e.vitesse = this.vitesseEnnemis;
        var portee = prop(o, "portee", 2) * TUILE;
        e.xMin = o.x - portee;
        e.xMax = o.x + portee;
        e.setVelocityX(-e.vitesse);
        e.anims.play("anim_samourai_" + skin);
        e.estEnnemi = true;
        e.immunite = 0;
        e.prochainTir = this.time.now + Phaser.Math.Between(5000, 8000);
      } else if (nom == "cle") {
        var cle = this.groupe_cles.create(o.x, o.y, "img_cle").setOrigin(0.5, 1);
        cle.body.setAllowGravity(false);
        this.tweens.add({ targets: cle, y: o.y - 8, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      } else if (nom == "porte") {
        this.porte = this.physics.add.staticSprite(o.x, o.y, "img_porte", 0).setOrigin(0.5, 1).setDepth(-2);
        this.porte.refreshBody();
        this.porte.ouverte = false;
        this.texte_porte = this.add.text(o.x, o.y - 135, "", style(14, "#fff2a8")).setOrigin(0.5).setDepth(95);
      }
    }, this);
    this.checkpoint = { x: this.spawns[1].x, y: this.spawns[1].y };

    for (var n = 1; n <= this.partie.mode; n++) {
      var s = this.spawns[n] || this.spawns[1];
      var p = this.physics.add.sprite(s.x, s.y, "img_perso", n == 1 ? 0 : 10).setOrigin(0.5, 1).setDepth(10);
      p.body.setSize(22, 52, false);
      p.body.setOffset(9, 6);
      p.setCollideWorldBounds(true);
      p.body.onWorldBounds = true;
      p.body.setMaxVelocityY(520);
      p.num = n;
      p.suffixe = (n == 1) ? "" : "_j2";
      p.frameSaut = (n == 1) ? 4 : 14;
      p.estJoueur = true;
      p.direction = "right";
      p.peutTirer = true;
      p.pv = COEURS;
      p.invincible = false;
      p.mort = false;
      this.joueurs.push(p);
    }
    this.player = this.joueurs[0];
    this.player2 = this.joueurs[1] || null;

    this.clavier = this.input.keyboard.createCursorKeys();
    this.boutonFeu = this.input.keyboard.addKey("M");
    this.J2Haut = this.input.keyboard.addKey("Z");
    this.J2Gauche = this.input.keyboard.addKey("Q");
    this.J2Droite = this.input.keyboard.addKey("D");
    this.J2Feu = this.input.keyboard.addKey("F");
    this.J2Inter = this.input.keyboard.addKey("E");

    this.musique_de_fond = this.sound.add("background", { loop: true, volume: 0.4 });
    this.son_feu = this.sound.add("coupDeFeu", { volume: 0.4 });
    this.son_saut = this.sound.add("son_saut", { volume: 0.35 });
    this.son_touche = this.sound.add("son_touche", { volume: 0.5 });
    this.son_cle = this.sound.add("son_cle", { volume: 0.6 });
    this.son_porte = this.sound.add("son_porte", { volume: 0.7 });
    this.son_levier = this.sound.add("son_levier", { volume: 0.7 });
    this.son_mort = this.sound.add("son_mort", { volume: 0.6 });
    this.son_ennemi = this.sound.add("son_ennemi", { volume: 0.5 });
    this.son_victoire = this.sound.add("son_victoire", { volume: 0.6 });

    this.physics.add.collider(this.joueurs, this.calque_plateformes);
    this.physics.add.collider(this.joueurs, this.groupe_planches);
    this.physics.add.collider(this.groupe_ennemis, this.calque_plateformes);
    this.physics.add.collider(this.groupe_ennemis, this.groupe_planches);
    this.physics.add.collider(this.groupe_bullets, this.calque_plateformes, function (b) { b.destroy(); });
    this.physics.add.collider(this.groupe_boules_feu, this.calque_plateformes, function (o) { o.destroy(); });
    this.physics.add.overlap(this.joueurs, this.groupe_cles, this.ramasserCle, null, this);
    this.physics.add.overlap(this.joueurs, this.groupe_torii, this.activerTorii, null, this);
    this.physics.add.overlap(this.joueurs, this.groupe_ennemis, this.chocAvecEnnemi, null, this);
    this.physics.add.overlap(this.groupe_bullets, this.groupe_ennemis, hit, null, this);
    this.physics.add.overlap(this.joueurs, this.groupe_boules_feu, function (p, o) { o.destroy(); this.blesser(p, o); }, null, this);

    this.physics.world.on("worldbounds", function (body, up, down, left, right) {
      var objet = body.gameObject;
      if (!objet || !objet.active) return;
      if (objet.estJoueur) {
        if (down == true) this.tomber(objet);
      } else if (objet.estBalle) {
        objet.destroy();
      } else if (objet.estBoule) {
        objet.destroy();
      } else if (objet.estEnnemi) {
        if (down == true) objet.destroy();
      }
    }, this);

    this.add.rectangle(0, 0, LARGEUR, 34, 0x2a1418, 0.55).setOrigin(0).setScrollFactor(0).setDepth(99);
    this.coeurs = {};
    this.joueurs.forEach(function (p) {
      var x0 = (p.num == 1) ? 8 : LARGEUR - 8 - COEURS * 26 - 28;
      this.add.text(x0, 7, "J" + p.num, style(15, p.num == 1 ? "#ff9aa8" : "#9ac0ff")).setScrollFactor(0).setDepth(100);
      this.coeurs[p.num] = [];
      for (var i = 0; i < COEURS; i++) {
        this.coeurs[p.num].push(this.add.image(x0 + 34 + i * 26, 18, "img_coeur", 0).setScrollFactor(0).setDepth(100));
      }
    }, this);
    this.txtScore = this.add.text(LARGEUR / 2, 17, "", style(16, "#ffe28a")).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.txtTemps = this.add.text(LARGEUR / 2 + 125, 17, "", style(14)).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.iconesCles = [];
    for (var k = 0; k < 3; k++) {
      this.iconesCles.push(this.add.image(LARGEUR / 2 - 123 + k * 26, 18, "img_cle").setScale(0.8).setScrollFactor(0).setDepth(100));
    }
    this.texte_message = this.add.text(LARGEUR / 2, 70, "", style(18, "#fff2a8", { align: "center", wordWrap: { width: LARGEUR - 80 } })).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.majHUD();

    this.cameras.main.setBounds(0, 0, this.largeurMonde, HAUTEUR);
    if (this.player2) {
      this.cibleCamera = this.add.zone(this.player.x, HAUTEUR / 2, 1, 1);
      this.cameras.main.startFollow(this.cibleCamera, true, 0.1, 0.1);
    } else {
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    this.timer_chrono = this.time.addEvent({
      delay: 1000,
      callback: function () {
        if (this.fini) return;
        this.temps--;
        this.majTemps();
        if (this.temps <= 0) this.perdre("Temps écoulé !");
      },
      args: [],
      callbackScope: this,
      repeat: -1
    });
    this.timer_tir_ennemis = this.time.addEvent({
      delay: 250,
      callback: function () {
        if (this.fini) return;
        var cam = this.cameras.main;
        var vivants = this.joueursVivants();
        if (!vivants.length) return;
        var maintenant = this.time.now;
        this.groupe_ennemis.getChildren().forEach(function (e) {
          if (!e.active || e.mort || e.estBoss) return;
          if (e.x < cam.scrollX + 30 || e.x > cam.scrollX + LARGEUR - 30) return;
          if (maintenant < e.prochainTir) return;
          var dir = e.flipX ? -1 : 1;
          var cible = null;
          vivants.forEach(function (j) {
            var dx = (j.x - e.x) * dir;
            if (dx < 50 || dx > 420) return;
            if (Math.abs(j.y - e.y) > 60) return;
            if (!this.ligneDeVueLibre(e.x, e.y - 30, j.x)) return;
            if (!cible || dx < (cible.x - e.x) * dir) cible = j;
          }, this);
          if (!cible) return;
          e.prochainTir = maintenant + this.delaiTirEnnemis;
          this.creerBouleDeFeu(e.x + dir * 22, e.y - 34, e.x + dir * 400, e.y - 34);
        }, this);
      },
      args: [],
      callbackScope: this,
      repeat: -1
    });

    this.musique_de_fond.play();
    this.message("NIVEAU 1 - Le village au pied du Fuji, en plein jour  (difficulté : *)", 3000);
    this.time.delayedCall(3100, function () { this.message("Objectif : trouve la clé dorée, perchée sur les plateformes hautes, puis prends la porte !", 4000); }, null, this);
  }

  update(temps) {
    var cam = this.cameras.main;
    this.couches.forEach(function (c) { c.t.tilePositionX = cam.scrollX * c.facteur + temps * c.auto; });
    if (this.fini) return;

    this.joueurs.forEach(function (p) {
      if (!p.mort && p.y > HAUTEUR + 40) this.tomber(p);
    }, this);

    if (!this.player.mort) {
      var auSol = this.player.body.blocked.down || this.player.body.touching.down;
      if (this.clavier.left.isDown) {
        this.player.setVelocityX(-VITESSE);
        this.player.direction = "left";
      } else if (this.clavier.right.isDown) {
        this.player.setVelocityX(VITESSE);
        this.player.direction = "right";
      } else {
        this.player.setVelocityX(0);
      }
      if (Phaser.Input.Keyboard.JustDown(this.clavier.up) && auSol) {
        this.player.setVelocityY(-SAUT);
        this.son_saut.play();
      }
      this.player.body.setGravityY(this.player.body.velocity.y > 0 ? GRAVITE_DESCENTE : 0);
      if (Phaser.Input.Keyboard.JustUp(this.clavier.up) && this.player.body.velocity.y < -250) {
        this.player.body.velocity.y = this.player.body.velocity.y * 0.5;
      }
      this.player.setFlipX(this.player.direction === "left");
      if (!auSol) {
        this.player.anims.stop();
        this.player.setFrame(4);
      } else if (Math.abs(this.player.body.velocity.x) > 10) {
        if (this.player.direction === "left") this.player.anims.play("anim_tourne_gauche", true);
        else this.player.anims.play("anim_tourne_droite", true);
      } else {
        this.player.anims.play("anim_face");
      }
      if (Phaser.Input.Keyboard.JustDown(this.boutonFeu) == true) tirer.call(this, this.player);
      if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
        if (this.porte && this.physics.overlap(this.player, this.porte) == true) this.ouvrirPorte();
      }
    }
    if (this.player2 && !this.player2.mort) {
      var auSol2 = this.player2.body.blocked.down || this.player2.body.touching.down;
      if (this.J2Gauche.isDown) {
        this.player2.setVelocityX(-VITESSE);
        this.player2.direction = "left";
      } else if (this.J2Droite.isDown) {
        this.player2.setVelocityX(VITESSE);
        this.player2.direction = "right";
      } else {
        this.player2.setVelocityX(0);
      }
      if (Phaser.Input.Keyboard.JustDown(this.J2Haut) && auSol2) {
        this.player2.setVelocityY(-SAUT);
        this.son_saut.play();
      }
      this.player2.body.setGravityY(this.player2.body.velocity.y > 0 ? GRAVITE_DESCENTE : 0);
      if (Phaser.Input.Keyboard.JustUp(this.J2Haut) && this.player2.body.velocity.y < -250) {
        this.player2.body.velocity.y = this.player2.body.velocity.y * 0.5;
      }
      this.player2.setFlipX(this.player2.direction === "left");
      if (!auSol2) {
        this.player2.anims.stop();
        this.player2.setFrame(14);
      } else if (Math.abs(this.player2.body.velocity.x) > 10) {
        if (this.player2.direction === "left") this.player2.anims.play("anim_tourne_gauche_j2", true);
        else this.player2.anims.play("anim_tourne_droite_j2", true);
      } else {
        this.player2.anims.play("anim_face_j2");
      }
      if (Phaser.Input.Keyboard.JustDown(this.J2Feu) == true) tirer.call(this, this.player2);
      if (Phaser.Input.Keyboard.JustDown(this.J2Inter) == true) {
        if (this.porte && this.physics.overlap(this.player2, this.porte) == true) this.ouvrirPorte();
      }
      [this.player, this.player2].forEach(function (p) {
        if (p.mort) return;
        var gMin = cam.scrollX + 22, gMax = cam.scrollX + LARGEUR - 22;
        if (p.x < gMin) { p.x = gMin; if (p.body.velocity.x < 0) p.setVelocityX(0); }
        if (p.x > gMax) { p.x = gMax; if (p.body.velocity.x > 0) p.setVelocityX(0); }
      });
    }

    this.groupe_bullets.getChildren().forEach(function (b) { if (b.active && !this.estVisible(b)) b.destroy(); }, this);

    this.groupe_ennemis.getChildren().forEach(function (e) {
      if (!e.active || e.mort) return;
      if (e.x <= e.xMin || e.body.blocked.left) e.setVelocityX(e.vitesse);
      if (e.x >= e.xMax || e.body.blocked.right) e.setVelocityX(-e.vitesse);
      if (!e.estBoss && e.body.blocked.down) {
        var devant = e.x + (e.body.velocity.x < 0 ? -22 : 22);
        if (!this.solSousLesPieds(devant, e.y + 6)) e.setVelocityX(e.body.velocity.x < 0 ? e.vitesse : -e.vitesse);
      }
      e.setFlipX(e.body.velocity.x < 0);
    }, this);

    if (this.cibleCamera) {
      var vivants = this.joueursVivants();
      if (vivants.length) {
        var somme = 0;
        vivants.forEach(function (p) { somme += p.x; });
        this.cibleCamera.x = somme / vivants.length;
        this.cibleCamera.y = HAUTEUR / 2;
      }
    }

    if (this.porte) {
      var surPorte = this.joueursVivants().some(function (p) { return this.physics.overlap(p, this.porte); }, this);
      this.texte_porte.setText(surPorte && !this.porte.ouverte ? (this.aLaCle ? "ESPACE / E : ouvrir" : "Porte verrouillée") : "");
    }
  }

  ramasserCle(p, c) {
    c.destroy();
    this.aLaCle = true;
    this.partie.cles[this.numero - 1] = true;
    this.partie.score += 200 * this.numero;
    this.son_cle.play();
    this.message("Clé récupérée ! Va à la porte (ESPACE / E)", 2500);
    this.majHUD();
  }

  activerTorii(p, t) {
    if (t.actif) return;
    t.actif = true;
    t.setTint(0x88ff99);
    this.checkpoint = { x: t.x, y: t.y };
    this.son_levier.play();
    this.message("Point de passage enregistré");
  }

  chocAvecEnnemi(p, e) {
    if (e.mort || p.mort) return;
    var dessus = p.body.velocity.y > 60 && (p.body.bottom - e.body.top) < 24;
    if (dessus) {
      if (this.time.now < e.immunite) return;
      e.immunite = this.time.now + 350;
      p.setVelocityY(-380);
      this.toucherEnnemi(e, 2);
    }
  }

  majHUD() {
    this.joueurs.forEach(function (p) {
      this.coeurs[p.num].forEach(function (c, i) { c.setFrame(i < p.pv ? 0 : 1); });
    }, this);
    this.txtScore.setText("Score " + this.partie.score);
    this.iconesCles.forEach(function (ic, i) {
      if (this.partie.cles[i]) ic.clearTint(); else ic.setTint(0x3a3038);
    }, this);
    this.majTemps();
  }

  majTemps() {
    var t = Math.max(0, this.temps);
    this.txtTemps.setText("Temps " + Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"));
  }

  message(texte, ms) {
    this.texte_message.setText(texte);
    if (this.timer_message) this.timer_message.remove(false);
    this.timer_message = this.time.delayedCall(ms || 2000, function () { this.texte_message.setText(""); }, null, this);
  }

  creerBouleDeFeu(x, y, versX, versY, echelle, vitesse) {
    echelle = echelle || 1;
    vitesse = vitesse || 140;
    var angle = Phaser.Math.Angle.Between(x, y, versX, versY);
    var o = this.groupe_boules_feu.create(x, y, "img_boule_feu").setDepth(95).setScale(echelle);
    o.body.setAllowGravity(false);
    o.body.setSize(14, 14);
    o.setRotation(angle);
    o.setVelocity(Math.cos(angle) * vitesse, Math.sin(angle) * vitesse);
    o.setCollideWorldBounds(true);
    o.body.onWorldBounds = true;
    o.estBoule = true;
    o.anims.play("anim_boule_feu");
    this.time.delayedCall(6500, function () { if (o.active) o.destroy(); }, null, this);
  }

  toucherEnnemi(e, degats) {
    e.pv -= degats;
    e.setTint(0xff7070);
    this.time.delayedCall(120, function () { if (e.active) e.clearTint(); }, null, this);
    this.son_touche.play();
    if (e.pv <= 0) this.tuerEnnemi(e);
  }

  tuerEnnemi(e) {
    e.mort = true;
    e.body.enable = false;
    this.partie.ennemis++;
    this.partie.score += 100;
    this.son_ennemi.play();
    this.tweens.add({ targets: e, alpha: 0, y: e.y - 20, scaleY: 0.3, duration: 350, onComplete: function () { e.destroy(); } });
    this.majHUD();
  }

  blesser(p, source) {
    if (p.invincible || p.mort || this.fini) return;
    this.partie.score = Math.max(0, this.partie.score - 50);
    this.perdreUnCoeur(p, "est touché");
  }

  tomber(p) {
    this.perdreUnCoeur(p, "est tombé");
  }

  perdreUnCoeur(p, cause) {
    if (p.mort || this.fini) return;
    p.pv--;
    this.son_mort.play();
    p.mort = true;
    p.setVelocity(0, 0);
    p.body.enable = false;
    p.setVisible(false);
    this.majHUD();
    if (p.pv <= 0) { this.eliminer(p); return; }
    this.message("J" + p.num + " " + cause + " : -1 coeur ! Retour au checkpoint...", 1400);
    this.time.delayedCall(1000, function () { this.reapparaitre(p); }, null, this);
  }

  eliminer(p) {
    p.elimine = true;
    this.son_mort.play();
    this.majHUD();
    var tousElimines = this.joueurs.every(function (j) { return j.elimine === true; });
    if (tousElimines) this.perdre("Tous les coeurs sont perdus !");
    else this.message("J" + p.num + " est éliminé !", 2000);
  }

  reapparaitre(p) {
    this.groupe_boules_feu.getChildren().slice().forEach(function (o) { o.destroy(); });
    this.groupe_ennemis.getChildren().forEach(function (e) {
      if (e.estEnnemi) e.prochainTir = Math.max(e.prochainTir || 0, this.time.now + 3000);
    }, this);
    if (this.fini) return;
    p.body.enable = true;
    p.body.reset(this.checkpoint.x + (p.num == 1 ? -14 : 14), this.checkpoint.y);
    p.setVisible(true).setAlpha(1);
    p.mort = false;
    p.invincible = true;
    this.time.delayedCall(2000, function () { p.invincible = false; }, null, this);
    this.tweens.add({ targets: p, alpha: 0.3, duration: 90, yoyo: true, repeat: 10, onComplete: function () { p.setAlpha(1); } });
    this.majHUD();
  }

  joueursVivants() {
    return this.joueurs.filter(function (p) { return !p.mort; });
  }

  perdre(raison) {
    if (this.fini) return;
    this.fini = true;
    this.musique_de_fond.stop();
    this.joueurs.forEach(function (p) { if (p.body && p.body.enable) p.setVelocity(0, 0); });
    this.sound.add("son_defaite", { volume: 0.7 }).play();
    var voile = this.add.rectangle(0, 0, LARGEUR, HAUTEUR, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(200).setAlpha(0);
    var bande = this.add.rectangle(0, HAUTEUR / 2, LARGEUR, 120, 0x000000, 0.8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201).setAlpha(0);
    var texte = this.add.text(LARGEUR / 2, HAUTEUR / 2, "WASTED", { fontFamily: "Impact, Arial Black, sans-serif", fontSize: "96px", color: "#c81e1e", stroke: "#000000", strokeThickness: 8 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(202).setAlpha(0).setScale(1.7);
    this.tweens.add({ targets: voile, alpha: 0.55, duration: 900 });
    this.tweens.add({ targets: [bande, texte], alpha: 1, duration: 700, delay: 300 });
    this.tweens.add({ targets: texte, scale: 1, duration: 900, delay: 300, ease: "Cubic.easeOut" });
    this.time.delayedCall(3000, function () {
      this.scene.start("gameover", { niveau: this.scene.key, raison: raison });
    }, null, this);
  }

  ouvrirPorte() {
    if (this.porte.ouverte) return;
    if (!this.aLaCle) {
      this.son_touche.play();
      this.message("Il te faut la clé !");
      return;
    }
    this.porte.ouverte = true;
    this.son_porte.play();
    this.porte.anims.play("anim_ouvreporte");
    this.time.delayedCall(900, function () {
      this.fini = true;
      var bonus = this.temps * 2;
      this.partie.score += bonus;
      this.joueurs.forEach(function (p) { if (p.body.enable) p.setVelocity(0, 0); });
      this.son_victoire.play();
      this.message("Niveau terminé !  Bonus temps : +" + bonus + (this.suivant == "fin" ? "" : "\nDirection le niveau " + (this.numero + 1) + " !"), 2500);
      this.majHUD();
      this.time.delayedCall(2300, function () {
        this.musique_de_fond.stop();
        this.scene.start(this.suivant);
      }, null, this);
    }, null, this);
  }

  estVisible(obj) {
    var cam = this.cameras.main;
    return obj.x > cam.scrollX && obj.x < cam.scrollX + LARGEUR && obj.y > cam.scrollY && obj.y < cam.scrollY + HAUTEUR;
  }

  ligneDeVueLibre(x1, y, x2) {
    var pas = (x2 > x1) ? 18 : -18;
    for (var x = x1; (pas > 0) ? x < x2 : x > x2; x += pas) {
      var t = this.calque_plateformes.getTileAtWorldXY(x, y);
      if (t && t.index > -1) return false;
    }
    return true;
  }

  solSousLesPieds(x, y) {
    var t1 = this.calque_plateformes.getTileAtWorldXY(x, y);
    var t2 = this.calque_bois.getTileAtWorldXY(x, y);
    return !!((t1 && t1.index > -1) || (t2 && t2.index > -1));
  }
}
