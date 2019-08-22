
const canvas = document.getElementById("game");
const canvasCtx = canvas.getContext("2d");
const gameState = {};

const mainGameLoop = function() {
    // update
    update(gameState);
    // draw
    draw(gameState.scene);
    // loop
    requestAnimationFrame(mainGameLoop);
};
const update = function(state) {
    updateStats(state.stats);
};
const updateStats = function(stats) {
    stats.frameCounter += 1;

    const now = performance.now();
    const first = stats.times.shift();
    stats.frameRate = 1000.0 * (stats.times.length + 1) / (now - first);
    stats.times.push(now);
}
const draw = function(scene) {
    // clear
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    // draw main
    // draw stats
    drawStats(scene.stats);
};
const drawStats = function(stats) {
    if (stats.frameCounter < 1) return;
    canvasCtx.font = "20px monospace";
    canvasCtx.fillText("frame: " + stats.frameCounter, 120, 120);
    canvasCtx.fillText(" rate: " + stats.frameRate.toPrecision(4), 120, 150);
};
const resizeCanvas = function() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

const runGame = function() {
    resizeCanvas();
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
    gameState.scene = { stats: gameState.stats };
};
runGame();