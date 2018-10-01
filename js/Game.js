function Game(canvas, resources,  player) {
    var _this;
    this._init = function () {
        _this = this;

        //this.socket = socket;

        this.resources = resources;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.messageBox = document.getElementById('messageBox');
        this.ground = new TileGround(this.ctx);
        this.collisionHandler = new CollisionHandler(this.ctx, this.camera, this.ground.mapArray);
        this.gameBullets = [];

        if (player == 1) {
            this.shyame = new Shyame(this.ctx, { x: 600, y: 200 }, this.canvas, this.camera, this.collisionHandler, this.resources);

            this.enemy = new Shyame(this.ctx, { x: 800, y: 200 }, this.canvas, this.camera, this.collisionHandler, this.resources);
        }
        else {
            this.enemy = new Shyame(this.ctx, { x: 600, y: 200 }, this.canvas, this.camera, this.collisionHandler, this.resources);

            this.shyame = new Shyame(this.ctx, { x: 800, y: 200 }, this.canvas, this.camera, this.collisionHandler, this.resources);
        }
        // console.log(player);
        // this.shyame = (player == 1) ? this.player1 : this.player2;
        // this.enemy = (player == 1) ? this.player2 : this.player1;

        this.camera = new Camera(this.ctx, this.shyame);

        this.introAudio = this.resources.getAudio('intro');
        this.introAudio.play();

        this.addControls();

        socket.on('enemymove', (command) => {
            this.enemy.actor.commands = command;
        });
        socket.on('enemymousemove', (mousePos)=>{
            this.enemy.actor.mousePos = mousePos;
            this.enemy.actor._updateFaceSide();
        })

        this.gameAnimationFrame = requestAnimationFrame(this.drawGame);
    }

    this.drawGame = function () {

        _this.gameAnimationFrame = requestAnimationFrame(_this.drawGame);
        _this.ctx.clearRect(0, 0, _this.ctx.canvas.width, _this.ctx.canvas.height);
        _this.ground.drawGround();
        _this.camera.move();

        //_this.showEnemyDirection();
        _this.shyame.actor.move();
        _this.shyame.actor.drawWeapon();
        _this.shyame.actor._drawShyameStatus();

        _this.enemy.actor.move();
        _this.enemy.actor.drawWeapon();
        // _this.shyame.actor._drawShyameStatus();

        _this.drawFire();
        _this.checkShot();
    };

    this.drawFire = function () {

        var refreshedGameBullets = {};
        var count = 0;
        if (Object.size(_this.gameBullets) > 0) {
            // console.log(_this.gameBullets);
        }
        for (var i in _this.gameBullets) {

            if (_this.gameBullets[i].toPosition.x > _this.ctx.canvas.width
                || _this.gameBullets[i].toPosition.y > _this.ctx.canvas.height
                || _this.gameBullets[i].toPosition.x < 0
                || _this.gameBullets[i].toPosition.y < 0
                || _this.collisionHandler.objectIsOutBound(_this.gameBullets[i].toPosition)) {

                _this.gameBullets[i] = null;
            } else if (!_this.gameBullets[i].hit) {
                refreshedGameBullets[count] = _this.gameBullets[i];
                _this.gameBullets[i].fire();
                count += 1;
            }
        }

        _this.gameBullets = refreshedGameBullets;
    };


    this.checkShot = function () {

        if (_this.shyame.actor.health <= 0) {

            if (_this.shyame.actor.noOfLifes > 1) {
                _this.respawn();
            } else {
                _this.gameOver();
            }
        }
        var refreshedBullets = {};
        var refreshedBulletsCount = 0;
        for (var i = 0; i < Object.size(_this.gameBullets); i++) {
            if (_this.gameBullets[i].actorType == 'shyame') {
                if (_this.rectCircleColliding(_this.gameBullets[i], _this.enemy.actor)) {
                    console.log("collide");

                    _this.gameBullets[i].hit = true;
                    _this.enemy.actor.health -= 50;
                    if (_this.enemy.actor.health <= 0) {
                        enemyDead();
                    }
                }

            }

            if (!refreshedBullets.hasOwnProperty(i) && !_this.gameBullets[i].hit) {
                refreshedBullets[refreshedBulletsCount] = _this.gameBullets[i];
                refreshedBulletsCount += 1;
            }
        }
        _this.gameBullets = refreshedBullets;
    };

    // returns true if the actor and bullet are colliding
    this.rectCircleColliding = function (bullet, actor) {
        var distX = Math.abs(bullet.toPosition.x - actor.position.x - actor.actorWidth / 2);
        var distY = Math.abs(bullet.toPosition.y - actor.position.y - actor.actorHeight / 2);

        if (distX > (actor.actorWidth / 2 + 5)) {
            return false;
        }
        if (distY > (actor.actorHeight / 2 + 5)) {
            return false;
        }
        if (distX <= (actor.actorWidth / 2)) {
            return true;
        }
        if (distY <= (actor.actorHeight / 2)) {
            return true;
        }

        var dx = distX - actor.actorWidth / 2;
        var dy = distY - actor.actorHeight / 2;
        return (dx * dx + dy * dy <= 25);
    };


    this.respawn = function () {

        _this.respawnTime = 6;
        _this.pauseGame();
        _this.messageBox.style.opacity = 1;
        document.getElementById('score').innerHTML = _this.shyame.actor.score;
        document.getElementById('kills').innerHTML = _this.shyame.actor.kills;
        document.getElementById('respawn-value').innerHTML = _this.respawnTime;

        _this.respawnInterval = setInterval(function () {

            if (_this.respawnTime == 0) {

                _this.resumeGame();
                _this.shyame.actor.noOfLifes -= 1;
                _this.shyame.actor.health = _this.shyame.actor.maxHealth;
                clearInterval(_this.respawnInterval);
            } else {
                _this.respawnTime -= 1;
                document.getElementById('respawn-value').innerHTML = _this.respawnTime;
            }
        }, 1000);

        _this.shyame.actor.position = { x: 1400, y: 10 };
    };

    this.pauseGame = function () {

        cancelAnimationFrame(_this.gameAnimationFrame);
    };

    this.resumeGame = function () {

        _this.messageBox.style.opacity = 0;
        _this.gameAnimationFrame = requestAnimationFrame(_this.drawGame);
    };

    this.gameOver = function () {

        _this.messageBox.style.opacity = 1;
        document.getElementById('messageHeading').innerHTML = 'GAME OVER';
        document.getElementById('score').innerHTML = _this.shyame.actor.score;
        document.getElementById('kills').innerHTML = _this.shyame.actor.kills;
        document.getElementById('respawn').innerHTML = '';
        document.getElementById('retryButton').style.display = 'block';

        _this.pauseGame();
        _this.removeControls();
        _this.messageBox.style.opacity = 1;
        // _this._init();
    };

    this.addMovements = function (e) {

        _this.shyame.actor.commands['G'] = false;
        _this.shyame.actor.commands['O'] = false;
        switch (e.which) {

            case 87:
                _this.shyame.actor.commands['W'] = true;
                break;
            case 83:
                _this.shyame.actor.commands['S'] = true;
                break;
            case 68:
                _this.shyame.actor.commands['D'] = true;
                break;
            case 65:
                _this.shyame.actor.commands['A'] = true;
                break;
        }
        socket.emit('enemymove', _this.shyame.actor.commands);
    };

    this.removeMovements = function (e) {

        switch (e.which) {

            case 87:
                _this.shyame.actor.commands['W'] = false;
                break;
            case 83:
                _this.shyame.actor.commands['S'] = false;
                break;
            case 68:
                _this.shyame.actor.commands['D'] = false;
                break;
            case 65:
                _this.shyame.actor.commands['A'] = false;
                break;
        }
        socket.emit('enemymove', _this.shyame.actor.commands);
    };

    this.updateFaceSideEvent = function (e) {

        _this.shyame.actor.mousePos = _this.getMousePos(_this.canvas, e);
        _this.shyame.actor._updateFaceSide();
        socket.emit('enemymousemove', _this.shyame.actor.mousePos);
    };

    this.fireBulletEvent = function (e) {

        _this.resources.getAudio('gun_shot').currentTime = 0;
        _this.gameBullets[Object.size(_this.gameBullets)] = _this.shyame.actor.weapon.fireBullet(_this.shyame.actor.position, _this.getMousePos(_this.canvas, e));
        _this.resources.getAudio('gun_shot').play();
    };

    this.addControls = function () {

        document.addEventListener('keydown', _this.addMovements);
        document.addEventListener('keyup', _this.removeMovements);
        document.addEventListener('mousemove', _this.updateFaceSideEvent);
        document.addEventListener('click', _this.fireBulletEvent);
    };

    this.removeControls = function () {

        document.removeEventListener('keydown', _this.addMovements);
        document.removeEventListener('keyup', _this.removeMovements);
        document.removeEventListener('mousemove', _this.updateFaceSideEvent);
        document.removeEventListener('click', _this.fireBulletEvent);
    };

    this.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    this._init();
}