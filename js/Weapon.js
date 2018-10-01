/**
 * Created by asim on 4/11/17.
 * Modified by nikunj on 1/10/18
 */
function Weapon(ctx, collisionHandler, actorType, resources) {

    var _this;
    this._init = function () {

        _this = this;
        this.resources = resources;
        this.ctx = ctx;
        this.collisionHandler = collisionHandler;
        this.offset = { x: 20, y: 60 };

        this.actorType = actorType;
        this.weaponImageRight = this.resources.getImage('hand_with_gun');
        this.weaponImageLeft = this.resources.getImage('hand_with_gun_left');
    };

    this.fireBullet = function (startPosition, endPosition) {

        return new Bullet(_this.ctx, startPosition, endPosition, collisionHandler, _this.offset, _this.actorType);
    };

    this._init();
}