(function () {
    "use strict";

    let kGemSize = 80;
    let kBoardWidth = 8;
    let kBoardHeight = 10;
    let kNumTotalGems = kBoardWidth * kBoardHeight;
    let kTimeBetweenGemAdds = 8;
//    let kTotalGameTime = 1000 * 60;
    let kTotalGameTime = 1000 * 360;
    let kIntroTime = 1800;
    let kNumRemovalFrames = 8;
    let kDelayBeforeHint = 3000;
    let kMaxTimeBetweenConsecutiveMoves = 1000;

    let kGameOverGemSpeed = 0.1;
    let kGameOverGemAcceleration = 0.005;

    let kBoardTypeGem0 = 0;
    let kBoardTypeGem1 = 1;
    let kBoardTypeGem2 = 2;
    let kBoardTypeGem3 = 3;
    let kBoardTypeGem4 = 4;
    let kBoardTypePup0 = 5;

    let gFallingGems;
    let gBoard;
    let gBoardSprites;
    let gNumGemsInColumn;
    let gTimeSinceAddInColumn;

    let gLastTakenGemTime;
    let gNumConsecutiveGems;
    let gIsPowerPlay;
    let gPowerPlayParticles;
    let gPowerPlayLayer;

    let gGameLayer;
    let gParticleLayer;
    let gHintLayer;
    let gShimmerLayer;
    let gEffectsLayer;

    let gTimer;

    let gStartTime;
    let gLastMoveTime;
    let gIsDisplayingHint;

    let gBoardChangedSinceEvaluation;
    let gPossibleMove;

    let gIsGameOver;
    let gGameOverGems;
    let gScoreLabel;
    let gEndTimerStarted;

    let gameLayer;

    function setupBoard() {
        gBoard = [];
        for (let i = 0; i < kNumTotalGems; i++) {
            gBoard[i] = -1;
        }

        gBoardSprites = [];
        gNumGemsInColumn = [];
        gTimeSinceAddInColumn = [];

        let x;

        for (x = 0; x < kBoardWidth; x++) {
            gNumGemsInColumn[x] = 0;
            gTimeSinceAddInColumn[x] = 0;
        }

        gFallingGems = [];
        for (x = 0; x < kBoardWidth; x++) {
            gFallingGems[x] = [];
        }

        gBoardChangedSinceEvaluation = true;
        gPossibleMove = -1;
    }

    function findConnectedGems_(x, y, arr, gemType) {
        // Check for bounds
        if (x < 0 || x >= kBoardWidth) return;
        if (y < 0 || y >= kBoardHeight) return;

        let idx = x + y * kBoardWidth;

        // Make sure that the gems type match
        if (gBoard[idx] != gemType) return;


        // Check if idx is already visited
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == idx) return;
        }

        // Add idx to array
        arr.push(idx);

        // Visit neighbors
        findConnectedGems_(x + 1, y, arr, gemType);
        findConnectedGems_(x - 1, y, arr, gemType);
        findConnectedGems_(x, y + 1, arr, gemType);
        findConnectedGems_(x, y - 1, arr, gemType);
    }

    function findConnectedGems(x, y) {
        let connected = [];
        if (gBoard[x + y * kBoardWidth] <= -1) return connected;

        findConnectedGems_(x, y, connected, gBoard[x + y * kBoardWidth]);

        return connected;
    }

    function removeConnectedGems(x, y) {
        // Check for bounds
        if (x < 0 || x >= kBoardWidth) return;
        if (y < 0 || y >= kBoardHeight) return;

        let connected = findConnectedGems(x, y);
        let removedGems = false;

        if (connected.length >= 3) {
            gBoardChangedSinceEvaluation = true;
            removedGems = true;

            addScore(100 * connected.length);

            let idxPup = -1;
            let pupX;
            let pupY;
            if (connected.length >= 6) {
                // Add power-up
                idxPup = connected[Math.floor(Math.random() * connected.length)];
                pupX = idxPup % kBoardWidth;
                pupY = Math.floor(idxPup / kBoardWidth);
            }

            for (let i = 0; i < connected.length; i++) {
                let idx = connected[i];
                let gemX = idx % kBoardWidth;
                let gemY = Math.floor(idx / kBoardWidth);

                gBoard[idx] = -kNumRemovalFrames;
                gGameLayer.removeChild(gBoardSprites[idx], true);
                gBoardSprites[idx] = null;

                // Add particle effect
                let particle = cc.ParticleSystem.create("res/particles/taken-gem.plist");
                particle.setPosition(gemX * kGemSize + kGemSize / 2, gemY * kGemSize + kGemSize / 2);
                particle.setAutoRemoveOnFinish(true);
                gParticleLayer.addChild(particle);

                // Add power-up
                if (idx == idxPup) {
                    gBoard[idx] = kBoardTypePup0;

                    let sprt = new cc.Sprite("res/crystals/bomb.png");
                    sprt.setPosition(gemX * kGemSize, gemY * kGemSize);
                    sprt.setAnchorPoint(0, 0);
                    sprt.setOpacity(0);
                    sprt.runAction(cc.FadeIn.create(0.4));

                    let sprtGlow = new cc.Sprite("res/crystals/bomb-hi.png");
                    sprtGlow.setAnchorPoint(0, 0);
                    sprtGlow.setOpacity(0);
                    sprtGlow.runAction(cc.RepeatForever.create(cc.Sequence.create(cc.FadeIn.create(0.4), cc.FadeOut.create(0.4))));
                    sprt.addChild(sprtGlow);

                    gBoardSprites[idx] = sprt;
                    gGameLayer.addChild(sprt);
                }
                else if (idxPup != -1) {
                    // Animate effect for power-up
                    let sprtLight = new cc.Sprite("res/crystals/bomb-light.png");
                    sprtLight.setPosition(gemX * kGemSize + kGemSize / 2, gemY * kGemSize + kGemSize / 2);
                    sprtLight.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
                    gEffectsLayer.addChild(sprtLight);

                    let movAction = cc.MoveTo.create(0.2, cc.p(pupX * kGemSize + kGemSize / 2, pupY * kGemSize + kGemSize / 2));
                    let seqAction = cc.Sequence.create(movAction, cc.CallFunc.create(onRemoveFromParent, this));

                    sprtLight.runAction(seqAction);
                }
            }
        }
        else {
            cc.audioEngine.playEffect(res.sound_miss);
        }

        gLastMoveTime = Date.now();

        return removedGems;
    }

    function activatePowerUp(x, y) {
        // Check for bounds
        if (x < 0 || x >= kBoardWidth) return;
        if (y < 0 || y >= kBoardHeight) return;

        let removedGems = false;

        let idx = x + y * kBoardWidth;
        if (gBoard[idx] == kBoardTypePup0) {
            // Activate bomb
            cc.audioEngine.playEffect(res.sound_powerup);

            removedGems = true;

            addScore(2000);

            gBoard[idx] = -kNumRemovalFrames;
            gGameLayer.removeChild(gBoardSprites[idx], true);
            gBoardSprites[idx] = null;

            // Remove a horizontal line
            let idxRemove;
            for (let xRemove = 0; xRemove < kBoardWidth; xRemove++) {
                idxRemove = xRemove + y * kBoardWidth;
                if (gBoard[idxRemove] >= 0 && gBoard[idxRemove] < 5) {
                    gBoard[idxRemove] = -kNumRemovalFrames;
                    gGameLayer.removeChild(gBoardSprites[idxRemove], true);
                    gBoardSprites[idxRemove] = null;
                }
            }

            // Remove a vertical line
            for (let yRemove = 0; yRemove < kBoardHeight; yRemove++) {
                idxRemove = x + yRemove * kBoardWidth;
                if (gBoard[idxRemove] >= 0 && gBoard[idxRemove] < 5) {
                    gBoard[idxRemove] = -kNumRemovalFrames;
                    gGameLayer.removeChild(gBoardSprites[idxRemove], true);
                    gBoardSprites[idxRemove] = null;
                }
            }

            // Add particle effects
            let hp = cc.ParticleSystem.create("res/particles/taken-hrow.plist");
            hp.setPosition(kBoardWidth / 2 * kGemSize + kGemSize / 2, y * kGemSize + kGemSize / 2);
            hp.setAutoRemoveOnFinish(true);
            gParticleLayer.addChild(hp);

            let vp = cc.ParticleSystem.create("res/particles/taken-vrow.plist");
            vp.setPosition(x * kGemSize + kGemSize / 2, kBoardHeight / 2 * kGemSize + kGemSize / 2);
            vp.setAutoRemoveOnFinish(true);
            gParticleLayer.addChild(vp);

            // Add explo anim
            let center = cc.p(x * kGemSize + kGemSize / 2, y * kGemSize + kGemSize / 2);

            // Horizontal
            let sprtH0 = new cc.Sprite("res/crystals/bomb-explo.png");
            sprtH0.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
            sprtH0.setPosition(center);
            sprtH0.setScaleX(5);
            sprtH0.runAction(cc.ScaleTo.create(0.5, 30, 1));
            sprtH0.runAction(cc.Sequence.create(cc.FadeOut.create(0.5), cc.CallFunc.create(onRemoveFromParent, this)));
            gEffectsLayer.addChild(sprtH0);

            // Vertical
            let sprtV0 = new cc.Sprite("res/crystals/bomb-explo.png");
            sprtV0.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
            sprtV0.setPosition(center);
            sprtV0.setScaleY(5);
            sprtV0.runAction(cc.ScaleTo.create(0.5, 1, 30));
            sprtV0.runAction(cc.Sequence.create(cc.FadeOut.create(0.5), cc.CallFunc.create(onRemoveFromParent, this)));
            gEffectsLayer.addChild(sprtV0);

            // Horizontal
            let sprtH1 = new cc.Sprite("res/crystals/bomb-explo-inner.png");
            sprtH1.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
            sprtH1.setPosition(center);
            sprtH1.setScaleX(0.5);
            sprtH1.runAction(cc.ScaleTo.create(0.5, 8, 1));
            sprtH1.runAction(cc.Sequence.create(cc.FadeOut.create(0.5), cc.CallFunc.create(onRemoveFromParent, this)));
            gEffectsLayer.addChild(sprtH1);

            // Vertical
            let sprtV1 = new cc.Sprite("res/crystals/bomb-explo-inner.png");
            sprtV1.setRotation(90);
            sprtV1.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
            sprtV1.setPosition(center);
            sprtV1.setScaleY(0.5);
            sprtV1.runAction(cc.ScaleTo.create(0.5, 8, 1));
            sprtV1.runAction(cc.Sequence.create(cc.FadeOut.create(0.5), cc.CallFunc.create(onRemoveFromParent, this)));
            gEffectsLayer.addChild(sprtV1);
        }

        return removedGems;
    }

    function removeMarkedGems() {
        // Iterate through the board
        for (let x = 0; x < kBoardWidth; x++) {
            for (let y = 0; y < kBoardHeight; y++) {
                let i = x + y * kBoardWidth;

                if (gBoard[i] < -1) {
                    // Increase the count for negative crystal types
                    gBoard[i]++;
                    if (gBoard[i] == -1) {
                        gNumGemsInColumn[x]--;
                        gBoardChangedSinceEvaluation = true;

                        // Transform any gem above this to a falling gem
                        for (let yAbove = y + 1; yAbove < kBoardHeight; yAbove++) {
                            let idxAbove = x + yAbove * kBoardWidth;

                            if (gBoard[idxAbove] < -1) {
                                gNumGemsInColumn[x]--;
                                gBoard[idxAbove] = -1;
                            }
                            if (gBoard[idxAbove] == -1) continue;

                            // The gem is not connected, make it into a falling gem
                            let gemType = gBoard[idxAbove];
                            let gemSprite = gBoardSprites[idxAbove];

                            let gem = {gemType: gemType, sprite: gemSprite, yPos: yAbove, ySpeed: 0};
                            gFallingGems[x].push(gem);

                            // Remove from board
                            gBoard[idxAbove] = -1;
                            gBoardSprites[idxAbove] = null;

                            gNumGemsInColumn[x]--;
                        }

                    }
                }
            }
        }
    }

    function getGemType(x, y) {
        if (x < 0 || x >= kBoardWidth) return -1;
        if (y < 0 || y >= kBoardHeight) return -1;

        return gBoard[x + y * kBoardWidth];
    }

    function setGemType(x, y, newType) {
        // Check bounds
        if (x < 0 || x >= kBoardWidth) return;
        if (y < 0 || y >= kBoardHeight) return;

        // Get the type of the gem
        let idx = x + y * kBoardWidth;
        let gemType = gBoard[idx];

        // Make sure that it is a gem
        if (gemType < 0 || gemType >= 5) return;

        gBoard[idx] = newType;

        // Remove old gem and insert a new one
        gGameLayer.removeChild(gBoardSprites[idx], true);

        let gemSprite = new cc.Sprite("res/crystals/" + newType + ".png");
        gemSprite.setPosition(x * kGemSize, y * kGemSize);
        gemSprite.setAnchorPoint(0, 0);

        gGameLayer.addChild(gemSprite);
        gBoardSprites[idx] = gemSprite;

        gBoardChangedSinceEvaluation = true;
    }

    function findMove() {
        if (!gBoardChangedSinceEvaluation) {
            return gPossibleMove;
        }

        // Iterate through all places on the board
        for (let y = 0; y < kBoardHeight; y++) {
            for (let x = 0; x < kBoardWidth; x++) {
                let idx = x + y * kBoardWidth;
                let gemType = gBoard[idx];

                // Make sure that it is a gem
                if (gemType < 0 || gemType >= 5) continue;

                // Check surrounding tiles
                let numSimilar = 0;

                if (getGemType(x - 1, y) == gemType) numSimilar++;
                if (getGemType(x + 1, y) == gemType) numSimilar++;
                if (getGemType(x, y - 1) == gemType) numSimilar++;
                if (getGemType(x, y + 1) == gemType) numSimilar++;

                if (numSimilar >= 2) {
                    gPossibleMove = idx;
                    return idx;
                }
            }
        }
        gBoardChangedSinceEvaluation = false;
        gPossibleMove = -1;
        return -1;
    }

    function createRandomMove() {
        // Find a random place in the lower part of the board
        let x = Math.floor(Math.random() * kBoardWidth - 1);
        let y = Math.floor(Math.random() * kBoardHeight / 2);

        // Make sure it is a gem that we found
        let gemType = gBoard[x + y * kBoardWidth];
        if (gemType == -1 || gemType >= 5) return;

        // Change the color of two surrounding gems
        setGemType(x + 1, y, gemType);
        setGemType(x, y + 1, gemType);

        gBoardChangedSinceEvaluation = true;
    }

    function createGameOver() {
        gGameOverGems = [];

        for (let x = 0; x < kBoardWidth; x++) {
            let column = gFallingGems[x];
            for (let i = 0; i < column.length; i++) {
                let gem = column[i];

                let ySpeed = (Math.random() * 2 - 1) * kGameOverGemSpeed;
                let xSpeed = (Math.random() * 2 - 1) * kGameOverGemSpeed;

                let gameOverGem = {sprite: gem.sprite, xPos: x, yPos: gem.yPos, ySpeed: ySpeed, xSpeed: xSpeed};
                gGameOverGems.push(gameOverGem);
            }

            for (let y = 0; y < kBoardHeight; y++) {
                let i1 = x + y * kBoardWidth;
                if (gBoardSprites[i1]) {
                    let ySpeed1 = (Math.random() * 2 - 1) * kGameOverGemSpeed;
                    let xSpeed1 = (Math.random() * 2 - 1) * kGameOverGemSpeed;

                    let gameOverGem1 = {sprite: gBoardSprites[i1], xPos: x, yPos: y, ySpeed: ySpeed1, xSpeed: xSpeed1};
                    gGameOverGems.push(gameOverGem1);
                }
            }
        }

        gHintLayer.removeAllChildren(true);

        removeShimmer();
    }

    function updateGameOver() {
        for (let i = 0; i < gGameOverGems.length; i++) {
            let gem = gGameOverGems[i];

            gem.xPos = gem.xPos + gem.xSpeed;
            gem.yPos = gem.yPos + gem.ySpeed;
            gem.ySpeed -= kGameOverGemAcceleration;

            gem.sprite.setPosition(gem.xPos * kGemSize, gem.yPos * kGemSize);
        }
    }

    function displayHint() {
        gIsDisplayingHint = true;

        let idx = findMove();
        let x = idx % kBoardWidth;
        let y = Math.floor(idx / kBoardWidth);

        let connected = findConnectedGems(x, y);

        for (let i = 0; i < connected.length; i++) {
            idx = connected[i];
            x = idx % kBoardWidth;
            y = Math.floor(idx / kBoardWidth);

            let actionFadeIn = cc.FadeIn.create(0.5);
            let actionFadeOut = cc.FadeOut.create(0.5);
            let actionSeq = cc.Sequence.create(actionFadeIn, actionFadeOut);
            let action = cc.RepeatForever.create(actionSeq);

            let hintSprite = new cc.Sprite("res/crystals/hint.png");
            hintSprite.setOpacity(0);
            hintSprite.setPosition(x * kGemSize, y * kGemSize);
            hintSprite.setAnchorPoint(0, 0);
            gHintLayer.addChild(hintSprite);
            hintSprite.runAction(action);
        }
    }

    function debugPrintBoard() {
        for (let y = kBoardHeight - 1; y >= 0; y--) {
            let i = kBoardWidth * y;
            cc.log("" + gBoard[i] + gBoard[i + 1] + gBoard[i + 2] + gBoard[i + 3] + gBoard[i + 4] + gBoard[i + 5] + gBoard[i + 6] + gBoard[i + 7]);
        }
        cc.log("--------");
        cc.log("" + gNumGemsInColumn[0] + " " + gNumGemsInColumn[1] + " " + gNumGemsInColumn[2] + " " + gNumGemsInColumn[3] + " " +
            gNumGemsInColumn[4] + " " + gNumGemsInColumn[5] + " " + gNumGemsInColumn[6] + " " + gNumGemsInColumn[7]);
    }

    function setupShimmer() {
        cc.SpriteFrameCache.getInstance().addSpriteFrames("res/gamescene/shimmer.plist");

        for (let i = 0; i < 2; i++) {
            let sprt = new cc.Sprite("res/gamescene/shimmer/bg-shimmer-" + i + ".png");
            let seqRot = null;
            let seqMov = null;
            let seqSca = null;

            let x;
            let y;
            let rot;

            for (let j = 0; j < 10; j++) {
                let time = Math.random() * 10 + 5;
                x = kBoardWidth * kGemSize / 2;
                y = Math.random() * kBoardHeight * kGemSize;
                rot = Math.random() * 180 - 90;
                let scale = Math.random() * 3 + 3;

                let actionRot = cc.EaseInOut.create(cc.RotateTo.create(time, rot), 2);
                let actionMov = cc.EaseInOut.create(cc.MoveTo.create(time, cc.p(x, y)), 2);
                let actionSca = cc.ScaleTo.create(time, scale);

                if (!seqRot) {
                    seqRot = actionRot;
                    seqMov = actionMov;
                    seqSca = actionSca;
                }
                else {
                    seqRot = cc.Sequence.create(seqRot, actionRot);
                    seqMov = cc.Sequence.create(seqMov, actionMov);
                    seqSca = cc.Sequence.create(seqSca, actionSca);
                }
            }

            x = kBoardWidth * kGemSize / 2;
            y = Math.random() * kBoardHeight * kGemSize;
            rot = Math.random() * 180 - 90;

            sprt.setPosition(x, y);
            sprt.setRotation(rot);

            sprt.setPosition(kBoardWidth * kGemSize / 2, kBoardHeight * kGemSize / 2);
            sprt.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
            sprt.setScale(3);

            gShimmerLayer.addChild(sprt);
            sprt.setOpacity(0);
            sprt.runAction(cc.RepeatForever.create(seqRot));
            sprt.runAction(cc.RepeatForever.create(seqMov));
            sprt.runAction(cc.RepeatForever.create(seqSca));

            sprt.runAction(cc.FadeIn.create(2));
        }
    }

    function removeShimmer() {
        let children = gShimmerLayer.getChildren();
        for (let i = 0; i < children.length; i++) {
            children[i].runAction(cc.FadeOut.create(1));
        }
    }

    function updateSparkle() {
        if (Math.random() > 0.1) return;
        let idx = Math.floor(Math.random() * kNumTotalGems);
        let gemSprite = gBoardSprites[idx];
        if (gBoard[idx] < 0 || gBoard[idx] >= 5) return;
        if (!gemSprite) return;

        if (gemSprite.getChildren().length > 0) return;

        let sprite = new cc.Sprite("res/crystals/sparkle.png");
        sprite.runAction(cc.RepeatForever.create(cc.RotateBy.create(3, 360)));

        sprite.setOpacity(0);

        sprite.runAction(cc.Sequence.create(
            cc.FadeIn.create(0.5),
            cc.FadeOut.create(2),
            cc.CallFunc.create(onRemoveFromParent, this)));

        sprite.setPosition(kGemSize * (2 / 6), kGemSize * (4 / 6));

        gemSprite.addChild(sprite);
    }

    function onRemoveFromParent(node, value) {
        node.getParent().removeChild(node, true);
    }

    function updatePowerPlay() {
        let powerPlay = (gNumConsecutiveGems >= 5);
        if (powerPlay == gIsPowerPlay) return;

        if (powerPlay) {
            // Start power-play
            gPowerPlayParticles = cc.ParticleSystem.create("particles/power-play.plist");
            gPowerPlayParticles.setAutoRemoveOnFinish(true);
            gParticleLayer.addChild(gPowerPlayParticles);

            if ('opengl' in sys.capabilities) {

                let contentSize = gGameLayer.getContentSize();
                gPowerPlayLayer = cc.LayerColor.create(cc.c4b(85, 0, 70, 0), contentSize.width, contentSize.height);

                let action = cc.Sequence.create(cc.FadeIn.create(0.25), cc.FadeOut.create(0.25));
                gPowerPlayLayer.runAction(cc.RepeatForever.create(action));
                gPowerPlayLayer.setBlendFunc(gl.SRC_ALPHA, gl.ONE);

                gEffectsLayer.addChild(gPowerPlayLayer);
            }

        }
        else {
            // Stop power-play
            if (gPowerPlayParticles) {
                gPowerPlayParticles.stopSystem();

                if ('opengl' in sys.capabilities) {
                    gPowerPlayLayer.stopAllActions();
                    gPowerPlayLayer.runAction(cc.Sequence.create(cc.FadeOut.create(0.5), cc.CallFunc.create(onRemoveFromParent, this)));
                }
            }
        }

        gIsPowerPlay = powerPlay;
    }

    function addScore(score) {
        if (gIsPowerPlay) score *= 3;
        myGame.gScore += score;
        // gScoreLabel.setString("" + myGame.gScore);
    }


    let GameLayer = cc.Layer.extend({
        sprite: null,
        sprtTimer: null,
        sprtHeader: null,
        ctor: function () {
            this._super();

            gameLayer = this;

            let size = cc.winSize;
            this.sprite = new cc.Sprite(res.gamescene_background_png);
            this.sprite.attr({
                x: size.width / 2,
                y: size.height / 2
            });
            this.addChild(this.sprite, 0);


            // Setup board
            setupBoard();

            gIsGameOver = false;
            gIsDisplayingHint = false;

            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                swallowTouch: true,
                onTouchBegan: this.onTouchBegan,
                onTouchMoved: this.onTouchMoved,
                onTouchEnded: this.onTouchEnded
            }, this);


            // Setup timer
            this.sprtTimer = new cc.Sprite(res.gamescene_timer_png);
            this.sprtTimer.attr({
                x: size.width / 2,
                y: size.height - this.sprtTimer.getContentSize().height
            });

            this.sprtTimer.setVisible(false);
            gTimer = cc.ProgressTimer.create(new cc.Sprite("res/gamescene/timer.png"));
            gTimer.setPosition(this.sprtTimer.getPosition());
            gTimer.setPercentage(100);
            gTimer.setType(cc.ProgressTimer.TYPE_BAR);
            gTimer.setMidpoint(cc.p(0, 0.5));
            gTimer.setBarChangeRate(cc.p(1, 0));
            this.addChild(gTimer);

            let dNow = Date.now();
            gStartTime = dNow + kIntroTime;
            gLastMoveTime = dNow;
            gNumConsecutiveGems = 0;
            gIsPowerPlay = false;
            gEndTimerStarted = false;

            myGame.gScore = 0;

            gParticleLayer = cc.Node.create();
            gGameLayer = cc.Node.create();


            gGameLayer.setContentSize(this.getContentSize());
            gHintLayer = cc.Node.create();
            gShimmerLayer = cc.Node.create();
            gEffectsLayer = cc.Node.create();
            //
            this.addChild(gShimmerLayer, -1);
            this.addChild(gParticleLayer, 1);
            this.addChild(gGameLayer, 0);
            this.addChild(gHintLayer, 3);
            this.addChild(gEffectsLayer, 2);

            // Setup callback for completed animations
            // this.rootNode.animationManager.setCompletedAnimationCallback(this, this.onAnimationComplete);

            setupShimmer();
            // gScoreLabel = this.lblScore;

            this.scheduleUpdate();
            return true;
        },
        update: function (dt) {
            if (gIsGameOver) {
                updateGameOver();
                return;
            }

            let x;
            let gem;
            removeMarkedGems();


            // Add falling gems
            for (x = 0; x < kBoardWidth; x++) {
                if (gNumGemsInColumn[x] + gFallingGems[x].length < kBoardHeight &&
                    gTimeSinceAddInColumn[x] >= kTimeBetweenGemAdds) {
                    // A gem should be added to this column!
                    let gemType = Math.floor(Math.random() * 5);
                    let gemSprite = new cc.Sprite("res/crystals/" + gemType + ".png");
                    gemSprite.setPosition(x * kGemSize, kBoardHeight * kGemSize);
                    gemSprite.setAnchorPoint(0, 0);

                    gem = {gemType: gemType, sprite: gemSprite, yPos: kBoardHeight, ySpeed: 0};
                    gFallingGems[x].push(gem);

                    gGameLayer.addChild(gemSprite);

                    gTimeSinceAddInColumn[x] = 0;
                }

                gTimeSinceAddInColumn[x]++;
            }

            // Move falling gems
            let gemLanded = false;
            for (x = 0; x < kBoardWidth; x++) {
                let column = gFallingGems[x];
                let numFallingGems = gFallingGems[x].length;
                for (let i = numFallingGems - 1; i >= 0; i--) {
                    gem = column[i];

                    gem.ySpeed += 0.06;
                    gem.ySpeed *= 0.99;
                    gem.yPos -= gem.ySpeed;

                    if (gem.yPos <= gNumGemsInColumn[x]) {
                        // The gem hit the ground or a fixed gem
                        if (!gemLanded) {
                            cc.audioEngine.playEffect("res/sounds/tap-" + Math.floor(Math.random() * 4) + ".mp3");
                            gemLanded = true;
                        }

                        column.splice(i, 1);

                        // Insert into board
                        let y = gNumGemsInColumn[x];

                        if (gBoard[x + y * kBoardWidth] != -1) {
                            cc.log("Warning! Overwriting board idx: " + x + y * kBoardWidth + " type: " + gBoard[x + y * kBoardWidth]);
                        }

                        gBoard[x + y * kBoardWidth] = gem.gemType;
                        gBoardSprites[x + y * kBoardWidth] = gem.sprite;

                        // Update fixed position
                        gem.sprite.setPosition(x * kGemSize, y * kGemSize);
                        gNumGemsInColumn[x]++;

                        gBoardChangedSinceEvaluation = true;
                    }
                    else {
                        // Update the falling gems position
                        gem.sprite.setPosition(x * kGemSize, gem.yPos * kGemSize);
                    }
                }
            }

            // Check if there are possible moves and no gems falling
            let isFallingGems = false;
            for (x = 0; x < kBoardWidth; x++) {
                if (gNumGemsInColumn[x] != kBoardHeight) {
                    isFallingGems = true;
                    break;
                }
            }

            if (!isFallingGems) {
                let possibleMove = findMove();
                if (possibleMove == -1) {
                    // Create a possible move
                    createRandomMove();
                }
            }

            // Update timer
            let currentTime = Date.now();
            let elapsedTime = (currentTime - gStartTime) / kTotalGameTime;
            let timeLeft = (1 - elapsedTime) * 100;
            if (timeLeft < 0) timeLeft = 0;
            if (timeLeft > 99.9) timeLeft = 99.9;

            gTimer.setPercentage(timeLeft);

            // Update consecutive moves / powerplay
            if (currentTime - gLastMoveTime > kMaxTimeBetweenConsecutiveMoves) {
                gNumConsecutiveGems = 0;
            }
            updatePowerPlay();

            // Update sparkles
            updateSparkle();

            // Check if timer sound should be played
            if (timeLeft < 6.6 && !gEndTimerStarted) {
                cc.audioEngine.playEffect("res/sounds/timer.wav");
                gEndTimerStarted = true;
            }

            // Check for game over
            if (timeLeft === 0) {
                createGameOver();
                //this.rootNode.animationManager.runAnimvationsForSequenceNamed("Outro");
                gIsGameOver = true;
                cc.log("stopAllEffects not working!");
                cc.audioEngine.playEffect("res/sounds/endgame.wav");
                myGame.gLastScore = myGame.gScore;
            }
            else if (currentTime - gLastMoveTime > kDelayBeforeHint && !gIsDisplayingHint) {
                displayHint();
            }
        },
        onTouchBegan: function (touch, event) {
            console.log("onTouchBegan");

            let loc = touch.getLocation();
            loc = cc.pSub(loc, gameLayer.getPosition());

            let x = Math.floor(loc.x / kGemSize);
            let y = Math.floor(loc.y / kGemSize);

            if (!gIsGameOver) {
                gHintLayer.removeAllChildren(true);
                gIsDisplayingHint = false;

                if (activatePowerUp(x, y) ||
                    removeConnectedGems(x, y)) {
                    // Player did a valid move
                    let sound = gNumConsecutiveGems;
                    if (sound > 4) sound = 4;
                    cc.audioEngine.playEffect("res/sounds/gem-" + sound + ".wav");

                    gNumConsecutiveGems++;
                }
                else {
                    gNumConsecutiveGems = 0;
                }

                gLastMoveTime = Date.now();
            }
            return true;
        },
        onTouchMoved: function (touch, event) {
            console.log("onTouchMoved");
        },
        onTouchEnded: function (touch, event) {
            console.log("onTouchEnded");
        }
    });

    myGame.GameScene = cc.Scene.extend({
        onEnter: function () {
            this._super();
            this.addChild(new GameLayer());
        }
    });
}());
