const win = window;
const doc = document;
const canvas = doc.getElementById("game");
const canvasCtx = canvas.getContext("2d");
const gameState = {};

class GameObject
{
    constructor() {
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
    constructor(text = null, font = "20px Arial", textAlign = "left", textBaseline = "top", style = "black", fill = true) {
        super();
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

class Player extends GameObject
{
    constructor(name, avatar, colorIdentifier) {
        super();
        this.name = name;
        this.avatar = avatar;
        this.health = 1000;
        this.maxHealth = 1000;
        this.minions = [];
        this.colorIdentifier = colorIdentifier;
        this.renderer = new PlayerRenderer();
    }
}

class PlayerRenderer
{
    constructor() {
        this.avatarHeight = 65;
        this.healthBarHeight = 5;
        this.nameHeight = 20;
        this.padding = 10;
        this.avatarRenderer = new TextRenderer("" + this.avatarHeight + "px Arial", "center", "top", "black");
        this.nameRenderer = new TextRenderer("" + this.nameHeight + "px Arial", "center", "top", "black");
        this.healthBarRenderer = new HealthBarRenderer(this.healthBarHeight, 100);
    }
    render(gameObject) {
        const sl = gameObject.screenLocation;
        const oy = sl.y;
        gameObject.text = gameObject.avatar;
        sl.y += 20;
        this.avatarRenderer.render(gameObject);
        sl.y += this.avatarHeight + this.padding;
        this.healthBarRenderer.render(gameObject);
        sl.y += this.healthBarHeight + this.padding;
        gameObject.text = gameObject.name;
        this.nameRenderer.render(gameObject);
        sl.y = oy;
    }
}

class HealthBarRenderer
{
    constructor(height, width) {
        this.height = height;
        this.width = width;
    }

    render(gameObject) {
        const left = gameObject.screenLocation.x - this.width / 2.0;
        canvasCtx.fillStyle = "red";
        canvasCtx.fillRect(left, gameObject.screenLocation.y, this.width, this.height);
        canvasCtx.fillStyle = "green";
        const percentLife = gameObject.health / gameObject.maxHealth;
        canvasCtx.fillRect(left, gameObject.screenLocation.y, this.width*percentLife, this.height);
    }
}

const PlayerReservePadding = 20;
class PlayerReserve extends GameObject
{
    constructor(player) {
        super();
        this.renderer = new PlayerReserveRenderer(player.colorIdentifier);

        const size = {width: 50,height:50};
        for(let i = 0; i < 3; i++) {
            const slot = new PlayerReserveSlot();
                slot.size = size;
                slot.location = {x:i*(size.width+PlayerReservePadding),y:0};
            this.components.push(slot);
        }
    }
}

class PlayerReserveSlot extends GameObject
{
    constructor() {
        super();
        this.renderer = new RectRenderer("black", false);
    }
}

class PlayerReserveRenderer
{
    constructor(colorIdentifier) {
        this.colorIdentifier = colorIdentifier;
    }

    render(gameObject) {
        canvasCtx.fillStyle = this.colorIdentifier;
        const sl = gameObject.screenLocation;
        const s = gameObject.size;
        const pad = PlayerReservePadding;
        canvasCtx.fillRect(sl.x-pad, sl.y-pad, s.width+pad+pad, s.height+pad+pad);
    }
}

class Minion extends GameObject
{
    constructor(name, avatar, type, specialization, rarity, phy_attack, phy_defense, magic_attack, magic_defense, health, mana, attack_speed) {
        super();
        this.name = name;
        this.avatar = avatar;
        this.type = type;
        this.specialization = specialization;
        this.rarity = rarity;
        this.physicalAttack = phy_attack;
        this.physicalDefense = phy_defense;
        this.magicAttack = magic_attack;
        this.magicDefense = magic_defense;
        this.health = health;
        this.mana = mana;
        this.attackSpeed = attack_speed;
        this.state = "unused";
        this.renderer = new MinionRenderer();
    }
}

class MinionRenderer
{
    constructor() {
        this.avatarHeight = 45;
        this.avatarRenderer = new TextRenderer("" + this.avatarHeight + "px Arial", "left", "top", "black");
    }

    render(gameObject) {
        gameObject.text = gameObject.avatar;
        const sl = gameObject.screenLocation;
        const og = {x:sl.x,y:sl.y};
        sl.x -= 6;
        sl.y += 6;
        this.avatarRenderer.render(gameObject);
        gameObject.screenLocation = og;
    }
}

class BoardRenderer
{
    constructor(p1Color, p2Color) {
        this.p1Color = p1Color;
        this.p2Color = p2Color;
    }

    render(gameObject) {
        const sl = gameObject.screenLocation;
        const s = gameObject.size;
        canvasCtx.fillStyle = this.p2Color;
        canvasCtx.fillRect(sl.x, sl.y, s.width, s.height);
        canvasCtx.fillStyle = this.p1Color;
        canvasCtx.fillRect(sl.x, sl.y, s.width/2, s.height);
        canvasCtx.strokeStyle = "black";
        canvasCtx.strokeRect(sl.x, sl.y, s.width, s.height);
    }
}


const runGame = function() {
    initializeGameState();
    mainGameLoop();
};
const initializeGameState = function() {
    const time = performance.now();
    gameState.stats = { 
        frameCounter: 0, 
        times: [time, time, time, time, time],
        frameRate: 0,
    };

    const p1 = gameState.player1 = new Player("player", "😃", "wheat");
    const p2 = gameState.player2 = new Player("computer", "🧠", "lavender");

    gameState.minions = [
        new Minion("Fuzzy", "🦍", "Implication", "Virus", "Common", 1918, 900, 1180, 800, 4028, 495, 1.49),
        new Minion("Boole", "🐕", "Implication", "Modeler", "Common", 1475, 1300, 1328, 900, 6713, 495, 1.07),
        new Minion("Proof", "💦", "Implication", "Engineer", "Epic", 1711, 1160, 2994, 1595, 5191, 1121, 1.73),
        new Minion("Truth", "🦄", "Implication", "Dormant", "Common", 1623, 900, 1475, 1500, 6041, 743, 1.07),
        new Minion("Regression", "🦊", "Algorithm", "Virus", "Rare", 1931, 1337, 1188, 1188, 5967, 526, 1.64),
        new Minion("Divide and Conquer", "🐺", "Algorithm", "Modeler", "Rare", 1485, 1931, 1337, 1337, 9945, 526, 1.18),
        new Minion("Greedy", "🐯", "Algorithm", "Engineer", "Common", 990, 990, 1733, 1361, 4420, 684, 1.10),
        new Minion("Brute Force", "🐄", "Algorithm", "Dormant", "Common", 1361, 1114, 1238, 1856, 7459, 657, 0.99),
        new Minion("Data", "🐏", "Mathematician", "Virus", "Common", 1300, 1508, 800, 1340, 6525, 580, 1.14),
        new Minion("Equation", "🐪", "Mathematician", "Modeler", "Common", 1000, 2178, 900, 1508, 10875, 580, 0.82),
        new Minion("Theory", "🐘", "Mathematician", "Engineer", "Rare", 960, 1608, 1680, 2211, 6960, 1088, 1.09),
        new Minion("Law", "🦏", "Mathematician", "Dormant", "Epic", 1595, 2186, 1450, 3643, 14192, 1262, 1.19),
        new Minion("Drug", "🐀", "Abstraction", "Virus", "Common", 1625, 1125, 1000, 1000, 4950, 440, 1.38),
        new Minion("Lambda", "🦇", "Abstraction", "Modeler", "Rare", 1500, 1950, 1350, 1350, 9900, 528, 1.19),
        new Minion("Language", "🐨", "Abstraction", "Engineer", "Common", 1180, 800, 2065, 1100, 3580, 773, 1.19),
        new Minion("Transfer (knowledge)", "🦃", "Abstraction", "Dormant", "Rare", 1650, 1350, 1500, 2250, 8910, 792, 1.19),
        new Minion("Prophet", "🐧", "Dream", "Virus", "Epic", 2828, 1305, 1740, 1160, 5873, 725, 2.18),
        new Minion("Idea", "🐦", "Dream", "Modeler", "Common", 1500, 1300, 1350, 900, 6750, 500, 1.08),
        new Minion("Lucid", "🐊", "Dream", "Engineer", "Rare", 1440, 960, 2520, 1320, 4320, 938, 1.44),
        new Minion("Nightmare", "🐋", "Dream", "Dormant", "Common", 1650, 900, 1500, 1500, 6075, 750, 1.08),
        new Minion("Power", "🐠", "Concept", "Virus", "Common", 1300, 1575, 800, 1400, 6750, 600, 1.13),
        new Minion("Philosophy", "🐛", "Concept", "Modeler", "Epic", 1450, 3299, 1305, 2284, 16313, 870, 1.17),
        new Minion("Knowledge", "🐌", "Concept", "Engineer", "Common", 800, 1400, 1400, 1925, 6000, 938, 0.90),
        new Minion("Religion", "🦈", "Concept", "Dormant", "Common", 1100, 1575, 1000, 2625, 10125, 900, 0.81),
    ];

    var scene = new GameObject();
        scene.renderer = new RectRenderer("gainsboro");
        scene.size.width = canvas.width;
        scene.size.height = canvas.height;
    gameState.scene = scene;

    const statsBox = new GameObject();
        statsBox.location = {x:5,y:580};
        statsBox.size = {width:100,height:20};
        let fpsText = new TextGameObject("fps: 0.00", "10px monospace", "left", "top", "black");
            fpsText.location = {x:5,y:5};
            statsBox.components.push(fpsText);
        statsBox.updates.push(gObj => fpsText.setText("fps: " + gameState.stats.frameRate.toPrecision(4)));
    scene.components.push(statsBox);

    const centerTop = new GameObject();
        centerTop.location = {x: scene.size.width/2,y:0};
    scene.components.push(centerTop);

    const board = new GameObject();
        board.location = {x:-500,y:180};
        board.size = {width:1000,height:380};
        board.renderer = new BoardRenderer(p1.colorIdentifier, p2.colorIdentifier);
    centerTop.components.push(board);

    const heroBox = new GameObject();
        heroBox.location = {x:-500,y:0};
        heroBox.size = {width:1000,height:140};
    centerTop.components.push(heroBox);

    const heroCenter = new GameObject();
        heroCenter.location = {x:500,y:0};
    heroBox.components.push(heroCenter);

    //const p1 = gameState.player1;
        p1.location = {x:-150,y:0};
        p1.size = {width:100,height:140};
    heroCenter.components.push(p1);

    const reservePadding = 60;
    const p1Reserve = new PlayerReserve(p1);
        p1Reserve.size = {width:190,height:50};
        p1Reserve.location = {
            x:p1.location.x - p1.size.width/2 - p1Reserve.size.width - reservePadding,
            y:p1.size.height/2 - p1Reserve.size.height/2
        };
    heroCenter.components.push(p1Reserve);

    //const p2 = gameState.player2;
        p2.location = {x:150,y:0};
        p2.size = p1.size;
    heroCenter.components.push(p2);

    const p2Reserve = new PlayerReserve(p2);
        p2Reserve.size = {width:190,height:50};
        p2Reserve.location = {
            x:p2.location.x + p2.size.width/2 + reservePadding,
            y:p2.size.height/2 - p2Reserve.size.height/2
        };
    heroCenter.components.push(p2Reserve);

    // testing
    for(let i = 0; i < 3; i++) {
        let minion = gameState.minions[i];
        minion.state = "reserve";
        p1.minions.push(minion);
        p1Reserve.components[i].components.push(minion);
    }
    for(let i = 3; i < 6; i++) {
        let minion = gameState.minions[i];
        minion.state = "reserve";
        p2.minions.push(minion);
        p2Reserve.components[i%3].components.push(minion);
    }
};
const mainGameLoop = function() {
    // update
    updateStats(gameState.stats);
    gameState.scene.update();
    // render
    gameState.scene.updateScreenLocations({ x: 0, y: 0 });
    gameState.scene.render();
    // loop
    requestAnimationFrame(mainGameLoop);
};
const updateStats = function(stats) {
    const now = performance.now();
    const first = stats.times.shift();
    stats.frameRate = 1000.0 * (stats.times.length + 1) / (now - first);
    stats.times.push(now);
}
runGame();