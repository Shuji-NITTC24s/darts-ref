const segmentOrder = [
    20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
    3, 19, 7, 16, 8, 11, 14, 9, 12, 5
];
const segmentAngle = 360 / 20;
const rotationOffset = segmentAngle / 2; // 9 degrees


const outerRadius = 180;
const doubleInner = 160;
const tripleOuter = 110;
const tripleInner = 95;
const bullOuter = 20;
const bullInner = 10;

let players = [
    { score: 501, visits: [], correct: 0, turns: 0, skill: 0.85 },
    { score: 501, visits: [], correct: 0, turns: 0, skill: 0.65 }
];

let currentPlayer = 0;
let delayTime = 2000;

function startGame() {
    players.forEach(p => {
        p.score = 501;
        p.visits = [];
        p.correct = 0;
        p.turns = 0;
    });

    currentPlayer = 0;
    drawBoard();
    nextTurn();
}

function drawBoard() {
    const svg = document.getElementById("dartboard");
    svg.innerHTML = "";

    for (let i = 0; i < 20; i++) {

        const startDeg = (i * segmentAngle) - 90 - rotationOffset;
        const endDeg = ((i + 1) * segmentAngle) - 90 - rotationOffset;

        const startAngle = startDeg * Math.PI / 180;
        const endAngle = endDeg * Math.PI / 180;

        const x1 = outerRadius * Math.cos(startAngle);
        const y1 = outerRadius * Math.sin(startAngle);
        const x2 = outerRadius * Math.cos(endAngle);
        const y2 = outerRadius * Math.sin(endAngle);

        const baseColor = i % 2 === 0 ? "#f5e6c8" : "#111";

        // Main wedge
        svg.innerHTML += `
            <path d="
                M 0 0
                L ${x1} ${y1}
                A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
                Z"
                fill="${baseColor}" stroke="#222" stroke-width="1"/>
        `;

        // Triple ring segment
        drawRingSegment(tripleInner, tripleOuter, startAngle, endAngle, i % 2 === 0 ? "red" : "green");

        // Double ring segment
        drawRingSegment(doubleInner, outerRadius, startAngle, endAngle, i % 2 === 0 ? "red" : "green");

        // Numbers
        const midAngle = ((startAngle + endAngle) / 2);
        const numX = 210 * Math.cos(midAngle);
        const numY = 210 * Math.sin(midAngle);

        svg.innerHTML += `
            <text x="${numX}" y="${numY}"
                  fill="white"
                  font-size="16"
                  text-anchor="middle"
                  dominant-baseline="middle">
                ${segmentOrder[i]}
            </text>
        `;
    }

    // Bulls
    svg.innerHTML += `<circle cx="0" cy="0" r="${bullOuter}" fill="green"/>`;
    svg.innerHTML += `<circle cx="0" cy="0" r="${bullInner}" fill="red"/>`;

    // Wire circles
    svg.innerHTML += `<circle cx="0" cy="0" r="${outerRadius}" fill="none" stroke="#999" stroke-width="2"/>`;
    svg.innerHTML += `<circle cx="0" cy="0" r="${doubleInner}" fill="none" stroke="#999" stroke-width="2"/>`;
    svg.innerHTML += `<circle cx="0" cy="0" r="${tripleOuter}" fill="none" stroke="#999" stroke-width="2"/>`;
    svg.innerHTML += `<circle cx="0" cy="0" r="${tripleInner}" fill="none" stroke="#999" stroke-width="2"/>`;
    svg.innerHTML += `<circle cx="0" cy="0" r="${bullOuter}" fill="none" stroke="#999" stroke-width="2"/>`;
}


function drawRingSegment(innerR, outerR, startA, endA, color) {
    const svg = document.getElementById("dartboard");

    const x1 = innerR * Math.cos(startA);
    const y1 = innerR * Math.sin(startA);
    const x2 = outerR * Math.cos(startA);
    const y2 = outerR * Math.sin(startA);
    const x3 = outerR * Math.cos(endA);
    const y3 = outerR * Math.sin(endA);
    const x4 = innerR * Math.cos(endA);
    const y4 = innerR * Math.sin(endA);

    svg.innerHTML += `
        <path d="
        M ${x1} ${y1}
        L ${x2} ${y2}
        A ${outerR} ${outerR} 0 0 1 ${x3} ${y3}
        L ${x4} ${y4}
        A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}
        Z"
        fill="${color}" stroke="#222" stroke-width="1"/>
    `;
}

function generateDart(player) {
    const targetAngle = (-90) * Math.PI / 180; // aim 20
    const spread = (1 - player.skill) * 0.8;

    const angle = targetAngle + (Math.random() - 0.5) * spread;
    const radius = Math.abs(
        tripleOuter + (Math.random() - 0.5) * 60
    );

    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    const score = calculateScore(radius, angle);

    return { x, y, score, radius };
}

function calculateScore(r, angle) {
    if (r > outerRadius) return 0;

    if (r <= bullInner) return 50;
    if (r <= bullOuter) return 25;

    let degrees = (angle * 180 / Math.PI + 360 + 90 + rotationOffset) % 360;
    let segmentIndex = Math.floor(degrees / 18);
    let baseScore = segmentOrder[segmentIndex];

    if (r >= doubleInner) return baseScore * 2;
    if (r >= tripleInner && r <= tripleOuter) return baseScore * 3;

    return baseScore;
}


function nextTurn() {
    drawBoard();
    const player = players[currentPlayer];

    const darts = [
        generateDart(player),
        generateDart(player),
        generateDart(player)
    ];

    let visitTotal = 0;

    darts.forEach(d => {
        const svg = document.getElementById("dartboard");
        svg.innerHTML += `
    <circle cx="${d.x}" cy="${d.y}" r="5"
        fill="#00FFFF"
        stroke="black"
        stroke-width="1.5"/>
`;

        visitTotal += d.score;
    });

    let newScore = player.score - visitTotal;
    let bust = false;
    let win = false;

    const lastDart = darts[2];

    if (newScore < 0 || newScore === 1) {
        bust = true;
        newScore = player.score;
    } else if (newScore === 0) {
        if (lastDart.score % 2 === 0 || lastDart.score === 50) {
            win = true;
        } else {
            bust = true;
            newScore = player.score;
        }
    }

    document.getElementById("inputArea").innerHTML = `
        <p>Player ${currentPlayer + 1} scored: ${visitTotal}</p>
        <input id="answer" type="number" placeholder="New Score">
        <button onclick="submitAnswer(${newScore}, ${bust}, ${win}, ${visitTotal})">Submit</button>
    `;
}

function submitAnswer(correctScore, bust, win, visitTotal) {
    const userAnswer = parseInt(document.getElementById("answer").value);
    const player = players[currentPlayer];

    player.turns++;

    if (userAnswer === correctScore) player.correct++;

    if (!bust) player.score = correctScore;

    player.visits.push(visitTotal);

    updateBoard();

    if (win) {
        alert("Player " + (currentPlayer + 1) + " Wins!");
        startGame();
        return;
    }

    currentPlayer = currentPlayer === 0 ? 1 : 0;
    setTimeout(nextTurn, delayTime);
}

function updateBoard() {
    players.forEach((p, i) => {
        document.getElementById("score" + (i + 1)).innerText = p.score;
        document.getElementById("visits" + (i + 1)).innerHTML =
            p.visits.map(v => `<div>${v}</div>`).join("");

        const acc = p.turns === 0 ? 100 :
            Math.round((p.correct / p.turns) * 100);

        document.getElementById("acc" + (i + 1)).innerText = acc;
    });
}
