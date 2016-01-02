//'use strict';

var highScore = 0;
var VANISHING_COUNTER = 3;
var data = {
    x: 0,   // coordinate
    y: 0,
    x1: 0,   // 2nd coordinate if needed
    y1: 0,
    u: 0,   // unit length
    i: 0,   // index
    d: 0,   // distance
    d2: 0,  // distance squared
    l: 0,   // length
    nx: 0,  // normal vector
    ny: 0,
    result: false // boolean result
};

// Do some initializing stuff
fabric.Object.prototype.set({
    transparentCorners: false,
    cornerColor: 'rgba(102,153,255,0.5)',
    cornerSize: 12,
    padding: 5
});

// initialize fabric canvas and assign to global windows object for debug
var canvas = window._canvas = new fabric.Canvas('c');
var ctx = canvas.getContext("2d");
var secondsSinceStarted = 0;
var secondsSinceStartedLast = 0;
var totalPoints = 0;
var timeVanished;
var animationRequestId;

function saveHighscore() {
    if (totalPoints > getHighscoreFromLS()) {
        localStorage.setItem('highScore', totalPoints);
    }
}
function getHighscoreFromLS() {
    return parseInt(localStorage.getItem('highScore') || highScore, 10);
}
function getDisplayedHighscore() {
    return parseInt(document.getElementById('high-score').innerHTML || 0, 10);
}

function beginGame(replay) {
    var monsterImageData = null;
    var heroImageData = null;

    if (animationRequestId) {
        cancelAnimationFrame(animationRequestId);
    }
    var gameStartDate = Date.now();
    var SECONDS_BETWEEN_SPAWNS = 1;
    var NUMBER_OF_SPAWNS = 5;
    var SUPERPOWER_CHARGE = 2;
    //var superpowerCharged = false;
    var setChargeText = false;
    var chargerText = '';
    var vanishHero = false;
    var vanishes = [];
    var blinker = 0;
    var secondsDispersedSwords = [0];
    totalPoints = 0;
    $('.vanishes').html('');
    $('.points-value').html('');
    var backgroundMusic = document.getElementById('background-music');
    backgroundMusic.play();
    var chargerCircle;

    function stop() {
        animationRequestId = 'STOP';
        ctx.font = "24px Helvetica";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = 'white';
        ctx.fillText("Game over!", 250, 300, 140);
        vanishes.splice(0, vanishes.length);
        //chargerCircle.stop();
    }


    var startColor = '#FC5B3F';
    var endColor = '#6FD57F';
    var element = document.getElementById('charger');
    //var chargerCircle = resetCharger();

     canvas.setBackgroundColor({source: 'images/tile.png'}, canvas.renderAll.bind(canvas));

// Hero image
    var heroReady = false;
    var heroImage = new Image();
    heroImage.onload = function () {
        heroReady = true;
        heroImageData = getImageDataFromCanvas(this);
    };
    heroImage.src = "images/knightsm.png";

    var ninjas = [];

    function makeSureNinjaInCanvas(ninja) {
        if (ninja.x >= canvas.width - 30) {
            ninja.x -= 30;
        }
        if (ninja.y >= canvas.height - 30) {
            ninja.y -= 30;
        }
    }

    function createNinja() {
        var ninja = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };

        ninja.ninjaImage = new Image();
        ninja.ninjaImage.onload = function () {
            ninja.ready = true;
            ninjaImageData = getImageDataFromCanvas(this);
        };
         ninja.ninjaImage.src = "images/Ninja-icon.png";

        makeSureNinjaInCanvas(ninja);
        while (hero.x < ninja.x + ninja.ninjaImage.width &&
               hero.x + heroImage.width > ninja.x &&
               hero.y < ninja.y + ninja.ninjaImage.height &&
               heroImage.height + hero.y > ninja.y) {
            ninja.x = Math.random() * canvas.width;
            ninja.y = Math.random() * canvas.height;
            makeSureNinjaInCanvas(ninja);
        }

        return ninja;
    }

    function Vanish() {

    }

    var monsters = [];

    function createMonster() {
        var o = 21.5;
        var monster = {
            x: 0,
            y: 0,
            angle: 0,
            pts: [{x: 36 - o, y: 44 - o}, {x: 56 - o, y: 24 - o}, {x: 65 - o, y: 23 - o}, {
                x: 62 - o,
                y: 32 - o
            }, {x: 42 - o, y: 50 - o}],
            // precalculated properties -- for efficiency
            radii: [],
            angles: [],
            halfWidth: 0,
            halfHeight: 0,
            lines: [],
            calcTrxPts: function () {
                var trxPts = [];
                for (var i = 0; i < this.pts.length; i++) {
                    var r = this.radii[i];
                    var ptangle = this.angles[i] + this.angle;
                    trxPts[i] = {
                        x: this.x + r * Math.cos(ptangle),
                        y: this.y + r * Math.sin(ptangle)
                    };
                }
                return (trxPts);
            }
        };

        var speedModifier = Math.random() * 5;

        monster.monsterImage = new Image();
        monster.monsterImage.onload = function () {
            monster.ready = true;
            monsterImageData = getImageDataFromCanvas(this);
            var PI2 = Math.PI * 2;
            monster.img = this;
            monster.halfWidth = this.width / 2;
            monster.halfHeight = this.height / 2;
            for (var i = 0; i < monster.pts.length; i++) {
                var dx = monster.halfWidth - monster.pts[i].x;
                var dy = monster.halfHeight - monster.pts[i].y;
                monster.radii[i] = Math.sqrt(dx * dx + dy * dy);
                monster.angles[i] = ((Math.atan2(dy, dx) + PI2) % PI2) - Math.PI;
            }
        };
         monster.monsterImage.src = "images/swordsmall.png";

        monster.directionVector = {
            x: Math.random() * speedModifier,
            y: Math.random() * speedModifier
        };

        var xPos = Math.random();
        if (xPos > 0.5) {
            if (xPos > 0.75) {
                //Right
                monster.x = canvas.width + 5;
                monster.directionVector.x = -Math.abs(monster.directionVector.x);
            }
            else {
                //Left
                monster.x = -5;
            }

            if (Math.random() > 0.5) {
                monster.directionVector.y = -Math.abs(monster.directionVector.y);
            }
            monster.y = Math.random() * (canvas.height + 10) - 5;
        }
        else {
            if (xPos < 0.25) {
                //Top
                monster.y = canvas.height + 5;
                monster.directionVector.y = -Math.abs(monster.directionVector.x);
            }
            else {
                //Bottom
                monster.y = -5;
            }

            if (Math.random() > 0.5) {
                monster.directionVector.x = -Math.abs(monster.directionVector.x);
            }
            monster.x = Math.random() * (canvas.width + 10) - 5;
        }
        return monster;
    }

    function getImageDataFromCanvas(image) {
        var ctx = document.querySelector("#testCanvas").getContext("2d");
        ctx.drawImage(image, 0, 0);
        var imageData = ctx.getImageData(0, 0, image.width, image.height);
        ctx.clearRect(0, 0, image.width, image.height);
        return imageData;
    }

// Game objects
    var hero = {
        speed: 256 // movement in pixels per second
    };

// Handle keyboard controls
    var keysDown = {};

    addEventListener("keydown", function (e) {
        if (e.keyCode === 32 && vanishes.length > 0 && animationRequestId !== 'STOP') {
            vanishes.pop();
            updateVanishList();
            document.getElementById('use-vanish').play();
            vanishHero = true;
            timeVanished = Date.now();
            chargerText = VANISHING_COUNTER;
            for (var i = 1; i < VANISHING_COUNTER; i++) {
                (function (time) {
                    setTimeout(function () {
                        chargerText = VANISHING_COUNTER - time;
                    }, time * 1000);
                })(i);
            }
        }
        else if (e.keyCode !== 32) {
            keysDown[e.keyCode] = true;
        }
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);

    var reset = function () {
        gameStartDate = Date.now();
        hero.x = canvas.width / 2;
        hero.y = canvas.height / 2;
    };


// Update game objects
    var update = function (modifier) {
        if (38 in keysDown) { // Player holding up
            hero.y -= hero.speed * modifier;
        }
        if (40 in keysDown) { // Player holding down
            hero.y += hero.speed * modifier;
        }
        if (37 in keysDown) { // Player holding left
            hero.x -= hero.speed * modifier;
        }
        if (39 in keysDown) { // Player holding right
            hero.x += hero.speed * modifier;
        }

        // Are they touching?
        if (heroImage.width) {
            var heroX = hero.x + (heroImage.width / 2);
            var heroY = hero.y + (heroImage.height / 2);
            var heroR = heroImage.height / 2;
            for (var i = 0; i < monsters.length; i++) {
                var monster = monsters[i];

                monster.x += monster.directionVector.x;
                monster.y += monster.directionVector.y;

                for (var j = 0; j < monster.lines.length; j++) {
                    var line = monster.lines[j];
                    lineSegCircleIntercept(data, line.x1, line.y1, line.x2, line.y2, heroX, heroY, heroR);
                    if (!vanishHero &&
                        heroImageData &&
                        monsterImageData &&
                        data.result) {
                        var d1 = document.getElementById('death1');
                        d1.play();
                        var d2 = document.getElementById('death2');
                        d2.play();
                        setTimeout(function () {
                            stop();
                        }, 0);
                    }
                }
            }

            for (var i = 0; i < ninjas.length; i++) {
                var ninja = ninjas[0];
                if (hero.x < ninja.x + ninja.ninjaImage.width &&
                    hero.x + heroImage.width > ninja.x &&
                    hero.y < ninja.y + ninja.ninjaImage.height &&
                    heroImage.height + hero.y > ninja.y) {
                    ninjas.splice(0, ninjas.length);
                    //chargerCircle.set(1);
                    addVanish();
                    var v = document.getElementById('vanish-audio');
                    v.play();
                }
            }
        }
    };

    function updateVanishList() {
        var vanishesElem = $('.vanishes');
        vanishesElem.html('');
        for (var i = 0; i < vanishes.length; i++) {
            var img = document.createElement('img');
             img.src = 'images/Ninja-icon.png';
            vanishesElem.append(img);
        }
    }

    function calcTimeAlive(dateFrom) {
        return parseInt((Date.now() - (dateFrom || gameStartDate)) / 1000, 10);
    }

    function imageCompletelyOutsideCanvas(obj, objImage) {
        return obj.x + objImage.width < 0 || obj.y + objImage.height < 0 || (obj.x > canvas.width + 10) || (obj.y > canvas.height + 10);
    }

    function stopObjectFromEscaping(obj, objImage) {
        if (obj.x < 0) {
            obj.x = 0;
        }
        if (obj.y < 0) {
            obj.y = 0;
        }
        if (obj.x + objImage.width > canvas.width) {
            obj.x = canvas.width - objImage.width;
        }
        if (obj.y + objImage.height > canvas.height) {
            obj.y = canvas.height - objImage.height;
        }

    }

    function draw(sword, image) {
        var img = image;
        var rx = sword.x;
        var ry = sword.y;
        var angle = sword.angle;
        ctx.translate(rx, ry);
        ctx.rotate(angle);
        ctx.drawImage(img, -sword.halfWidth, -sword.halfHeight);
        ctx.rotate(-angle);
        ctx.translate(-rx, -ry);
    }

    function drawHitArea(sword) {
        // lines
        var trxPts = sword.calcTrxPts();
        sword.lines.splice(0, sword.lines.length);
        for (var i = 0; i < trxPts.length - 1; i++) {
            sword.lines.push({x1: trxPts[i].x, y1: trxPts[i].y, x2: trxPts[i + 1].x, y2: trxPts[i + 1].y})
        }

        // ctx.beginPath();
        // ctx.moveTo(trxPts[0].x,trxPts[0].y);
        // for(var i=1;i<trxPts.length;i++){
        //     ctx.lineTo(trxPts[i].x,trxPts[i].y);
        // }
        // ctx.closePath();
        // ctx.strokeStyle='red';
        // ctx.stroke();
        // // dots
        // for(var i=0;i<trxPts.length;i++){
        //     ctx.beginPath();
        //     ctx.arc(trxPts[i].x,trxPts[i].y,3,0,Math.PI*2);
        //     ctx.closePath();
        //     ctx.fillStyle='blue';
        //     ctx.fill();
        // }
    }

// Draw everything
    var render = function (ignoreBackground) {

        if (!ignoreBackground) {
             canvas.setBackgroundColor({source: 'images/tile.png'}, canvas.renderAll.bind(canvas));
        }

        if (setChargeText) {
            ctx.font = "38px Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillStyle = 'green';
            ctx.fillText("VANISH CHARGED", 130, 270, 340);
        }

        if (vanishHero && calcTimeAlive(timeVanished) < VANISHING_COUNTER) {
            ctx.font = "78px Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillStyle = 'red';
            ctx.fillText(chargerText, 280, 170, 340);
        }

        if (heroReady) {
            stopObjectFromEscaping(hero, heroImage);

            if (!vanishHero || blinker++ % 3 === 0) {
                ctx.drawImage(heroImage, hero.x, hero.y);
            }
            else {
                var timeGone = calcTimeAlive(timeVanished);
                if (timeGone >= VANISHING_COUNTER) {
                    vanishHero = false;
                    timeVanished = undefined;
                    blinker = 0;
                    //chargerCircle = resetCharger();
                }
            }
        }

        for (var i = 0; i < ninjas.length; i++) {
            var ninja = ninjas[i];
            if (ninja.ready) {
                ctx.drawImage(ninja.ninjaImage, ninja.x, ninja.y);
            }
        }

        for (var i = 0; i < monsters.length; i++) {
            var monster = monsters[i];
            if (monster.ready) {
                if (imageCompletelyOutsideCanvas(monster, monster.monsterImage)) {
                    monster.remove = true;
                }
                monster.angle += 0.05;
                draw(monster, monster.monsterImage);
                drawHitArea(monster);
            }
        }

        monsters = $.grep(monsters, function (value) {
            return !value.remove;
        });

        secondsSinceStarted = calcTimeAlive();
        if (secondsSinceStarted !== secondsSinceStartedLast) {
            totalPoints += 1 + vanishes.length;
            secondsSinceStartedLast = secondsSinceStarted;
        }
        // Score
        //ctx.font = "24px Helvetica";
        //ctx.textAlign = "left";
        //ctx.textBaseline = "top";
        //ctx.fillStyle = 'white';
        //ctx.fillText("Points: " + totalPoints, 10, 32, 140);
        $('.points-value').html(totalPoints);
    };


// The main game loop
    function checkToAddMonster() {
        if (secondsSinceStarted % SECONDS_BETWEEN_SPAWNS === 0 && secondsDispersedSwords.indexOf(secondsSinceStarted) === -1) {
            for (var i = 0; i < NUMBER_OF_SPAWNS; i++) {
                //monsters.push(createMonster());
            }
            secondsDispersedSwords.push(secondsSinceStarted);
        }
    }

    function checkToAddNinja() {
        if (ninjas.length === 0 && !vanishHero && Math.random() < 0.005) {
            ninjas.push(createNinja());
        }
    }

    var main = function () {
        var now = Date.now();
        var delta = now - then;

        update(delta / 1000);
        if (replay) {
            animationRequestId = '';
            replay = false;
        }

        if (animationRequestId !== 'STOP') {
            render(false);
            then = now;
            checkToAddMonster();
            checkToAddNinja();

            // Request to do this again ASAP
            animationRequestId = requestAnimationFrame(main);
        }
        else {
            saveHighscore();
            render(true);
        }
    };

    function updateHighscore() {
        highScore = getHighscoreFromLS();
        var currentHighscore = getDisplayedHighscore();
        if (highScore > currentHighscore) {
            document.getElementById('high-score').innerHTML = highScore;
        }
    }

    var then = Date.now();
    updateHighscore();
    reset();
    main();

    function addVanish() {
        vanishes.push(new Vanish());
        updateVanishList();
        totalPoints += 3;
    }

    //function resetCharger() {
    //    var charger = $('#c');
    //    charger.removeClass('full');
    //    document.getElementById('charger').innerHTML = '';
    //    var circle = new ProgressBar.Circle(element, {
    //        color: startColor,
    //        trailColor: '#eee',
    //        trailWidth: 1,
    //        duration: SUPERPOWER_CHARGE * 1000,
    //        strokeWidth: 5,
    //        text: {
    //            value: '0'
    //        },
    //        // Set default step function for all animate calls
    //        step: function (state, bar) {
    //            bar.path.setAttribute('stroke', state.color);
    //            chargerText = (bar.value() * 100).toFixed(0);
    //            if (vanishHero) {
    //                charger.addClass('smallText');
    //                var textInt = parseInt(chargerText, 10);
    //                if (textInt >= 67) {
    //                    chargerText = '3';
    //                }
    //                else if (textInt >= 33) {
    //                    chargerText = '2';
    //                }
    //                else {
    //                    chargerText = '1';
    //                }
    //            }
    //            else {
    //                charger.removeClass('smallText');
    //            }
    //            bar.setText(chargerText);
    //            if (chargerText === '100') {
    //                charger.addClass('full');
    //                //superpowerCharged = true;
    //                setChargeText = true;
    //                addVanish();
    //                updateVanishList();
    //                setTimeout(function () {
    //                    setChargeText = false;
    //                }, 2000);
    //            }
    //            else {
    //                charger.removeClass('full');
    //            }
    //        }
    //    });
    //
    //    circle.animate(1.0, {
    //        from: {color: startColor},
    //        to: {color: endColor}
    //    });
    //
    //    return circle;
    //}


    /** LineSegCircleIntercept.js begin **/
    // use data properties
    // result  // intecept bool for intercept
    // x, y    // forward intercept point on line **
    // x1, y1  // backward intercept point on line
    // u       // unit distance of intercet mid point
    // d2      // line seg length squared
    // nx,ny   // normalised line seg vector
    // d       // ditance of closest point on line from circle
    // i       // bit 0 on for forward intercept on segment
    //         // bit 1 on for backward intercept
    // ** x = null id intercept points dont exist
    var lineSegCircleIntercept = function (ret, x1, y1, x2, y2, cx, cy, r) {
        var vx, vy, u, u1, u2, d, ld, len, xx, yy;
        vx = x2 - x1;  // convert line to vector
        vy = y2 - y1;
        ret.d2 = (vx * vx + vy * vy);

        // get the unit distane of the near point on the line
        ret.u = u = ((cx - x1) * vx + (cy - y1) * vy) / ret.d2;
        xx = x1 + vx * u; // get the closest point
        yy = y1 + vy * u;

        // get the distance from the circle center
        ret.d = d = Math.hypot(xx - cx, yy - cy);
        if (d <= r) { // line is inside circle
            // get the distance to the two intercept points
            ld = Math.sqrt(r * r - d * d) / Math.sqrt(ret.d2);

            // get that points unit distance along the line
            u1 = u + ld;
            if (u1 < 0) {  // is the forward intercept befor the line
                ret.result = false;  // no intercept
                return ret;
            }
            u2 = u - ld;
            if (u2 > 1) {  // is the backward intercept past the end of the line
                ret.result = false;  // no intercept
                return ret;
            }
            ret.i = 0;
            if (u1 <= 1) {
                ret.i += 1;
                // get the forward point line intercepts the circle
                ret.x = x1 + vx * u1;
                ret.y = y1 + vy * u1;
            } else {
                ret.x = x2;
                ret.y = y2;

            }
            if (u2 >= 0) {
                ret.x1 = x1 + vx * u2;
                ret.y1 = y1 + vy * u2;
                ret.i += 2;
            } else {
                ret.x1 = x1;
                ret.y1 = y1;
            }

            // tough the points of intercept may not be on the line seg
            // the closest point to the must be on the line segment
            ret.result = true;
            return ret;

        }
        ret.x = null; // flag that no intercept found at all;
        ret.result = false;  // no intercept
        return ret;

    };
    /** LineSegCircleIntercept.js end **/

}

beginGame();

