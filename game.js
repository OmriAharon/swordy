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
    var chargerCircle;

    function stop() {
        animationRequestId = 'STOP';
        ctx.font = "24px Helvetica";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = 'white';
        ctx.fillText("Game over!", 250, 300, 140);
        //chargerCircle.stop();
    }


    var startColor = '#FC5B3F';
    var endColor = '#6FD57F';
    var element = document.getElementById('charger');
    //var chargerCircle = resetCharger();

    canvas.setBackgroundColor({source: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAdBAMAAAAneUMHAAAAJFBMVEUmJiYnJycoKCgpKSkqKiorKyssLCwtLS0uLi4vLy8wMDAxMTFxi6zpAAABN0lEQVR4XmXSvU+EMBQA8AY84nhVxRtxO29iMhEXZ6fOTDAqizo46AIOLt28kUmMxoTFxISDvn/Ox3tpvY+mC7/SvK+KfRjX20QWUGrIj716hJ79y69xl3oZtLid97LAK8Hd4/hzPrNuogUAwhSP+Yu981ERTukYfgPrEq+61cvQehJfOzZXybn1y5V8tn5/Av8On37L/DFp1x1eQuLuQMOGQzZH7qMCttzEKRiVwLbDSj5hzF2H6lDqdTfKo2SMSokbkZJXYcXJlJpSkq9Sozdea9SF8wHjN9632BtLHaJbdjDZ2Vj0kRApX27Z30MOJW6Akpxq9pJTHQSxiZV1Lg3Ys/mPdWoFOTXNOYbS7NRk59RqchqKcx4NuqEhOudRoucz2HB+T+IhgB2HzhN+TZ4tyA1nCcs/MvN/MhRp8MwAAAAASUVORK5CYII="}, canvas.renderAll.bind(canvas));
    // canvas.setBackgroundColor({source: 'images/tile.png'}, canvas.renderAll.bind(canvas));

// Hero image
    var heroReady = false;
    var heroImage = new Image();
    heroImage.onload = function () {
        heroReady = true;
        heroImageData = getImageDataFromCanvas(this);
    };
    heroImage.src = "data:image/png;base64,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";
    // heroImage.src = "images/knightsm.png";

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
        // ninja.ninjaImage.src = "images/Ninja-icon.png";
        ninja.ninjaImage.src = "data:image/png;base64,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";

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
        // monster.monsterImage.src = "images/swordsmall.png";
        monster.monsterImage.src = "data:image/png;base64,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";

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
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);

    addEventListener("keyup", function (e) {
        if (e.keyCode === 32 && vanishes.length > 0 && animationRequestId !== 'STOP') {
            vanishes.pop();
            updateVanishList();
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
            //superpowerCharged = false;

            //$('#charger').removeClass('full');

            //chargerCircle.animate(0, {
            //    duration: VANISHING_COUNTER * 1000,
            //    from: {color: endColor},
            //    to: {color: startColor}
            //});
        }
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
                }
            }
        }
    };

    function updateVanishList() {
        var vanishesElem = $('.vanishes');
        vanishesElem.html('');
        for (var i = 0; i < vanishes.length; i++) {
            var img = document.createElement('img');
            // img.src = 'images/Ninja-icon.png';
            img.src = 'data:image/png;base64,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';
            vanishesElem.append(img);
        }
    }

    function calcTimeAlive(dateFrom) {
        return parseInt((Date.now() - (dateFrom || gameStartDate)) / 1000, 10);
    }

    function imageSlightlyOutsideCanvas(obj, objImage) {
        return obj.x < 0 || obj.y < 0 || (obj.x + objImage.width > canvas.width) || (obj.y + objImage.height > canvas.height);
    }

    function imageCompletelyOutsideCanvas(obj, objImage) {
        return obj.x + objImage.width < 0 || obj.y + objImage.height < 0 || (obj.x > canvas.width + 10) || (obj.y > canvas.height + 10);
    }

    function stopObjectFromEscaping(obj, objImage) {
        if (obj.x < 0) {
            obj.x = 0;
        }
        else if (obj.y < 0) {
            obj.y = 0;
        }
        else if (obj.x + objImage.width > canvas.width) {
            obj.x = canvas.width - objImage.width;
        }
        else if (obj.y + objImage.height > canvas.height) {
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
            // canvas.setBackgroundColor({source: 'images/tile.png'}, canvas.renderAll.bind(canvas));
            canvas.setBackgroundColor({source: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAdBAMAAAAneUMHAAAAJFBMVEUmJiYnJycoKCgpKSkqKiorKyssLCwtLS0uLi4vLy8wMDAxMTFxi6zpAAABN0lEQVR4XmXSvU+EMBQA8AY84nhVxRtxO29iMhEXZ6fOTDAqizo46AIOLt28kUmMxoTFxISDvn/Ox3tpvY+mC7/SvK+KfRjX20QWUGrIj716hJ79y69xl3oZtLid97LAK8Hd4/hzPrNuogUAwhSP+Yu981ERTukYfgPrEq+61cvQehJfOzZXybn1y5V8tn5/Av8On37L/DFp1x1eQuLuQMOGQzZH7qMCttzEKRiVwLbDSj5hzF2H6lDqdTfKo2SMSokbkZJXYcXJlJpSkq9Sozdea9SF8wHjN9632BtLHaJbdjDZ2Vj0kRApX27Z30MOJW6Akpxq9pJTHQSxiZV1Lg3Ys/mPdWoFOTXNOYbS7NRk59RqchqKcx4NuqEhOudRoucz2HB+T+IhgB2HzhN+TZ4tyA1nCcs/MvN/MhRp8MwAAAAASUVORK5CYII="}, canvas.renderAll.bind(canvas));
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
            if (imageSlightlyOutsideCanvas(hero, heroImage)) {
                stopObjectFromEscaping(hero, heroImage);
            }

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
                monsters.push(createMonster());
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

