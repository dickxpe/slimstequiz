let canvas = document.querySelector("canvas");
// Ensure CSS is loaded from correct relative path
if (!document.getElementById('quiz-css-link')) {
    const link = document.createElement('link');
    link.id = 'quiz-css-link';
    link.rel = 'stylesheet';
    link.href = '../styles/index.css';
    document.head.appendChild(link);
}
// --- Show 3 input field values at top ---

const FINALE_WINNER_KEY = 'finaleWinnerTeamId';
const BASE_CONFETTI_COLORS = ['#0a1c5c', '#ff6a00', '#8b0000', '#fdd835', '#441173'];
let finaleCelebrationActive = false;
let currentWinnerName = '';

function ensureCelebrationStyles() {
    if (document.getElementById('finale-celebration-style')) {
        return;
    }
    const style = document.createElement('style');
    style.id = 'finale-celebration-style';
    style.textContent = `
        #finaleWinnerOverlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background: rgba(3, 6, 24, 0.86);
            color: #fff;
            z-index: 4600;
            opacity: 0;
            pointer-events: none;
            transition: opacity 220ms ease;
        }
        #finaleWinnerOverlay.visible {
            opacity: 1;
            pointer-events: auto;
        }
        #finaleWinnerOverlay .winner-card {
            text-align: center;
            padding: 32px 48px;
            border-radius: 24px;
            background: linear-gradient(135deg, darkblue 0%, #ff6a00 45%, darkred 75%, darkblue 100%);
            box-shadow: 0 20px 60px rgba(0,0,0,0.45);
            border: 3px solid rgba(255,255,255,0.25);
            min-width: 480px;
        }
        #finaleWinnerOverlay .winner-label {
            font-family: 'DIN Black Regular', Arial, sans-serif;
            font-size: 1.4em;
            letter-spacing: 0.2em;
            color: darkblue;
            display: inline-block;
            margin-bottom: 24px;
        }
        #finaleWinnerOverlay .winner-name {
            font-family: 'Hello', cursive;
            font-size: 4.5em;
            color: #fff;
            text-shadow:
                0 0 4px #001a66,
                0 1px 4px #001a66,
                0 -1px 4px #001a66,
                1px 0 4px #001a66,
                -1px 0 4px #001a66,
                0 1px 0 #fff,
                0 4px 16px rgba(0,0,0,0.45);
            display: block;
        }
        #confettiWrapper {
            position: fixed;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            z-index: 4700;
        }
        .confetti-piece {
            position: absolute;
            will-change: transform, margin-left;
            width: 12px;
            height: 26px;
            border-radius: 4px;
            opacity: 0.85;
            --swayDistance: 30px;
            --twirlMid: 720deg;
            --twirlEnd: 1440deg;
            animation-name: confetti-fall, confetti-sway;
            animation-timing-function: linear, ease-in-out;
            animation-iteration-count: infinite, infinite;
            animation-direction: normal, alternate;
        }
        @keyframes confetti-fall {
            0% {
                transform: translate3d(0, -120vh, 0) rotate(0deg);
            }
            50% {
                transform: translate3d(0, 10vh, 0) rotate(var(--twirlMid, 720deg));
            }
            100% {
                transform: translate3d(0, 120vh, 0) rotate(var(--twirlEnd, 1440deg));
            }
        }
        @keyframes confetti-sway {
            0% {
                margin-left: calc(var(--swayDistance, 30px) * -1);
            }
            100% {
                margin-left: var(--swayDistance, 30px);
            }
        }
        canvas.finale-celebration-active {
            opacity: 0;
            transition: opacity 200ms ease;
        }
    `;
    document.head.appendChild(style);
}

function varyColor(hex) {
    const sanitized = hex.replace('#', '');
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    const jitter = () => Math.floor((Math.random() - 0.5) * 60);
    const clamp = (value) => Math.max(0, Math.min(255, value));
    const variedR = clamp(r + jitter());
    const variedG = clamp(g + jitter());
    const variedB = clamp(b + jitter());
    return `rgb(${variedR}, ${variedG}, ${variedB})`;
}

function createConfettiPieces(container, count) {
    const colors = BASE_CONFETTI_COLORS;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.backgroundColor = varyColor(colors[i % colors.length]);
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.top = `${-10 - Math.random() * 30}vh`;
        const fallDuration = 4 + Math.random() * 3;
        const swayDuration = 1.2 + Math.random() * 1.8;
        piece.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
        piece.style.animationDelay = `${-Math.random() * 3}s, ${-Math.random() * swayDuration}s`;
        const swayDistance = `${15 + Math.random() * 55}px`;
        piece.style.setProperty('--swayDistance', swayDistance);
        const twirlEndDeg = 900 + Math.random() * 900;
        piece.style.setProperty('--twirlEnd', `${twirlEndDeg}deg`);
        piece.style.setProperty('--twirlMid', `${twirlEndDeg / 2}deg`);
        piece.style.opacity = `${0.5 + Math.random() * 0.5}`;
        piece.style.width = `${8 + Math.random() * 8}px`;
        piece.style.height = `${16 + Math.random() * 16}px`;
        container.appendChild(piece);
    }
}

function showWinnerOverlay(name) {
    ensureCelebrationStyles();
    let overlay = document.getElementById('finaleWinnerOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'finaleWinnerOverlay';
        overlay.innerHTML = `
            <div class="winner-card">
                <span class="winner-label">WINNAAR</span>
                <span class="winner-name"></span>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    const nameNode = overlay.querySelector('.winner-name');
    if (nameNode) {
        nameNode.textContent = name;
    }
    overlay.classList.add('visible');
}

function hideWinnerOverlay() {
    const overlay = document.getElementById('finaleWinnerOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function mountConfetti() {
    ensureCelebrationStyles();
    let wrapper = document.getElementById('confettiWrapper');
    if (wrapper) {
        wrapper.remove();
    }
    wrapper = document.createElement('div');
    wrapper.id = 'confettiWrapper';
    document.body.appendChild(wrapper);
    createConfettiPieces(wrapper, 90);
}

function removeConfetti() {
    const wrapper = document.getElementById('confettiWrapper');
    if (wrapper) {
        wrapper.remove();
    }
}

function activateFinaleCelebration(name) {
    finaleCelebrationActive = true;
    currentWinnerName = name;
    showWinnerOverlay(name);
    mountConfetti();
    if (canvas) {
        canvas.classList.add('finale-celebration-active');
    }
}

function deactivateFinaleCelebration() {
    finaleCelebrationActive = false;
    currentWinnerName = '';
    hideWinnerOverlay();
    removeConfetti();
    if (canvas) {
        canvas.classList.remove('finale-celebration-active');
    }
}

function checkFinaleVictoryState() {
    const winnerIdRaw = localStorage.getItem(FINALE_WINNER_KEY);
    const winnerId = winnerIdRaw !== null ? parseInt(winnerIdRaw, 10) : -1;
    if (!isNaN(winnerId) && winnerId !== -1) {
        const winnerName = localStorage.getItem(`nameTeam${winnerId}`) || `Team ${winnerId}`;
        if (!finaleCelebrationActive || winnerName !== currentWinnerName) {
            activateFinaleCelebration(winnerName);
        }
        return true;
    }
    if (finaleCelebrationActive) {
        deactivateFinaleCelebration();
    }
    return false;
}

checkFinaleVictoryState();
window.addEventListener('storage', checkFinaleVictoryState);
function injectHeaderText() {
    // Inject font-face for DIN Black and Hello
    const style = document.createElement('style');
    style.innerHTML = `
        @font-face {
            font-family: 'DIN Black Regular';
            src: url('../styles/DIN Black Regular.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: 'Hello';
            src: url('../styles/Hello.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }
        .quiz-header-row {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 18px;
            padding: 18px 0 12px 0;
            background: none;
            z-index: 5000;
            box-shadow: none;
        }
        .quiz-header-1, .quiz-header-3 {
            vertical-align: middle;
            line-height: 1.1;
            display: flex;
            align-items: center;
        }
        .quiz-header-2 {
            display: flex;
            align-items: center;
        }
        .quiz-header-1, .quiz-header-2, .quiz-header-3 {
            text-shadow:
                0 0 4px #001a66,
                0 1px 4px #001a66,
                0 -1px 4px #001a66,
                1px 0 4px #001a66,
                -1px 0 4px #001a66,
                0 1px 0 #fff;
        }
        .quiz-header-1, .quiz-header-3 {
            font-family: 'DIN Black Regular', Arial, sans-serif;
            font-size: 2em;
            color: #fff;
            letter-spacing: 2px;
        }
        .quiz-header-2 {
            font-family: 'Hello', cursive;
            font-size: 5em;
            color: #fff;
            letter-spacing: 2px;
        }
    `;
    document.head.appendChild(style);

    // Get values from localStorage
    const v1 = localStorage.getItem('inputField1') || '';
    const v2 = localStorage.getItem('inputField2') || '';
    const v3 = localStorage.getItem('inputField3') || '';

    // Create header row
    const headerDiv = document.createElement('div');
    headerDiv.className = 'quiz-header-row';
    headerDiv.innerHTML = `
        <span class="quiz-header-1">${v1}</span>
        <span class="quiz-header-2">${v2}</span>
        <span class="quiz-header-3">${v3}</span>
    `;

    // Create round label div
    const roundLabel = document.createElement('div');
    roundLabel.id = 'quizRoundLabel';
    roundLabel.style.position = 'absolute';
    roundLabel.style.left = '50%';
    roundLabel.style.transform = 'translateX(-50%)';
    roundLabel.style.top = '140px'; /* moved lower below header */
    roundLabel.style.zIndex = '1001';
    roundLabel.style.textAlign = 'center';
    roundLabel.style.fontFamily = "'DIN Black Regular', Arial, sans-serif";
    roundLabel.style.fontSize = '2.2em';
    roundLabel.style.fontWeight = 'bold';
    roundLabel.style.color = '#2222aa';
    roundLabel.style.background = '#f9e8b122';
    roundLabel.style.borderRadius = '12px';
    roundLabel.style.padding = '8px 64px';
    roundLabel.style.minWidth = '460px';
    roundLabel.style.width = 'auto';
    roundLabel.style.boxShadow = '0 2px 12px #0002';
    roundLabel.style.opacity = '0';
    roundLabel.style.pointerEvents = 'none';

    // Place header and round label above the canvas
    const canvas = document.getElementById('canvas');
    if (canvas) {
        document.body.insertBefore(headerDiv, canvas);
        document.body.insertBefore(roundLabel, canvas);
    } else {
        document.body.insertBefore(headerDiv, document.body.firstChild);
        document.body.insertBefore(roundLabel, document.body.firstChild.nextSibling);
    }

    // Set round label text from localStorage
    const roundNames = ["3-6-9", "OPEN DEUR", "PUZZEL", "GALLERIJ", "COLLEC. GEH.", "FINALE"];
    function updateRoundLabel() {
        let roundIndex = parseInt(localStorage.getItem('roundIndex'));
        if (!isNaN(roundIndex) && roundIndex >= 0 && roundIndex < roundNames.length) {
            let displayText = roundNames[roundIndex];
            if (displayText === 'COLLEC. GEH.') {
                displayText = 'COLLECTIEF GEHEUGEN';
            }
            roundLabel.textContent = displayText;
        }
    }
    updateRoundLabel();
    window.addEventListener('storage', updateRoundLabel);
}

injectHeaderText();
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let context = canvas.getContext('2d');

let width = context.canvas.width;
let height = context.canvas.height;
let quarterWidth = width / 5;
let quarterHeight = height / 4;

let frameCount = 0;
let timePassed = 60;
let lastSecond = 0;
let prevTime = 0;



// Dynamically build teams and scores arrays based on localStorage
let teams = [];
let scores = [];
let maxTeams = 9;
let flashTimers = [];
for (let i = 1; i <= maxTeams; i++) {
    let name = localStorage.getItem("nameTeam" + i);
    if (name) {
        teams.push(name);
        // Store score as integer seconds
        let raw = localStorage.getItem("team" + i + "Score");
        let score = parseInt(raw);
        // No ms conversion needed, always use seconds
        if (isNaN(score) || score < 0) score = 60;
        scores.push(score);
        flashTimers.push(0);
    }
}

let currentTeam = -1;

localStorage.setItem("currentTeam", -1);

window.onstorage = storage;

window.onresize = reload;

function reload() {
    location.reload();
}

/**
 * 
 * @param {StorageEvent} e 
 */
function storage(e) {
    if (e.key && e.key.startsWith("visibleTeam")) {
        // Reload to update visible teams immediately
        location.reload();
    } else if (e.key && e.key.startsWith("team") && e.key.endsWith("Score")) {
        // Update the score in memory for the correct team
        let teamNum = parseInt(e.key.replace("team", "").replace("Score", ""));
        if (!isNaN(teamNum) && teamNum >= 1 && teamNum <= scores.length) {
            scores[teamNum - 1] = parseInt(localStorage.getItem(e.key)) || 0;
            // Trigger flash for this team
            flashTimers[teamNum - 1] = 10; // flash for 10 frames (~0.16s at 60fps)
        }
    } else if (e.key == "currentTeam") {
        let team = parseInt(localStorage.getItem("currentTeam"));

        if (team == -1) {
            localStorage.setItem("team" + (currentTeam + 1) + "Score", scores[currentTeam]);
        } else {
            timePassed = parseInt(localStorage.getItem("team" + (team + 1) + "Score")) || 60;
        }
        currentTeam = team;

    } else if (e.key == "nameTeam1") {
        teams[0] = localStorage.getItem("nameTeam1");
    } else if (e.key == "team1Score") {
        scores[0] = localStorage.getItem("team1Score");
        if (currentTeam === 0) timePassed = scores[0];
    } else if (e.key == "nameTeam2") {
        teams[1] = localStorage.getItem("nameTeam2");
    } else if (e.key == "team2Score") {
        scores[1] = localStorage.getItem("team2Score");
        if (currentTeam === 1) timePassed = scores[1];
    } else if (e.key == "nameTeam3") {
        teams[2] = localStorage.getItem("nameTeam3");
    } else if (e.key == "team3Score") {
        scores[2] = localStorage.getItem("team3Score");
        if (currentTeam === 2) timePassed = scores[2];
    } else if (e.key == "nameTeam4") {
        teams[3] = localStorage.getItem("nameTeam4");
    } else if (e.key == "team4Score") {
        scores[3] = localStorage.getItem("team4Score");
        if (currentTeam === 3) timePassed = scores[3];
    }

}



update(0);

function update(time) {

    let deltaTime = time - prevTime;

    const my_gradient = context.createLinearGradient(0, 0, 0, height);
    my_gradient.addColorStop(0, "orange");
    my_gradient.addColorStop(1, "darkred");

    context.fillStyle = my_gradient;
    context.fillRect(0, 0, width, height);

    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.font = "bold 2.4em 'DIN Black Regular', Arial, sans-serif"; // Adjusted font size
    // Determine visible teams and their indices (only those with a name)
    let visibleTeams = [];
    for (let i = 0; i < teams.length; i++) {
        if (localStorage.getItem("visibleTeam" + (i + 1)) !== "0") {
            visibleTeams.push(i);
        }
    }
    let n = visibleTeams.length;

    // Split teams into up to 3 rows, with the most teams in the middle row
    let rows = [];
    if (n > 0) {
        let rowConfig;
        if (n <= 3) {
            // All in one row
            rowConfig = [n];
        } else if (n <= 6) {
            // Two rows, more in the bottom
            let top = Math.floor(n / 2);
            let bottom = n - top;
            rowConfig = [top, bottom];
        } else {
            // Three rows, most in the middle
            let mid = Math.ceil(n / 3);
            let rem = n - mid;
            let top = Math.floor(rem / 2);
            let bottom = rem - top;
            rowConfig = [top, mid, bottom];
        }
        let start = 0;
        for (let i = 0; i < rowConfig.length; i++) {
            let size = rowConfig[i];
            if (size > 0) {
                rows.push(visibleTeams.slice(start, start + size));
                start += size;
            }
        }
    }

    // Calculate vertical positions for rows, with equal space above, below, and between
    let totalRows = rows.length;
    let rowYs = [];
    const teamYOffset = 80; // Move teams lower by 120px
    if (totalRows > 0) {
        // Divide the height into (totalRows + 1) equal segments
        let segment = height / (totalRows + 1);
        for (let r = 0; r < totalRows; r++) {
            rowYs.push(segment * (r + 1) + teamYOffset);
        }
    }

    // Draw team names and ellipses row by row
    for (let r = 0; r < rows.length; r++) {
        let row = rows[r];
        let y = rowYs[r];
        let positions = [];
        for (let i = 0; i < row.length; i++) {
            positions.push(width * (i + 1) / (row.length + 1));
        }
        // Draw team names with quiz-header-1 style
        context.save();
        context.font = "bold 2.4em 'DIN Black Regular', Arial, sans-serif"; // Adjusted font size
        context.fillStyle = "#fff";
        context.shadowColor = "#001a66";
        context.shadowBlur = 12;
        for (let i = 0; i < row.length; i++) {
            let idx = row[i];
            context.fillText(teams[idx], positions[i], y - 40);
        }
        context.shadowBlur = 0;
        context.restore();
        // Draw ellipses and scores
        for (let i = 0; i < row.length; i++) {
            let idx = row[i];
            let flash = flashTimers[idx] > 0;
            drawEllipse(positions[i], y + 50, currentTeam == idx, flash);
            context.fillStyle = "white";
            context.font = "bold 2.4em 'DIN Black Regular', Arial, sans-serif"; // Adjusted font size
            context.fillText(scores[idx], positions[i], y + 40); // Adjusted font size
            if (flashTimers[idx] > 0) flashTimers[idx]--;
        }
    }
    context.fillStyle = "white";

    // Always check the latest currentTeam value from localStorage
    let latestCurrentTeam = parseInt(localStorage.getItem("currentTeam"));
    if (isNaN(latestCurrentTeam)) latestCurrentTeam = -1;
    currentTeam = latestCurrentTeam;
    if (currentTeam != -1 && scores[currentTeam] > 0) {
        if (!lastSecond) lastSecond = time;
        if (time - lastSecond >= 1000) {
            scores[currentTeam]--;
            if (scores[currentTeam] < 0) scores[currentTeam] = 0;
            localStorage.setItem("team" + (currentTeam + 1) + "Score", scores[currentTeam]);
            lastSecond += 1000;
        }
    } else {
        lastSecond = time;
    }
    // (Removed erroneous second loop using positions outside its scope)

    prevTime = time;
    frameCount++;
    requestAnimationFrame(update);
}

function drawEllipse(x, y, active, flash) {
    // Outer oval (always darkblue)
    context.fillStyle = "darkblue";
    context.beginPath();
    context.ellipse(x, y - 25, 75, 40, 0, 0, Math.PI * 2);
    context.fill();
    // Middle oval (always blue)
    context.fillStyle = "blue";
    context.beginPath();
    if (!active) {
        context.ellipse(x, y - 30, 75, 30, 0, 0, Math.PI * 2);
    } else {
        context.ellipse(x, y - 25, 75, 30, 0, 0, Math.PI * 2);
    }
    context.fill();
    // Innermost oval (flash yellow if needed, else white or darkred)
    if (!active) {
        context.fillStyle = flash ? "#e88400" : "darkred";
        context.beginPath();
        context.ellipse(x, y - 25, 75, 30, 0, 0, Math.PI * 2);
        context.ellipse(x, y - 25, 75, 30, 0, 0, Math.PI * 2);
        context.fill();
    } else {
        context.fillStyle = flash ? "#e88400" : "blue";
        context.beginPath();
        context.ellipse(x, y - 25, 75, 30, 0, 0, Math.PI * 2);
        context.ellipse(x, y - 25, 75, 30, 0, 0, Math.PI * 2);
        context.fill();
    }
}
