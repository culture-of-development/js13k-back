const win = window;
const doc = document;
const canvas = doc.getElementById("game");
const canvasCtx = canvas.getContext("2d");
const uiCanvas = doc.createElement("canvas");
uiCanvas.width = canvas.width;
uiCanvas.height = canvas.height;
const uiCtx = uiCanvas.getContext("2d");
let gameState;

class GameObject
{
    constructor() {
        this.components = [];
        this.location = { x: 0, y: 0 };
        this.size = { height: 1, width: 1 };
        this.screenLocation = { x: 0, y: 0 };
        this.renderer = null;
        this.updateTasks = [];
        this.parent = null;
        this.layer = null;
        this.handlers = {};
    }

    addUpdateTask(task) {
        this.updateTasks.push(task);
    }

    update() {
        this.updateTasks.forEach(task => task(this));
        this.components.forEach(c => c.update());
    }

    render(relativeScreenLocation) {
        // update screen location
        this.screenLocation.x = this.location.x + relativeScreenLocation.x;
        this.screenLocation.y = this.location.y + relativeScreenLocation.y;
        if (this.renderer) this.renderer.render(this);
        this.components.forEach(c => c.render(this.screenLocation));
    }

    getObjectsAt(coords, buffer) {
        let x = coords.x;
        let y = coords.y;
        let sl = this.screenLocation;
        let size = this.size;
        if (x >= sl.x && x <= (sl.x + size.width)) {
            if (y >= sl.y && y <= (sl.y + size.height)) {
                buffer.push(this);
            }
        }
        this.components.forEach(c => c.getObjectsAt(coords, buffer));
    }

    addComponent(gameObject) {
        if (gameObject.parent) {
            gameObject.parent.removeComponent(gameObject);
        }
        this.components.push(gameObject);
        gameObject.parent = this;
    }

    removeComponent(gameObject) {
        if (arrayRemove(this.components, gameObject)) {
            gameObject.parent = null;
        }
    }

    addHandler(event, handler) {
        let eventHandlers = this.handlers[event] = this.handlers[event] || [];
        if (eventHandlers.indexOf(handler) < 0) {
            eventHandlers.push(handler);
        }
    }

    removeHandler(event, handler) {
        let eventHandlers = this.handlers[event];
        if (eventHandlers) {
            arrayRemove(eventHandlers, handler);
        }
    }

    handle(event, data) {
        (this.handlers[event] || []).forEach(h => h(data));
    }

    getLayer() {
        if (this.layer) return this.layer;
        if (this.parent) return this.parent.getLayer();
        return canvasCtx;
    }
}

class Timer extends GameObject
{
    constructor(duration) {
        super();
        this.duration = duration;
        this.startTime = null;
        this.isRunning = false;
        this.setRemaining(this.duration);
    }

    setRemaining(timeRemaining) {
        this.timeRemaining = timeRemaining;
        this.text = (this.timeRemaining/1000).toFixed(0);
    }

    start() {
        this.startTime = gameState.now;
        this.isRunning = true;
        this.setRemaining(this.duration);
    }

    update() {
        if (!this.isRunning) return;
        let runningSeconds = gameState.now - this.startTime;
        let timeRemaining = Math.max(0, this.duration - runningSeconds);
        this.setRemaining(timeRemaining);
        if (this.timeRemaining == 0) {
            this.isRunning = false;
            this.handle("timer", null);
        }
    }
}

class CircularCountdownTimerRenderer
{
    constructor(radius, thickness) {
        this.textRenderer = new TextRenderer("75px monospace", "center", "middle", "black", true);
        this.arcRenderer = new ArcRenderer(radius, thickness, "red", false);
    }

    render(gameObject) {
        gameObject.startAngle = 0.5 * Math.PI;
        let percentTimeRemaining = 1 - gameObject.timeRemaining / gameObject.duration;
        gameObject.endAngle = (0.5 + (2 * percentTimeRemaining)) * Math.PI;
        this.arcRenderer.render(gameObject);
        this.textRenderer.render(gameObject);
    }
}

class Scene extends GameObject
{
    constructor(backgroundColor) {
        super();
        this.renderer = new RectRenderer(backgroundColor);
        this.size = {width:canvas.width,height:canvas.height};
        
        const mouseObject = this.mouseObject = new GameObject();
            mouseObject.layer = uiCtx;
            this.addHandler("mousemove", coords => mouseObject.location = coords);
        this.addComponent(mouseObject);
    }
}

class Button extends GameObject
{
    constructor(text, width, height, font, textColor, backgroundColor) {
        super();
        this.text = text;
        this.size = {width, height};
        this.renderer = new ButtonRenderer(font, textColor, backgroundColor);
    }
}

class ButtonRenderer
{
    constructor(font, textColor, backgroundColor) {
        this.textRenderer = new TextRenderer(font, "center", "middle", textColor, true);
        this.backgroundRenderer = new RectRenderer(backgroundColor, true);
    }

    render(gameObject) {
        this.backgroundRenderer.render(gameObject);
        let centerText = new GameObject();
        centerText.text = gameObject.text;
        centerText.screenLocation = {
            x: gameObject.screenLocation.x + gameObject.size.width / 2,
            y: gameObject.screenLocation.y + gameObject.size.height / 2
        };
        this.textRenderer.render(centerText);
    }
}

class RectRenderer
{
    constructor(style = "black", fill = true, lineWidth = 1) {
        this.style = style;
        this.fill = fill;
        this.lineWidth = lineWidth;
    }

    render(gameObject) {
        let ctx = gameObject.getLayer();
        ctx.lineWidth = this.lineWidth;
        if (this.fill) {
            ctx.fillStyle = this.style;
            ctx.fillRect(gameObject.screenLocation.x, gameObject.screenLocation.y, gameObject.size.width, gameObject.size.height);
        } else {
            ctx.strokeStyle = this.style;
            ctx.strokeRect(gameObject.screenLocation.x, gameObject.screenLocation.y, gameObject.size.width, gameObject.size.height);
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
        let ctx = gameObject.getLayer();
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;
        ctx.font = this.font;
        if (this.fill) {
            ctx.fillStyle = this.style;
            ctx.fillText(gameObject.text, gameObject.screenLocation.x, gameObject.screenLocation.y);
        } else {
            ctx.strokeStyle = this.style;
            ctx.strokeText(gameObject.text, gameObject.screenLocation.x, gameObject.screenLocation.y);
        }
    }
}

class ArcRenderer
{
    constructor(radius, thickness, style, fill = false) {
        this.radius = radius;
        this.thickness = thickness;
        this.style = style;
        this.fill = fill;
    }

    render(gameObject) {
        let ctx = gameObject.getLayer();
        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.arc(gameObject.screenLocation.x, gameObject.screenLocation.y, this.radius, gameObject.startAngle, gameObject.endAngle, true);
        if (this.fill) {
            ctx.fillStyle = this.style;
            ctx.fill();
        } else {
            ctx.strokeStyle = this.style;
            ctx.stroke();
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
        this.reserve = new PlayerReserve(this, 3);
    }

    addMinion(minion) {
        this.minions.push(minion);
    }

    removeMinion(minion) {
        arrayRemove(this.minions, minion);
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
        let ctx = gameObject.getLayer();
        ctx.fillStyle = "red";
        ctx.fillRect(left, gameObject.screenLocation.y, this.width, this.height);
        ctx.fillStyle = "green";
        const percentLife = gameObject.health / gameObject.maxHealth;
        ctx.fillRect(left, gameObject.screenLocation.y, this.width*percentLife, this.height);
    }
}

const PlayerReservePadding = 20;
class PlayerReserve extends GameObject
{
    constructor(player, minionCount) {
        super();
        this.renderer = new PlayerReserveRenderer(player);

        minionCount = minionCount || 3;
        this.player = player;
        const size = {width: 50,height:50};
        this.slots = [];
        for(let i = 0; i < minionCount; i++) {
            const slot = new PlayerReserveSlot(this);
                slot.size = size;
                slot.location = {x:i*(size.width+PlayerReservePadding),y:0};
            this.slots.push(slot);
            this.addComponent(slot);
        }
    }
}

class PlayerReserveSlot extends GameObject
{
    constructor(playerReserve) {
        super();
        this.renderer = new RectRenderer("black", false);
        this.minion = null;
        this.player = playerReserve.player;
    }

    setMinion(minion) {
        this.addComponent(minion);
        this.minion = minion;
        minion.location = {x:0,y:0};
    }

    removeMinion() {
        this.removeComponent(this.minion);
        this.minion = null;
    }

    isOccupied() {
        return this.components.length > 0;
    }
}

class PlayerReserveRenderer
{
    render(gameObject) {
        let ctx = gameObject.getLayer();
        ctx.fillStyle = gameObject.player.colorIdentifier;
        const sl = gameObject.screenLocation;
        const s = gameObject.size;
        const pad = PlayerReservePadding;
        ctx.fillRect(sl.x-pad, sl.y-pad, s.width+pad+pad, s.height+pad+pad);
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
        this.maxHealth = health;
        this.mana = mana;
        this.attackSpeed = attack_speed;
        this.size = {height:50,width:50};
        this.renderer = new MinionRenderer();
        this.minionInfo = new MinionInfo(this);
        this.addComponent(this.minionInfo);

        this.addHandler("info", coords => this.minionInfo.toggleVisible());
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

class MinionInfo extends GameObject
{
    constructor(minion) {
        super();
        this.minion = minion;
        this.visible = false;
        this.renderer = new MinionInfoRenderer();
        this.layer = uiCtx;
    }

    toggleVisible() {
        this.visible = !this.visible;
    }
}

const rarityColors = {
    "Common": "gray",
    "Rare": "teal",
    "Epic": "goldenrod"
};
const characterIcons = {
    // specializations
    "Virus": "🐍",
    "Engineer": "🔧",
    "Dormant": "🛡",
    "Modeler": "💎",
    // types
    "Implication": "💡",
    "Algorithm": "🕰️",
    "Mathematician": "🕯",
    "Abstraction": "⚖",
    "Dream": "🗿",
    "Concept": "✒"
};

class MinionInfoRenderer
{
    constructor() {
        this.width = 190;
        this.height = 130;

        this.textRenderer = new TextRenderer("15px Arial", "center", "top", "white", true);
    }

    render(gameObject) {
        if (gameObject.visible == false) return;
        let minion = gameObject.minion;
        let sl = gameObject.screenLocation;
        let padding = 5;
        let top = sl.y-(this.height-50)/2;
        let left = sl.x + 60;
        let right = left + this.width;
        let center = left + this.width/2;
        // box
        let ctx = gameObject.getLayer();
        ctx.fillStyle = rarityColors[minion.rarity];
        ctx.fillRect(left, top, this.width, this.height);
        // name
        let textObj = new GameObject();
        textObj.layer = ctx;
        textObj.screenLocation = {x:center,y:top+padding};
        textObj.text = minion.name;
        this.textRenderer.textAlign = "center";
        this.textRenderer.render(textObj);
        // type icon
        textObj.text = characterIcons[minion.type];
        textObj.screenLocation = {x:left+padding,y:top+padding};
        this.textRenderer.textAlign = "left";
        this.textRenderer.render(textObj);
        // specialization icon
        textObj.text = characterIcons[minion.specialization];
        textObj.screenLocation = {x:right-padding,y:top+padding};
        this.textRenderer.textAlign = "right";
        this.textRenderer.render(textObj);
        // this.physicalAttack = phy_attack;
        textObj.text = "⚔️ " + minion.physicalAttack;
        textObj.screenLocation = {x:left+padding+padding,y:top+padding+30};
        this.textRenderer.textAlign = "left";
        this.textRenderer.render(textObj);
        // this.physicalDefense = phy_defense;
        textObj.text = "⛨ " + minion.physicalDefense;
        textObj.screenLocation.y += 25;
        this.textRenderer.render(textObj);
        // this.maxHealth = health;
        textObj.text = "♥️ " + minion.maxHealth;
        textObj.screenLocation.y += 25;
        this.textRenderer.render(textObj);
        // this.magicAttack = magic_attack;
        textObj.text = minion.magicAttack + " 💫";
        textObj.screenLocation = {x:right-padding-padding,y:top+padding+30};
        this.textRenderer.textAlign = "right";
        this.textRenderer.render(textObj);
        // this.magicDefense = magic_defense;
        textObj.text = minion.magicDefense + " 💢";
        textObj.screenLocation.y += 25;
        this.textRenderer.render(textObj);
        // this.mana = mana;
        textObj.text = minion.mana + " 🔮";
        textObj.screenLocation.y += 25;
        this.textRenderer.render(textObj);
        // this.attackSpeed = attack_speed;
        textObj.text = "⌛ " + minion.attackSpeed + " ⌛";
        textObj.screenLocation.x = center
        textObj.screenLocation.y += 25;
        this.textRenderer.textAlign = "center";
        this.textRenderer.render(textObj);
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
        let ctx = gameObject.getLayer();
        ctx.fillStyle = this.p2Color;
        ctx.fillRect(sl.x, sl.y, s.width, s.height);
        ctx.fillStyle = this.p1Color;
        ctx.fillRect(sl.x, sl.y, s.width/2, s.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(sl.x, sl.y, s.width, s.height);
    }
}

class BoardGrid extends GameObject
{
    constructor(player) {
        super();
        this.player = player;
        for(let r = 0; r < 4; r++) {
            for(let c = 0; c < 5; c++) {
                let cell = new BoardCell(this);
                    cell.size = {width:100,height:95};
                    cell.location = {x:100*c,y:95*r};
                this.addComponent(cell);
            }
        }
    }
}

class BoardCell extends GameObject
{
    constructor(boardGrid) {
        super();
        this.renderer = new RectRenderer("lightgray", false);
        this.minion = null;
        this.player = boardGrid.player;
    }

    setMinion(minion) {
        this.addComponent(minion);
        this.minion = minion;
        minion.location = {x:25,y:22};
    }

    removeMinion() {
        this.removeComponent(this.minion);
        this.minion = null;
    }

    isOccupied() {
        return this.components.length > 0;
    }
}


const runGame = function() {
    initializeGameState();
    initializeInteraction();
    mainGameLoop();
};
const initializeInteraction = function() {
    function prevDef(e) { e.preventDefault(); return false; }
    const fireMouseEvent = function(name, e) {
        const mouseData = {x:e.offsetX, y:e.offsetY};
        let objects = [];
        gameState.scene.getObjectsAt(mouseData, objects);
        while(objects.length > 0) {
            objects.pop().handle(name, mouseData);
        }
    };
    canvas.addEventListener('mousemove', e => fireMouseEvent("mousemove", e));
    canvas.addEventListener('mouseup', function(e) {
        if (e.button == 2) fireMouseEvent("info", e);
        if (e.button == 0) fireMouseEvent("interact", e);
    }, true);
    canvas.addEventListener('selectstart', prevDef, false);
    canvas.addEventListener('contextmenu', prevDef, false);
};
const arrayRemove = function(array, value) {
    var index = array.indexOf(value);
    if (index > -1) {
        array.splice(index, 1);
    }
    return index > -1;
};
const initializeGameState = function() {
    gameState = {};

    // timing and perf
    const time = performance.now();
    let times = [];
    for(var i = 0; i < 99; i++) times.push(time);
    gameState.stats = { 
        frameCounter: 0, 
        times,
        frameRate: 0,
    };

    // game stuff
    const p1 = gameState.player1 = new Player("player", "😃", "wheat");
    const p2 = gameState.player2 = new Player("computer", "🧠", "lavender");

    const minions = gameState.minions = [
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
        new Minion("Transfer", "🦃", "Abstraction", "Dormant", "Rare", 1650, 1350, 1500, 2250, 8910, 792, 1.19),
        new Minion("Prophet", "🐧", "Dream", "Virus", "Epic", 2828, 1305, 1740, 1160, 5873, 725, 2.18),
        new Minion("Idea", "🐦", "Dream", "Modeler", "Common", 1500, 1300, 1350, 900, 6750, 500, 1.08),
        new Minion("Lucid", "🐊", "Dream", "Engineer", "Rare", 1440, 960, 2520, 1320, 4320, 938, 1.44),
        new Minion("Nightmare", "🐋", "Dream", "Dormant", "Common", 1650, 900, 1500, 1500, 6075, 750, 1.08),
        new Minion("Power", "🐠", "Concept", "Virus", "Common", 1300, 1575, 800, 1400, 6750, 600, 1.13),
        new Minion("Philosophy", "🐛", "Concept", "Modeler", "Epic", 1450, 3299, 1305, 2284, 16313, 870, 1.17),
        new Minion("Knowledge", "🐌", "Concept", "Engineer", "Common", 800, 1400, 1400, 1925, 6000, 938, 0.90),
        new Minion("Religion", "🦈", "Concept", "Dormant", "Common", 1100, 1575, 1000, 2625, 10125, 900, 0.81),
    ];

    // drag state
    const drag = gameState.dragState = {
        object: null,
        returnLocation: null,
        returnObject: null,
        handled: false,
    };
    drag.clear = function() {
        let o = drag.object;
        if (o) {
            o.location = drag.returnLocation;
            drag.returnObject.addComponent(o);
        }
        drag.object = null;
        drag.returnLocation = null;
        drag.returnObject = null;
    };
    drag.start = function(mouseInfo, minion) {
        if (!drag.handled && drag.object) {
            drag.clear();
            return;
        }
        if (minion.parent.player != p1) return;
        drag.handled = true;
        drag.object = minion;
        drag.returnLocation = minion.location;
        drag.returnObject = minion.parent;
        let sl = minion.screenLocation;
        minion.location = {x:sl.x-mouseInfo.x,y:sl.y-mouseInfo.y};
        gameState.scene.mouseObject.addComponent(minion);
    }
    minions.forEach(m => m.addHandler("interact", mouseInfo => drag.start(mouseInfo, m)));


    // game scene
    var scene = gameState.gameScene = new Scene("gainsboro");

    const statsBox = new GameObject();
        statsBox.layer = uiCtx;
        statsBox.location = {x:5,y:580};
        statsBox.size = {width:100,height:20};
        let fpsText = new TextGameObject("fps: 0.00", "10px monospace", "left", "top", "black");
            fpsText.layer = uiCtx;
            fpsText.location = {x:5,y:5};
            statsBox.addComponent(fpsText);
        statsBox.addUpdateTask(gObj => fpsText.setText("fps: " + gameState.stats.frameRate.toPrecision(4)));
    scene.addComponent(statsBox);

    const centerTop = new GameObject();
        centerTop.location = {x: scene.size.width/2,y:0};
    scene.addComponent(centerTop);

    const board = new GameObject();
        board.location = {x:-500,y:180};
        board.size = {width:1000,height:380};
        board.renderer = new BoardRenderer(p1.colorIdentifier, p2.colorIdentifier);
    centerTop.addComponent(board);

    const p1BoardGrid = new BoardGrid(p1);
        p1BoardGrid.location = {x:0,y:0};
        p1BoardGrid.size = {width:500,height:380};
    board.addComponent(p1BoardGrid);

    const p2BoardGrid = new BoardGrid(p2);
        p2BoardGrid.location = {x:500,y:0};
        p2BoardGrid.size = {width:500,height:380};
    board.addComponent(p2BoardGrid);

    const heroBox = new GameObject();
        heroBox.location = {x:-500,y:15};
        heroBox.size = {width:1000,height:140};
    centerTop.addComponent(heroBox);

    const heroCenter = new GameObject();
        heroCenter.location = {x:500,y:0};
    heroBox.addComponent(heroCenter);

    //const p1 = gameState.player1;
        p1.location = {x:-150,y:0};
        p1.size = {width:100,height:140};
    heroCenter.addComponent(p1);

    const reservePadding = 60;
    const p1Reserve = p1.reserve;
        p1Reserve.size = {width:190,height:50};
        p1Reserve.location = {
            x:p1.location.x - p1.size.width/2 - p1Reserve.size.width - reservePadding,
            y:p1.size.height/2 - p1Reserve.size.height/2
        };
    heroCenter.addComponent(p1Reserve);

    //const p2 = gameState.player2;
        p2.location = {x:150,y:0};
        p2.size = p1.size;
    heroCenter.addComponent(p2);

    const p2Reserve = p2.reserve;
        p2Reserve.size = {width:190,height:50};
        p2Reserve.location = {
            x:p2.location.x + p2.size.width/2 + reservePadding,
            y:p2.size.height/2 - p2Reserve.size.height/2
        };
    heroCenter.addComponent(p2Reserve);

    const minionPlacementTimer = new Timer(5000);
        minionPlacementTimer.renderer = new CircularCountdownTimerRenderer(55, 7);
        minionPlacementTimer.location = {x:0,y:heroBox.size.height/2};
        minionPlacementTimer.addHandler("timer", runCombat);
    heroCenter.addComponent(minionPlacementTimer);
    scene.addHandler("activate", _ => minionPlacementTimer.start());

    
    // intro scene
    scene = gameState.introScene = new Scene("gainsboro");

    // start button
    let startGameButton = new Button("Start Game!", 400, 100, "20px Arial", "white", "green");
        startGameButton.location = {x:350,y:250};
        startGameButton.addHandler("interact", startNewEpisode);
    scene.addComponent(startGameButton);


    // set the current scene
    gameState.setScene = function(scene) {
        gameState.scene = scene;
        scene.handle("activate", null);
    }
    gameState.setScene(gameState.introScene);
};
const runCombat = function() {
    // TODO: disable dragging
    const p1 = gameState.player1;
    const p2 = gameState.player2;

    let player = Math.random() < 0.5 ? p1 : p2;
    let damage = (Math.random() * 0.1 + 0.06) * player.maxHealth;
    player.health -= Math.min(player.health, damage);
    if (player.health <= 0) {
        console.log("TODO: end of game animation");
        setTimeout(initializeGameState, 10000);
        return;
    }
    let firstSelection = p1.health <= p2.health ? p1 : p2;
    let minionSelectionScene = makeMinionSelectionScene(firstSelection);
    gameState.setScene(minionSelectionScene);
};
const makeMinionSelectionScene = function(firstChoice, secondChoice) {
    gameState.minionSelectionNext = secondChoice;

    // minion selection scene
    scene = new Scene("gainsboro");

    let centerX = scene.size.width / 2;

    // player minion container
    let p1 = gameState.player1;
    let p1Inventory = new PlayerReserve(p1, 7);
        p1Inventory.size = {width:470,height:50};
        p1Inventory.location = {x:centerX - 510/2, y:420};
        for(let i = 0; i < p1.minions.length; i++) {
            let minion = p1.minions[i];
            minion.gameParent = minion.parent;
            p1Inventory.slots[i].setMinion(minion);
        }
    scene.addComponent(p1Inventory);

    let p2 = gameState.player2;
    let p2Inventory = new PlayerReserve(p2, 7);
        p2Inventory.size = {width:470,height:50};
        p2Inventory.location = {x:centerX - 510/2, y:120};
        for(let i = 0; i < p2.minions.length; i++) {
            let minion = p2.minions[i];
            minion.gameParent = minion.parent;
            p2Inventory.slots[i].setMinion(minion);
        }
    scene.addComponent(p2Inventory);

    // pass button
    let passButton = new Button("SKIP", 100, 50, "20px Arial", "white", "coral");
        passButton.location = {x:900,y:420};
        passButton.addHandler("interact", endMinionSelection);
    scene.addComponent(passButton);

    // options placeholders
    let pSelection = firstChoice;
    let pSelectionInventory = new PlayerReserve(pSelection, 2);
        pSelectionInventory.size = {width:120,height:50};
        pSelectionInventory.location = {x:centerX - 140/2, y:(scene.size.height -50) / 2};
        let minionOptions = getMinionOptions(2);
        for(let i = 0; i < minionOptions.length; i++) {
            let minion = minionOptions[i];
            minion.gameParent = null;
            pSelectionInventory.slots[i].setMinion(minion);
        }
    scene.addComponent(pSelectionInventory);

    // instructions as well

    return scene;
}
const getMinionOptions = function(count) {
    let rarityWeights = {"Common": 10, "Rare": 4, "Epic": 1};
    let invalid = new Set();
    gameState.player1.minions.forEach(m => invalid.add(m));
    gameState.player2.minions.forEach(m => invalid.add(m));
    let results = [];
    for(let x = 0; x < count; x++) {
        let total = 0;
        for(let i = 0; i < gameState.minions.length; i++) {
            let minion = gameState.minions[i];
            if (invalid.has(minion)) continue;
            total += rarityWeights[minion.rarity];
        }
        let value = Math.random() * total;
        total = 0;
        let selectionIndex = 0;
        for(; selectionIndex < gameState.minions.length; selectionIndex++) {
            let minion = gameState.minions[selectionIndex];
            if (invalid.has(minion)) continue;
            total += rarityWeights[minion.rarity];
            if (value < total) break;
        }
        selectionIndex = Math.min(selectionIndex, gameState.minions.length-1);
        let selection = gameState.minions[selectionIndex];
        results.push(selection);
        invalid.add(selection);
    }
    return results;
};
const endMinionSelection = function() {
    function returnMinionsToGame(player) {
        for(let i = 0; i < player.minions.length; i++) {
            let minion = player.minions[i];
            if (minion.gameParent) {
                minion.gameParent.addComponent(minion);
            }
        }
    }
    returnMinionsToGame(gameState.player1);
    returnMinionsToGame(gameState.player2);
    gameState.setScene(gameState.gameScene);
    return true;
};
const startNewEpisode = function() {
    let minionSelectionScene = makeMinionSelectionScene(gameState.player1);
    gameState.setScene(minionSelectionScene);
};
const mainGameLoop = function() {
    // update
    updateStats(gameState.stats);
    gameState.dragState.handled = false;
    gameState.scene.update();
    // render
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
    gameState.scene.render({ x: 0, y: 0 });
    canvasCtx.drawImage(uiCanvas, 0, 0, uiCanvas.width, uiCanvas.height);
    // loop
    requestAnimationFrame(mainGameLoop);
};
const updateStats = function(stats) {
    const now = gameState.now = performance.now();
    const first = stats.times.shift();
    stats.times.push(now);
    stats.frameRate = 1000.0 * stats.times.length / (now - first);
}
runGame();