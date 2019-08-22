const win = window;
const doc = document;
const canvas = doc.getElementById("game");
const canvasCtx = canvas.getContext("2d");
const gameState = {};

// class Player
// {
//     constructor(name, avatar) {
//         this.name = name;
//         this.avatar = avatar;
//         this.health = 1000;
//         this.minions = [];
//     }
// }

class GameObject
{
    constructor(name) {
        this.name = name;
        this.components = [];
        this.location = { x: 0, y: 0 };
        this.size = { height: 1, width: 1 };
        this.screenLocation = { x: 0, y: 0 };
        this.renderer = null;
        this.updates = [];
    }

    update() {
        this.updates.forEach(task => task(this));
        this.components.forEach(c => c.update());
    }

    updateScreenLocations(relativeLocation) {
        this.screenLocation.x = this.location.x + relativeLocation.x;
        this.screenLocation.y = this.location.y + relativeLocation.y;
        this.components.forEach(c => c.updateScreenLocations(this.screenLocation));
    }

    render() {
        if (this.renderer) this.renderer.render(this);
        this.components.forEach(c => c.render());
    }
}

class RectRenderer
{
    constructor(style = "black", fill = true) {
        this.style = style;
        this.fill = fill;
    }

    render(gameObject) {
        if (this.fill) {
            canvasCtx.fillStyle = this.style;
            canvasCtx.fillRect(gameObject.screenLocation.x, gameObject.screenLocation.y, gameObject.size.width, gameObject.size.height);
        } else {
            canvasCtx.strokeStyle = this.style;
            canvasCtx.strokeRect(gameObject.screenLocation.x, gameObject.screenLocation.y, gameObject.size.width, gameObject.size.height);
        }
    }
}

class TextGameObject extends GameObject
{
    constructor(name, text = null, font = "20px Arial", textAlign = "left", textBaseline = "top", style = "black", fill = true) {
        super(name);
        this.text = text;
        this.renderer = new TextRenderer(font, textAlign, textBaseline, style, fill);
    }

    setText(text) {
        this.text = text;
    }
}

class TextRenderer
{
    constructor(font = "20px Arial", textAlign = "left", textBaseline = "top", style = "black", fill = true) {
        this.font = font;
        this.textAlign = textAlign;
        this.textBaseline = textBaseline;
        this.style = style;
        this.fill = fill;
    }

    render(gameObject) {
        canvasCtx.textAlign = this.textAlign;
        canvasCtx.textBaseline = this.textBaseline;
        canvasCtx.font = this.font;
        if (this.fill) {
            canvasCtx.fillStyle = this.style;
            canvasCtx.fillText(gameObject.text, gameObject.screenLocation.x, gameObject.screenLocation.y);
        } else {
            canvasCtx.strokeStyle = this.style;
            canvasCtx.strokeText(gameObject.text, gameObject.screenLocation.x, gameObject.screenLocation.y);
        }
    }
}

// class Minion extends GameObject
// {
//     constructor(name, avatar, type, specialization, rarity, phy_attack, phy_defense, magic_attack, magic_defense, health, mana, attack_speed) {
//         super(name);
//         this.avatar = avatar;
//         this.type = type;
//         this.specialization = specialization;
//         this.rarity = rarity;
//         this.physicalAttack = phy_attack;
//         this.physicalDefense = phy_defense;
//         this.magicAttack = magic_attack;
//         this.magicDefense = magic_defense;
//         this.health = health;
//         this.mana = mana;
//         this.attackSpeed = attack_speed;
//         this.onBoard = false;
//         this.size.height = 50;
//         this.size.width = 50;
//     }
// }

const mainGameLoop = function() {
    update(gameState);
    render(gameState);
    requestAnimationFrame(mainGameLoop);
};
const update = function(state) {
    updateStats(state.stats);
    gameState.scene.update();
};
const updateStats = function(stats) {
    stats.frameCounter += 1;

    const now = performance.now();
    const first = stats.times.shift();
    stats.frameRate = 1000.0 * (stats.times.length + 1) / (now - first);
    stats.times.push(now);
}
const render = function(state) {
    state.scene.updateScreenLocations({ x: 0, y: 0 });
    state.scene.render();
};
// const drawGame = function(state) {
//     renderBoard(state);
//     renderPlayers(state);
// };
// const renderBoard = function(state) {
//     const middle = canvasCtx.canvas.width / 2;
//     const width = 1000;
//     const height = 600;
//     const top = 250;
//     const numVerticalCells = 6;
//     const numHorizontalCells = 10;
//     const cellHeight = 1.0 * height / numVerticalCells;
//     const cellWidth = 1.0 * width / numHorizontalCells;
//     canvasCtx.fillStyle = "darkgray";
//     canvasCtx.fillRect(middle-(width/2), top, width, height);
//     canvasCtx.fillStyle = "gray";
//     canvasCtx.fillRect(middle-(width/2), top, width/2, height);
//     canvasCtx.strokeStyle = "black";
//     canvasCtx.strokeRect(middle-(width/2), top, width, height);
//     for(let i = 0; i < numVerticalCells; i++) {
//         let offset = i * cellHeight;
//         canvasCtx.strokeRect(middle-(width/2), top+offset, width, cellHeight);
//     }
//     for(let i = 0; i < numHorizontalCells; i++) {
//         let offset = i * cellWidth;
//         canvasCtx.strokeRect(middle-(width/2)+offset, top, cellWidth, height);
//     }
// };
// const renderPlayers = function(state) {
//     // player 1
//     const middle = canvasCtx.canvas.width / 2;
//     const offset = 150;

//     // avatars
//     canvasCtx.textAlign = "center";
//     canvasCtx.textBaseline = "top";
//     canvasCtx.fillStyle = "black";
//     canvasCtx.font = "100px Arial";
//     canvasCtx.fillText(state.player1.avatar, middle - offset - 25, 20);
//     canvasCtx.fillText(state.player2.avatar, middle + offset + 25, 20);
//     canvasCtx.font = "25px Arial";
//     canvasCtx.fillText(state.player1.name, middle - offset - 25, 145);
//     canvasCtx.fillText(state.player2.name, middle + offset + 25, 145);
//     // health bars
//     canvasCtx.fillStyle = "red";
//     canvasCtx.fillRect(middle - offset - 75, 130, 100, 5);
//     canvasCtx.fillRect(middle + offset - 25, 130, 100, 5);
//     canvasCtx.fillStyle = "green";
//     canvasCtx.fillRect(middle - offset - 75, 130, 100.0 * state.player1.health / 1000, 5);
//     canvasCtx.fillRect(middle + offset - 25, 130, 100.0 * state.player2.health / 1000, 5);

//     // reserve minions
//     const minionBankPadding = 50;
//     const reserves1 = state.player1.minions.filter(m => m.onBoard == false);
//     let locationLeft = middle - offset - 100 - minionBankPadding - 150 - 40 + 25;
//     reserves1.forEach(minion => {
//         canvasCtx.fillStyle = "black";
//         canvasCtx.font = "50px Arial";
//         canvasCtx.fillText(minion.avatar, locationLeft, 45);
//         locationLeft += 70;
//     });

//     const reserves2 = state.player2.minions.filter(m => m.onBoard == false);
//     locationLeft = middle + offset + 100 + minionBankPadding + 25;
//     reserves2.forEach(minion => {
//         canvasCtx.fillStyle = "black";
//         canvasCtx.font = "50px Arial";
//         canvasCtx.fillText(minion.avatar, locationLeft, 45);
//         locationLeft += 70;
//     });
// };
// const drawStats = function(stats) {
//     if (stats.frameCounter < 1) return;
//     canvasCtx.textAlign = "left";
//     canvasCtx.textBaseline = "top";
//     canvasCtx.fillStyle = "black";
//     canvasCtx.font = "10px monospace";
//     let bottom = canvasCtx.canvas.height;
//     canvasCtx.fillText("  fps: " + stats.frameRate.toPrecision(4), 10, bottom - 30);
//     canvasCtx.fillText("frame: " + stats.frameCounter, 10, bottom - 15);
// };
const resizeCanvas = function() {
    canvas.width  = win.innerWidth;
    canvas.height = win.innerHeight;
    gameState.scene.size.width = win.innerWidth;
    gameState.scene.size.height = win.innerHeight;
}

const runGame = function() {
    initializeGameState();
    resizeCanvas();
    win.addEventListener("resize", resizeCanvas);
    mainGameLoop();
};
const initializeGameState = function() {
    const time = performance.now();
    gameState.stats = { 
        frameCounter: 0, 
        times: [time, time, time, time, time, time, time, time, time, time, time, time, time, time, time],
        frameRate: 0,
    };

    gameState.scene = new GameObject("GameScene");
        gameState.scene.renderer = new RectRenderer("lightgray");

    const statsBox = new GameObject("StatsBox");
        statsBox.location.x = 20;
        statsBox.location.y = 20;
        statsBox.size.width = 100;
        statsBox.size.height = 35;
        statsBox.renderer = new RectRenderer("darkgray");
        let fpsText = new TextGameObject("FpsText", "  fps: 0.00", font = "10px monospace", style = "black");
            fpsText.location.x = 5;
            fpsText.location.y = 5;
            statsBox.components.push(fpsText);
        let frameCounterText = new TextGameObject("FrameCounterText", "frame: 0", font = "10px monospace", style = "black");
            frameCounterText.location.x = 5;
            frameCounterText.location.y = 20;
            statsBox.components.push(frameCounterText);
        statsBox.updates.push(gObj => {
            fpsText.setText("  fps: " + gameState.stats.frameRate.toPrecision(4));
            frameCounterText.setText("frame: " + gameState.stats.frameCounter);
        });
    gameState.scene.components.push(statsBox);


    // gameState.player1 = new Player("player", "🐵");
    // gameState.player2 = new Player("computer", "🐷");

    // gameState.minions = [
    //     new Minion("Fuzzy", "💂", "Implication", "Virus", "Common", 1918, 900, 1180, 800, 4028, 495, 1.49),
    //     new Minion("Boole", "♈", "Implication", "Modeler", "Common", 1475, 1300, 1328, 900, 6713, 495, 1.07),
    //     new Minion("Proof", "♉", "Implication", "Engineer", "Epic", 1711, 1160, 2994, 1595, 5191, 1121, 1.73),
    //     new Minion("Truth", "♊", "Implication", "Dormant", "Common", 1623, 900, 1475, 1500, 6041, 743, 1.07),
    //     new Minion("Regression", "♋", "Algorithm", "Virus", "Rare", 1931, 1337, 1188, 1188, 5967, 526, 1.64),
    //     new Minion("Divide and Conquer", "♌", "Algorithm", "Modeler", "Rare", 1485, 1931, 1337, 1337, 9945, 526, 1.18),
    //     new Minion("Greedy", "♍", "Algorithm", "Engineer", "Common", 990, 990, 1733, 1361, 4420, 684, 1.10),
    //     new Minion("Brute Force", "♎", "Algorithm", "Dormant", "Common", 1361, 1114, 1238, 1856, 7459, 657, 0.99),
    //     new Minion("Data", "♏", "Mathematician", "Virus", "Common", 1300, 1508, 800, 1340, 6525, 580, 1.14),
    //     new Minion("Equation", "♐", "Mathematician", "Modeler", "Common", 1000, 2178, 900, 1508, 10875, 580, 0.82),
    //     new Minion("Theory", "♑", "Mathematician", "Engineer", "Rare", 960, 1608, 1680, 2211, 6960, 1088, 1.09),
    //     new Minion("Law", "♒", "Mathematician", "Dormant", "Epic", 1595, 2186, 1450, 3643, 14192, 1262, 1.19),
    //     new Minion("Drug", "♓", "Abstraction", "Virus", "Common", 1625, 1125, 1000, 1000, 4950, 440, 1.38),
    //     new Minion("Lambda", "🕎", "Abstraction", "Modeler", "Rare", 1500, 1950, 1350, 1350, 9900, 528, 1.19),
    //     new Minion("Language", "☮", "Abstraction", "Engineer", "Common", 1180, 800, 2065, 1100, 3580, 773, 1.19),
    //     new Minion("Transfer (knowledge)", "☪", "Abstraction", "Dormant", "Rare", 1650, 1350, 1500, 2250, 8910, 792, 1.19),
    //     new Minion("Prophet", "☦", "Dream", "Virus", "Epic", 2828, 1305, 1740, 1160, 5873, 725, 2.18),
    //     new Minion("Idea", "✝", "Dream", "Modeler", "Common", 1500, 1300, 1350, 900, 6750, 500, 1.08),
    //     new Minion("Lucid", "☯", "Dream", "Engineer", "Rare", 1440, 960, 2520, 1320, 4320, 938, 1.44),
    //     new Minion("Nightmare", "☸", "Dream", "Dormant", "Common", 1650, 900, 1500, 1500, 6075, 750, 1.08),
    //     new Minion("Power", "✡", "Concept", "Virus", "Common", 1300, 1575, 800, 1400, 6750, 600, 1.13),
    //     new Minion("Philosophy", "🕉", "Concept", "Modeler", "Epic", 1450, 3299, 1305, 2284, 16313, 870, 1.17),
    //     new Minion("Knowledge", "⚛", "Concept", "Engineer", "Common", 800, 1400, 1400, 1925, 6000, 938, 0.90),
    //     new Minion("Religion", "🛐", "Concept", "Dormant", "Common", 1100, 1575, 1000, 2625, 10125, 900, 0.81),
    // ];
    // gameState.player1.minions.push(gameState.minions[0]);
    // gameState.player1.minions.push(gameState.minions[1]);
    // gameState.player1.minions.push(gameState.minions[2]);
    // gameState.player2.minions.push(gameState.minions[3]);
    // gameState.player2.minions.push(gameState.minions[4]);
    // gameState.player2.minions.push(gameState.minions[5]);
};
runGame();