let players = [];
let current = 0;
let dartsLeft = 3;
let multiplier = 1;
let historyStack = [];
let round = 1;
let startScore = 0;

// --- Local Storage Funktionen ---
function saveState() {
    const state = {
        players,
        current,
        dartsLeft,
        multiplier,
        historyStack
    };
   localStorage.setItem('dartGameState', JSON.stringify(state));
}

function startTournament() {
    setup.style.display = "none";
    header.style.display = "none";
    tournament.style.display = "block";
}

function changeName(index, newName) {
    if (!newName.trim()) return;
    players[index].name = newName.trim();
    saveState();
}

function loadState() {
    const state = localStorage.getItem('dartGameState');
    if (state) {
        const data = JSON.parse(state);
        players = data.players || [];
        current = data.current || 0;
        dartsLeft = data.dartsLeft || 3;
        multiplier = data.multiplier || 1;
        historyStack = data.historyStack || [];

        setup.style.display = "none";
        game.style.display = "block";

        renderPlayers();
        renderBoard();
        updateRound();
    }
}

function restartGame() {
    localStorage.removeItem('dartGameState');
    historyStack = [];
    players = [];
    current = 0;
    dartsLeft = 3;
    multiplier = 1;

    document.getElementById("history").innerHTML = "";

    const startScore = JSON.parse(localStorage.getItem('startScore'));
    startGame(startScore);
}

// --- Spielstart ---
function startGame(score) {
    localStorage.setItem("startScore", JSON.stringify(score));
    const count = parseInt(playerCount.value);
    if (count < 1 || score < 1) return;

    players = Array.from({ length: count }, (_, i) => ({
        name: "",
        score: score,
        totalPoints: 0,
        rounds: 0,
        avg: 0,
        turnPoints: 0
    }));

    setup.style.display = "none";
    game.style.display = "block";

    historyStack = [];
    current = 0;
    dartsLeft = 3;
    multiplier = 1;

    renderPlayers();
    renderBoard();
    updateRound();
    saveState();
}

function renderPlayers() {
    const playersDiv = document.getElementById("players");
    playersDiv.innerHTML = "";

    players.forEach((p, i) => {
        playersDiv.innerHTML += `
            <div class="player ${i === current ? "active" : ""}">
                <input 
                    placeholder="Click here to enter a name"
                    class="player-name"
                    value="${p.name}"
                    onchange="changeName(${i}, this.value)"
                >
                <span>avg: ${p.avg}</span>
                <span class="score">${p.score}</span>
            </div>`;
    });
}

function calculatePoints(hit, multiplier) {
    if (hit === "MISS") return 0;
    if (hit === "BULL") return 25;
    if (hit === "BULLSEYE") return 50;

    // Normal numbers (1–20)
    return hit * multiplier;
}


function renderBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
        board.innerHTML += `<button onclick="throwDart(${i})">${i}</button>`;
    }
    board.innerHTML += `
        <button onclick="throwDart('BULL')">Bull</button>
        <button onclick="throwDart('BULLSEYE')">Bullseye</button>
        <button onclick="throwDart('MISS')">Miss</button>`;
}

function setMulti(m) {
    multiplier = m;
    saveState();
}

function throwDart(hit) {
    // Vorherigen Zustand speichern
    historyStack.push({
        players: JSON.parse(JSON.stringify(players)),
        current,
        dartsLeft,
        multiplier,
        historyHTML: document.getElementById("history").innerHTML
    });

    let player = players[current];
    const points = calculatePoints(hit, multiplier);

    dartsLeft--;
    player.turnPoints += points;
    
    const isDoubleFinish = (multiplier === 2 && typeof hit === "number") || hit === "BULLSEYE";
    const newScore = player.score - points;
    
    
    if (newScore < 0 || newScore === 1 || (newScore === 0 && !isDoubleFinish)) {
        log(`❌ ${player.name} Bust`);

        player.turnPoints = 0;
        player.rounds++;
        player.avg = (player.totalPoints / player.rounds).toFixed(2);

        endTurn();
        renderPlayers();
        saveState();
        return;
    }

    player.score = newScore;
    log(`🎯 ${player.name}: ${points}`);

    if (newScore === 0) {
        alert(`🏆 ${player.name} gewinnt!`);
        //localStorage.removeItem('dartGameState');
        //location.reload();
        //startGame();
    }

    if (dartsLeft === 0) { 
        player.totalPoints += player.turnPoints;
        player.rounds++;
        player.avg = (player.totalPoints / player.rounds).toFixed(2);

        player.turnPoints = 0; // reset für nächste Runde
        endTurn();
    }

    renderPlayers();
    saveState();
    setMulti(1);
}

function endTurn() {
    dartsLeft = 3;
    current = (current + 1) % players.length;
    updateRound();
    saveState();
}

function updateRound() {
    document.getElementById("turnInfo").textContent = `Round: ${players[current].rounds + 1}`;
}

function log(text) {
    const h = document.getElementById("history");
    h.innerHTML = `<div>${text}</div>` + h.innerHTML;
    saveState();
}

function undo() {
    if (historyStack.length === 0) return;

    const last = historyStack.pop();

    players = last.players;
    current = last.current;
    dartsLeft = last.dartsLeft;
    multiplier = last.multiplier;

    document.getElementById("history").innerHTML = last.historyHTML;

    renderPlayers();
    updateRound();
    saveState();
}


// --- Neues Spiel Funktion ---
function newGame() {
    localStorage.removeItem('dartGameState');
    historyStack = [];
    players = [];
    current = 0;
    dartsLeft = 3;
    multiplier = 1;

    setup.style.display = "flex";
    game.style.display = "none";
    document.getElementById("players").innerHTML = "";
    document.getElementById("board").innerHTML = "";
    document.getElementById("history").innerHTML = "";
    document.getElementById("turnInfo").textContent = "";
}

// --- Beim Laden prüfen ---
window.onload = loadState;