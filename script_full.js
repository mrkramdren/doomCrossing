let N = 10;
let M = 15;
let blockSize = 500 / N;
let gameArea;
let menu;
let hud;
let scoreboard;
let scoreList = [];
let endOfGameMenu;
let music;
let name = "Player";


let currentScore = 0;
let movesLeft = 30;
let scoreTarget = 10000;
let currentLevel = 1;

let gameTable;
let firstSelected;
let secondSelected;

const Difficulty = {
    BABY_MODE: "baby-mode",
    IMPOSSIBLE: "impossible"
};

let difficulty = Difficulty.BABY_MODE;
let difficultySelector;

const CandyType = {
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    YELLOW: "yellow",
    MAGIC: "magic",
    FALL_THROUGH: "fall-through"
};

function getRandomCandyType() {
    const random = Math.floor(Math.random() * Math.floor(4));
    switch (random) {
        case 0:
            return CandyType.RED;
        case 1:
            return CandyType.GREEN;
        case 2:
            return CandyType.BLUE;
        default:
            return CandyType.YELLOW;
    }
}

function getCandy(type) {
    var candy;
    switch (type) {
        case CandyType.RED:
            candy = $('<img src="assets/Red.png" />');
            candy.attr('type', CandyType.RED);
            return candy;
        case CandyType.GREEN:
            candy = $('<img src="assets/Green.png" />');
            candy.attr('type', CandyType.GREEN);
            return candy;
        case CandyType.BLUE:
            candy = $('<img src="assets/Blue.png" />');
            candy.attr('type', CandyType.BLUE);
            return candy;
        case CandyType.MAGIC:
            candy = $('<img src="assets/Colourbomb.png" />');
            candy.attr('type', CandyType.MAGIC);
            return candy;
        case CandyType.FALL_THROUGH:
            candy = $('<img src="assets/Brick.png" />');
            candy.attr('type', CandyType.FALL_THROUGH);
            return candy;
        default:
            candy = $('<img src="assets/Yellow.png" />');
            candy.attr('type', CandyType.YELLOW);
            return candy;
    }
}

function addCandyToGameTable(i, j) {
    const type = getRandomCandyType();
    const candy = getCandy(type);
    candy.addClass('floor');
    candy.addClass('candy');

    candy.attr('iX', i);
    candy.attr('iY', j);
    gameTable[i][j] = {
        x: i,
        y: j,
        component: candy,
        type: type
    };

    candy.on('click', selectCandy);

    candy.css({
        width: blockSize,
        height: blockSize,
        top: j * blockSize,
        left: i * blockSize
    });
    gameArea.append(candy);
}

function addEmptyFallThroughBlockToGameTable(i, j) {
    const candy = getCandy(CandyType.FALL_THROUGH);
    candy.addClass('floor');
    candy.addClass('blocker');
    candy.addClass('candy');

    candy.attr('iX', i);
    candy.attr('iY', j);
    gameTable[i][j] = {
        x: i,
        y: j,
        component: candy,
        type: CandyType.FALL_THROUGH
    };

    candy.css({
        width: blockSize,
        height: blockSize,
        top: j * blockSize,
        left: i * blockSize,
    });
    gameArea.append(candy);
}

function initGame() {
    movesLeft=30;
    currentScore=0;
    if(currentLevel===1){
        scoreTarget=60000;
    }else{
        scoreTarget=100000;
    }
    $('#moves').text(movesLeft);
    gameTable = new Array(M);
    for (let i = 0; i < M; i++) {
        gameTable[i] = new Array(N);
        for (let j = 0; j < N; j++) {
            if(difficulty===Difficulty.IMPOSSIBLE){
                if(j%2===1){
                    addEmptyFallThroughBlockToGameTable(i, j);
                }else{
                    addCandyToGameTable(i, j);
                }
            }else if (currentLevel > 1 && (i >= 4 && i <= 10) && (j >= 2 && j <= 4)) {
                addEmptyFallThroughBlockToGameTable(i, j);
            } else {
                addCandyToGameTable(i, j);
            }
        }
    }
}

function selectCandy() {
    $(this).addClass('selected');
    var iX = $(this).attr('iX');
    var iY = $(this).attr('iY');
    if (firstSelected === undefined) {
        firstSelected = secondSelected = gameTable[iX][iY];
        return;
    }
    secondSelected = gameTable[iX][iY];

    switchCandies(firstSelected, secondSelected);
    $(firstSelected.component).removeClass('selected');
    $(secondSelected.component).removeClass('selected');
    firstSelected = undefined;
    secondSelected = undefined;
}

function switchCandies(first, second) {
    function areAdjacent(first, second) {
        const deltaX = first.x - second.x;
        const deltaY = first.y - second.y;
        if ((deltaX <= 1 && deltaX >= -1) && (deltaY <= 1 && deltaY >= -1) && (deltaY === 0 || deltaX === 0)) {
            return true;
        }
        return false;
    }

    if (areAdjacent(first, second)) {
        $(second.component).animate({
            top: first.y * blockSize + "px",
            left: first.x * blockSize + "px"
        });
        $(first.component).animate({
            top: second.y * blockSize + "px",
            left: second.x * blockSize + "px"
        }, 400, function () {
            if (first.type === CandyType.MAGIC || second.type === CandyType.MAGIC) {
                explodeMagic(first, second);
            } else {
                checkMatches();
            }
        });

        $(first.component).attr('iX', second.x);
        $(first.component).attr('iY', second.y);
        $(second.component).attr('iX', first.x);
        $(second.component).attr('iY', first.y);
        var firstComp = first.component;
        var firstType = first.type;
        gameTable[first.x][first.y].component = second.component;
        gameTable[first.x][first.y].type = second.type;
        gameTable[second.x][second.y].component = firstComp;
        gameTable[second.x][second.y].type = firstType;
        movesLeft--;
        $('#moves').text(movesLeft);
    }
}

function explodeMagic(first, second) {
    var magic, other;
    if (first.type === CandyType.MAGIC) {
        magic = first;
        other = second;
    } else {
        magic = second;
        other = first;
    }

    var toRemove = [];
    toRemove.push(magic);
    gameTable.forEach(function (e) {
        e.forEach(function (e2) {
            if (magic.type === other.type) {
                toRemove.push(e2);
            } else if (e2.type === other.type) {
                toRemove.push(e2);
            }
        })
    });

    removeCandies(toRemove);
    checkMatches();
}

function addCandyIfHasEmptyInFirstRow() {
    gameTable.forEach(function (e) {
        if (e[0].component === undefined) {
            addCandyToGameTable(e[0].x, e[0].y);
        }
    })
}

function hasEmpty() {
    return gameTable.some(function (e) {
        return e.some(function (e2) {
            return e2.component === undefined;
        });
    });
}

function fillFromTop() {
    while (hasEmpty()) {
        addCandyIfHasEmptyInFirstRow();
        for (let i = M - 1; i >= 0; i--) {
            for (let j = N - 1; j >= 0; j--) {
                if (gameTable[i][j].component === undefined) {
                    for (k = j - 1; k >= 0; k--) {
                        if (gameTable[i][k].component !== undefined && gameTable[i][k].type !== CandyType.FALL_THROUGH) {
                            $(gameTable[i][k].component).animate({
                                top: gameTable[i][j].y * blockSize + "px"
                            }, 400, function () {
                                setTimeout(function () {

                                }, 600);
                            });
                            $(gameTable[i][k].component).attr('iX', gameTable[i][j].x);
                            $(gameTable[i][k].component).attr('iY', gameTable[i][j].y)
                            gameTable[i][j].component = gameTable[i][k].component;
                            gameTable[i][j].type = gameTable[i][k].type;
                            gameTable[i][k].component = undefined;
                            gameTable[i][k].type = undefined;
                            break;
                        }
                    }
                }
            }
        }
    }
}

function addMagicCandy(i, j) {
    var candy = getCandy(CandyType.MAGIC);
    candy.addClass('floor');
    candy.addClass('candy');

    candy.attr('iX', i);
    candy.attr('iY', j);

    candy.on('click', selectCandy);

    candy.css({
        width: blockSize,
        height: blockSize,
        top: j * blockSize,
        left: i * blockSize
    });
    gameArea.append(candy);
    return candy;
}

function removeCandies(array) {
    if (array.length > 5) {
        currentScore += N * M * 100;
    } else {
        currentScore += array.length * array.length * 10;
    }
    var counter = 0;
    array.forEach(function (e) {
        counter++;
        $(gameTable[e.x][e.y].component).remove();
        if (counter === 3 && array.length === 5) {
            gameTable[e.x][e.y].component = addMagicCandy(e.x, e.y);
            gameTable[e.x][e.y].type = CandyType.MAGIC;
        } else {
            gameTable[e.x][e.y].component = undefined;
            gameTable[e.x][e.y].type = undefined;
        }
    });
    $("#score").text(currentScore);
}

function cleanUp() {
    $(gameArea).remove();
    currentScore = 0;
    hud.remove();
    openMenu();
}

function gameWon() {
    name = document.getElementById("nameInput").value;
    endOfGameMenu.remove();
    scoreList.push({
        name: name,
        level: currentLevel,
        score: currentScore
    });
    if (currentLevel === 1) {
        currentLevel = 2;
    } else {
        currentLevel = 1;
    }
    cleanUp();
}

function gameLost() {
    cleanUp();
}

function checkEndOfGame() {
    if (currentScore >= scoreTarget) {
        gameArea.remove();
        endOfGameMenu = $('<div class="playerName"><input type="text" id="nameInput" placeholder="Player\'s name"/><button onclick="gameWon()">Continue</button></div>');
        endOfGameMenu.appendTo('body');
        currentScore += movesLeft*1000;
        $("#score").text(currentScore);
    }
    if (movesLeft <= 0) {
        gameLost();
    }
}

function checkMatches() {
    let hasMatch = true;
    while (hasMatch) {
        fillFromTop();
        hasMatch = false;
        for (let i = M - 1; i >= 0; i--) {
            for (let j = N - 1; j >= 0; j--) {
                if (gameTable[i][j] === CandyType.FALL_THROUGH) {
                    continue;
                }
                var horizontalArray = checkHorizontal(i, j);
                if (horizontalArray.length >= 3) {
                    removeCandies(horizontalArray);
                    hasMatch = true;
                    break;
                }
                var verticalArray = checkVertical(i, j);
                if (verticalArray.length >= 3) {
                    removeCandies(verticalArray);
                    hasMatch = true;
                    break;
                }
            }
            if (hasMatch) {
                break;
            }
        }
    }
    checkEndOfGame();
}

function checkVertical(i, j) {
    var array = [];
    array.push(gameTable[i][j]);
    for (let k = 1; k <= 4; k++) {
        if (j - k >= 0 && j - k < N) {
            if (gameTable[i][j].type === gameTable[i][j - k].type && gameTable[i][j].type !== CandyType.FALL_THROUGH) {
                array.push(gameTable[i][j - k]);
            } else {
                break;
            }
        }
    }
    return array;
}

function checkHorizontal(i, j) {
    var array = [];
    array.push(gameTable[i][j]);
    for (let k = 1; k <= 4; k++) {
        if (i - k >= 0 && i - k < M) {
            if (gameTable[i][j].type === gameTable[i - k][j].type && gameTable[i][j].type !== CandyType.FALL_THROUGH) {
                array.push(gameTable[i - k][j]);
            } else {
                break;
            }
        }
    }
    return array;
}

function createGameHud() {
    hud = $('<div id="hud"><div id="scoreCounter">Target: <span id="targetScore"></span></div><div id="scoreCounter">Score: <span id="score"></span></div><div id="movesLeft">Moves Left: <span id="moves"></span></div></div>');
    hud.appendTo('body');
    $("#score").text(currentScore);
    $("#targetScore").text(scoreTarget);
    $("#moves").text(movesLeft);
}

function newGame() {
    $(difficultySelector).remove();
    gameArea = $('<div></div>');
    gameArea.appendTo('body');
    gameArea.attr('id', 'gamearea');
    initGame();
    createGameHud();
    checkMatches();
}

function startBabyMode() {
    difficulty = Difficulty.BABY_MODE;
    newGame();
}

function startImpossible() {
    difficulty = Difficulty.IMPOSSIBLE;
    newGame();
}

function openDifficultySelector(){
    $(menu).remove();
    difficultySelector = $('<div></div>');
    difficultySelector.appendTo('body');
    difficultySelector.attr('id', 'difficulty');

    let babyModeButton = $('<div class="button">Baby Mode</div>');
    babyModeButton.on('click', startBabyMode);
    let impossibleModeButton = $('<div class="button">Impossible</div>');
    impossibleModeButton.on('click', startImpossible);
    babyModeButton.appendTo(difficultySelector);
    impossibleModeButton.appendTo(difficultySelector);
}

function openScoreboard() {
    $(menu).remove();
    scoreboard = $('<div></div>');
    scoreboard.append('<button class="backToMenuButton" onclick="openMenu()">Back To Menu</button>')
    scoreboard.append('<table id="scoreboard"></table>');
    scoreboard.appendTo('body');
    $('#scoreboard').append('<tr><th>Name</th><th>Score</th><th>Level</th></tr>');
    scoreList.sort(function (a, b) {
        return b.score-a.score;
    });
    scoreList.forEach(function (value) {
        $('#scoreboard').append('<tr>' + '<td>' + value.name + '</td>' + '<td>' + value.score + '</td>' + '<td>' + value.level + '</td>');
    })
}


function openMenu() {
    if (scoreboard !== undefined) {
        scoreboard.remove();
    }
    menu = $('<div></div>');
    menu.appendTo('body');
    menu.attr('id', 'menu');

    let newGameButton = $('<div class="button">New Game</div>');
    newGameButton.on('click', openDifficultySelector);
    let scoreBoard = $('<div class="button">Scoreboard</div>');
    scoreBoard.on('click', openScoreboard);
    newGameButton.appendTo(menu);
    scoreBoard.appendTo(menu);
}

$(document).ready(function () {
    music = $('<audio controls><source src="assets/Bfg%20Division.mp3" type="audio/mp3"></audio>');
    music.appendTo('body');
    openMenu();
});