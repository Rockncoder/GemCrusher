(function () {
    "use strict";

    const MENU_SELECTION_NONE = 0;
    const MENU_SELECTION_PLAY = 1;
    const MENU_SELECTION_ABOUT = 2;
    const GEM_SIZE = 40;

    let gLastScore = 0;

    let FallingGemsLayer = cc.Layer.extend({
        ctor: function () {
            this._super();
        }
    });

    let SplashLayer = cc.Layer.extend({
        menuSelection: MENU_SELECTION_NONE,
        sprite: null,
        fallingGems: [],
        fallingGemsLayer: null,
        ctor: function () {
            this._super();

            let size = cc.winSize;
            this.fallingGems = [];

            this.sprite = new cc.Sprite(res.gamescene_background_png);
            this.sprite.attr({
                x: size.width / 2,
                y: size.height / 2
            });
            this.addChild(this.sprite, 0);

            let menuItemPlay = cc.MenuItemSprite.create(
                cc.Sprite.create(res.splashscene_btn_play_png),
                cc.Sprite.create(res.splashscene_btn_play_down_png),
                this.onPressPlay, this);
            let menuPlay = cc.Menu.create(menuItemPlay);
            menuPlay.setPosition(cc.p(cc.winSize.width / 2, cc.winSize.height / 2));
            this.addChild(menuPlay, 10);

            let menuItemAbout = cc.MenuItemSprite.create(
                cc.Sprite.create(res.splashscene_btn_about_png),
                cc.Sprite.create(res.splashscene_btn_about_down_png),
                this.onPressAbout, this);
            let menuAbout = cc.Menu.create(menuItemAbout);
            menuAbout.setPosition(cc.p(cc.winSize.width / 2, cc.winSize.height / 2 - menuItemPlay.getContentSize().height));
            this.addChild(menuAbout, 10);


            //cc.spriteFrameCache.addSpriteFrames(res.crystals_plist);

            cc.audioEngine.setMusicVolume(0.5);
            cc.audioEngine.setEffectsVolume(1.0);
            //cc.audioEngine.playMusic(res.sound_loop, true);

            this.fallingGemsLayer = new FallingGemsLayer();
            this.addChild(this.fallingGemsLayer, 0);

            this.scheduleUpdate();
            return true;
        },
        update: function (dt) {
            //console.log("updating");
            let gem;

            if (Math.random() < 0.02) {
                let type = Math.floor(Math.random() * 5);
                let sprite = new cc.Sprite("res/crystals/" + type + ".png");
                let x = Math.random() * this.fallingGemsLayer.getContentSize().width;
                let y = this.fallingGemsLayer.getContentSize().height + GEM_SIZE / 2;
                let scale = 0.2 + 0.8 * Math.random();
                let speed = 2 * scale * GEM_SIZE / 40;

                sprite.setPosition(x, y);
                sprite.setScale(scale);

                gem = {sprite: sprite, speed: speed};
                this.fallingGems.push(gem);
                this.fallingGemsLayer.addChild(sprite);
            }

            for (let [index, gem] of this.fallingGems.entries()) {
                let pos = gem.sprite.getPosition();
                pos.y -= gem.speed;
                gem.sprite.setPosition(pos);

                // check for sprite removal
                if (pos.y < -GEM_SIZE / 2) {
                    this.fallingGemsLayer.removeChild(gem.sprite, true);
                    this.fallingGems.splice(index, 1);
                }
            }
        },
        onPressPlay: function () {
            cc.audioEngine.playEffect(res.sound_click);
            this.menuSelection = MENU_SELECTION_PLAY;

            cc.director.runScene(new myGame.GameScene());
        },
        onPressAbout: function (menu) {
            cc.audioEngine.playEffect(res.sound_click);
            menu.setEnabled(false);
            this.menuSelection = MENU_SELECTION_ABOUT;
        }
    });

    myGame.SplashScene = cc.Scene.extend({
        onEnter: function () {
            this._super();
            this.addChild(new SplashLayer());
        }
    });
}());
