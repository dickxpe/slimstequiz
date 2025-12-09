// Inject gradient background style for admin page
if (!document.getElementById('admin-gradient-bg-style')) {
    const style = document.createElement('style');
    style.id = 'admin-gradient-bg-style';
    style.innerHTML = `
            body {
                background: linear-gradient(180deg, orange 0%, darkred 100%) !important;
            }
        `;
    document.head.appendChild(style);
}
// Inject button hover styles for color highlights
if (!document.getElementById('admin-button-hover-style')) {
    const style = document.createElement('style');
    style.id = 'admin-button-hover-style';
    style.innerHTML = `
        .team-row-inner button:hover:not(:disabled) {
            filter: brightness(1.25);
            opacity: 1;
            z-index: 1;
            box-shadow: none;
        }
        #nextRound:hover:not(:disabled), #prevRound:hover:not(:disabled), #nextTurn:hover:not(:disabled) {
            filter: brightness(1.25);
            opacity: 1;
            z-index: 1;
            box-shadow: none;
        }
    `;
    document.head.appendChild(style);
}
document.getElementById("addTeamBtn").onclick = function () {
    let name = document.getElementById("addTeamName").value.trim();
    if (!name) return;
    // Find next available team slot (max 8)
    let maxTeams = 9;
    for (let i = 1; i <= maxTeams; i++) {
        const nameExists = localStorage.getItem("nameTeam" + i);
        const isVisible = localStorage.getItem("visibleTeam" + i) !== "0";
        if (!nameExists || !isVisible) {
            localStorage.setItem("nameTeam" + i, name);
            localStorage.setItem("team" + i + "Score", 60);
            localStorage.setItem("visibleTeam" + i, "1");
            renderTeams();
            break;
        }
    }
    document.getElementById("addTeamName").value = "";
};

const startQuizBtn = document.getElementById("startQuiz");
// Customize score input spin buttons to match UI styling
if (!document.getElementById('admin-score-spin-style')) {
    const style = document.createElement('style');
    style.id = 'admin-score-spin-style';
    style.innerHTML = `
        .score-input-wrapper {
            position: relative;
            display: inline-flex;
            align-items: stretch;
            width: 110px;
        }
        .score-input {
            padding-right: 48px !important;
            -moz-appearance: textfield;
        }
        .score-input::-webkit-inner-spin-button,
        .score-input::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .score-spin-buttons {
            position: absolute;
            top: 7px;
            right: 16px;
            bottom: 7px;
            width: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .score-spin-button {
            border: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(180deg, #ff9a00 0%, #c06400 100%);
            color: #220c00;
            font-weight: bold;
            font-size: 0.9em;
            cursor: pointer;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .score-spin-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

const MAX_TEAMS = 9;

function applyNextTurnState() {
    localStorage.setItem('collProgress', '0');
    let firstAvailableIndex = -1;
    for (let i = 1; i <= MAX_TEAMS; i++) {
        const name = localStorage.getItem("nameTeam" + i);
        const visible = localStorage.getItem("visibleTeam" + i) !== "0";
        localStorage.setItem(`team${i}Done`, '0');
        if (firstAvailableIndex === -1 && name && visible) {
            firstAvailableIndex = i - 1;
        }
    }
    localStorage.setItem('currentTeam', -1);
    localStorage.setItem('nextEnabledTeamIndex', firstAvailableIndex);
}

function executeNextTurnLogic() {
    applyNextTurnState();
    if (window.renderTeams) window.renderTeams();
}

window.executeNextTurnLogic = executeNextTurnLogic;

function renderTeams() {
    // Build teams array before any usage
    // teams array should only be declared once in this function
    // When round changes, enable only the first row (lowest score)
    let teams = []; // Initialize teams array
    const roundLabel = document.getElementById('roundLabel');
    const round = roundLabel ? roundLabel.textContent.trim() : '';
    // For COLLEC. GEH., always use nextEnabledTeamIndex from STOP logic, but ensure teams are sorted by score
    let enabledTeamIndex = -1;
    if (round === 'COLLEC. GEH.') {
        // Sort teams by score ascending for COLLEC. GEH.
        let sortedTeams = [...teams].sort((a, b) => a.score - b.score);
        let nextEnabledTeamIndex = parseInt(localStorage.getItem('nextEnabledTeamIndex'));
        if (nextEnabledTeamIndex !== -1 && sortedTeams[nextEnabledTeamIndex]) {
            // Find the actual index in the unsorted teams array
            let teamId = sortedTeams[nextEnabledTeamIndex].i;
            enabledTeamIndex = teams.findIndex(team => team.i === teamId);
        } else {
            enabledTeamIndex = -1;
        }
    } else {
        enabledTeamIndex = teams.findIndex(team => localStorage.getItem(`team${team.i}Done`) !== '1' && team.visible);
        if (round !== 'EDIT MODE' && enabledTeamIndex !== -1) {
            localStorage.setItem('nextEnabledTeamIndex', enabledTeamIndex);
        }
    }
    // Ensure only the first row is enabled at quiz start and after refresh in round 3-6-9
    const quizStarted = localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1';
    let currentTeam = parseInt(localStorage.getItem('currentTeam'));
    let nextEnabledTeamIndex = parseInt(localStorage.getItem('nextEnabledTeamIndex'));
    if (quizStarted && round === '3-6-9' && currentTeam === -1) {
        localStorage.setItem('nextEnabledTeamIndex', 0);
        nextEnabledTeamIndex = 0;
    }
    // Add ENTER key support for add team input
    var addTeamName = document.getElementById('addTeamName');
    var addTeamBtn = document.getElementById('addTeamBtn');
    if (addTeamName && addTeamBtn) {
        addTeamName.onkeydown = function (e) {
            if (e.key === 'Enter') {
                addTeamBtn.click();
            }
        };
    }
    // Calculate teamCount before any usage
    let maxTeams = 9;
    let visibleTeamCount = 0;
    for (let i = 1; i <= maxTeams; i++) {
        let name = localStorage.getItem("nameTeam" + i);
        let visible = localStorage.getItem("visibleTeam" + i) !== "0";
        if (name && visible) visibleTeamCount++;
    }
    // Show/hide add team input/button div based on visible team count
    var inputButtonDiv = document.getElementById('addTeamContainer');
    if (inputButtonDiv) {
        const quizStarted = localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1';
        if (visibleTeamCount >= maxTeams || quizStarted) {
            inputButtonDiv.style.display = 'none';
            inputButtonDiv.style.visibility = 'hidden';
            inputButtonDiv.style.marginTop = '0';
            inputButtonDiv.style.marginBottom = '0';
            inputButtonDiv.style.height = '0';
            inputButtonDiv.style.paddingTop = '0';
            inputButtonDiv.style.paddingBottom = '0';
            inputButtonDiv.style.minHeight = '0';
            inputButtonDiv.style.maxHeight = '0';
            inputButtonDiv.style.border = 'none';
        } else {
            inputButtonDiv.style.display = 'flex';
            inputButtonDiv.style.height = 'auto';
            inputButtonDiv.style.visibility = 'visible';
            inputButtonDiv.style.marginTop = '10px';
            inputButtonDiv.style.marginBottom = '18px';
            var addTeamBtn = document.getElementById('addTeamBtn');
            if (addTeamBtn) {
                addTeamBtn.disabled = false;
            }
        }
    }
    // Hide round navigation div if quiz not started
    var roundNavDiv = document.getElementById('roundLabel')?.parentElement;
    if (roundNavDiv) {
        if (localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1') {
            roundNavDiv.style.display = 'flex';
            roundNavDiv.style.marginTop = '10px';
            roundNavDiv.style.marginBottom = '16px';
            roundNavDiv.style.height = '';
        } else {
            roundNavDiv.style.display = 'none';
            roundNavDiv.style.marginTop = '0';
            roundNavDiv.style.marginBottom = '0';
            roundNavDiv.style.height = '0';
        }
    }
    // Always show RESET QUIZ button
    var resetBtn = document.getElementById('reset');
    if (resetBtn) {
        const quizStarted = localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1';
        resetBtn.style.display = quizStarted ? '' : 'none';
    }
    // Hide input fields if quiz has started
    if (localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1') {
        if (inputField1) inputField1.style.display = 'none';
        if (inputField2) inputField2.style.display = 'none';
        if (inputField3) inputField3.style.display = 'none';
    } else {
        if (inputField1) inputField1.style.display = '';
        if (inputField2) inputField2.style.display = '';
        if (inputField3) inputField3.style.display = '';
    }
    // Debug: log collProgress at start of render
    let collProgressRender = localStorage.getItem('collProgress');
    console.log('RENDER collProgress:', collProgressRender);
    // Attach NEXT/PREV/NEXT TURN handler
    const nextRoundBtn = document.getElementById('nextRound');
    const nextTurnBtn = document.getElementById('nextTurn');
    const prevRoundBtn = document.getElementById('prevRound');
    let quizWasStarted = localStorage.getItem('quizWasStarted') === '1';
    const ensureNextTurnCounterElement = () => {
        if (!nextTurnBtn) return null;
        let counterEl = document.getElementById('nextTurnCounterDisplay');
        if (!counterEl) {
            const wrapper = document.createElement('span');
            wrapper.id = 'nextTurnCounterWrapper';
            wrapper.style.marginLeft = '12px';
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '10px';

            counterEl = document.createElement('span');
            counterEl.id = 'nextTurnCounterDisplay';
            counterEl.style.fontSize = '2em';
            counterEl.style.fontWeight = 'bold';
            counterEl.style.color = '#fff';
            counterEl.style.letterSpacing = '1px';
            counterEl.style.minWidth = '48px';
            counterEl.style.minHeight = '48px';
            counterEl.style.padding = '8px 18px';
            counterEl.style.borderRadius = '18px';
            counterEl.style.background = 'rgba(255,255,255,0.12)';
            counterEl.style.display = 'inline-flex';
            counterEl.style.alignItems = 'center';
            counterEl.style.justifyContent = 'center';
            counterEl.style.textAlign = 'center';
            counterEl.style.backdropFilter = 'blur(4px)';
            counterEl.style.textTransform = 'uppercase';

            const spinContainer = document.createElement('span');
            spinContainer.id = 'nextTurnCounterSpin';
            spinContainer.style.display = 'none';
            spinContainer.style.flexDirection = 'column';
            spinContainer.style.gap = '6px';

            const makeSpinButton = (id, label) => {
                const btn = document.createElement('button');
                btn.id = id;
                btn.type = 'button';
                btn.textContent = label;
                btn.style.width = '28px';
                btn.style.height = '28px';
                btn.style.borderRadius = '50%';
                btn.style.border = 'none';
                btn.style.background = 'linear-gradient(180deg, #ff9a00 0%, #c06400 100%)';
                btn.style.color = '#220c00';
                btn.style.fontWeight = 'bold';
                btn.style.cursor = 'pointer';
                btn.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.25)';
                return btn;
            };

            const adjustCounter = (delta) => {
                let base = parseInt(localStorage.getItem('nextTurnCount'));
                if (isNaN(base) || base < 1) base = 1;
                base += delta;
                if (base < 1) base = 1;
                localStorage.setItem('nextTurnCount', String(base));
                refreshNextTurnCounterDisplay();
                if (window.renderTeams) window.renderTeams();
            };

            const upBtn = makeSpinButton('nextTurnCounterSpinUp', '+');
            upBtn.onclick = (e) => {
                e.stopPropagation();
                adjustCounter(1);
            };
            const downBtn = makeSpinButton('nextTurnCounterSpinDown', '-');
            downBtn.onclick = (e) => {
                e.stopPropagation();
                adjustCounter(-1);
            };

            spinContainer.appendChild(upBtn);
            spinContainer.appendChild(downBtn);

            wrapper.appendChild(counterEl);
            wrapper.appendChild(spinContainer);
            nextTurnBtn.insertAdjacentElement('afterend', wrapper);
        }
        return counterEl;
    };
    const refreshNextTurnCounterDisplay = () => {
        let counterValue = parseInt(localStorage.getItem('nextTurnCount'));
        if (isNaN(counterValue) || counterValue < 1) {
            counterValue = 1;
            localStorage.setItem('nextTurnCount', '1');
        }
        const counterEl = ensureNextTurnCounterElement();
        if (counterEl) {
            counterEl.textContent = `${counterValue}`;
        }
        const spinContainer = document.getElementById('nextTurnCounterSpin');
        const roundLabelNode = document.getElementById('roundLabel');
        const inEditMode = roundLabelNode && roundLabelNode.textContent.trim() === 'EDIT MODE';
        if (spinContainer) {
            spinContainer.style.display = inEditMode ? 'flex' : 'none';
        }
    };
    // roundLabel and round already declared above
    // NEXT ROUND
    if (nextRoundBtn) {
        nextRoundBtn.style.display = 'inline-block';
        if (round === 'EDIT MODE') {
            nextRoundBtn.disabled = true;
            nextRoundBtn.style.backgroundColor = '#222222';
            nextRoundBtn.style.color = 'white';
            nextRoundBtn.style.opacity = '1';
        } else {
            nextRoundBtn.disabled = !(quizStarted || quizWasStarted);
            nextRoundBtn.style.backgroundColor = '#2222aa';
            nextRoundBtn.style.color = 'white';
            nextRoundBtn.style.opacity = nextRoundBtn.disabled ? '0.5' : '1';
        }
        nextRoundBtn.onclick = function () {
            if (!nextRoundBtn.disabled) {
                setTimeout(() => {
                    if (window.executeNextTurnLogic) {
                        window.executeNextTurnLogic();
                    }
                    localStorage.setItem('nextTurnCount', '1');
                    refreshNextTurnCounterDisplay();
                }, 0);
            }
        };
    }
    // PREV ROUND
    if (prevRoundBtn) {
        if (round === 'EDIT MODE') {
            prevRoundBtn.disabled = true;
            prevRoundBtn.style.backgroundColor = '#222222';
            prevRoundBtn.style.color = 'white';
            prevRoundBtn.style.opacity = '1';
        } else {
            prevRoundBtn.disabled = false;
            prevRoundBtn.style.backgroundColor = '#2222aa';
            prevRoundBtn.style.color = 'white';
            prevRoundBtn.style.opacity = '1';
        }
        prevRoundBtn.onclick = function () {
            if (!prevRoundBtn.disabled) {
                setTimeout(() => {
                    if (window.executeNextTurnLogic) {
                        window.executeNextTurnLogic();
                    }
                    localStorage.setItem('nextTurnCount', '1');
                    refreshNextTurnCounterDisplay();
                }, 0);
            }
        };
    }
    // NEXT TURN
    if (nextTurnBtn) {
        if (round === 'EDIT MODE') {
            nextTurnBtn.disabled = true;
            nextTurnBtn.style.backgroundColor = '#222222';
            nextTurnBtn.style.color = 'white';
            nextTurnBtn.style.opacity = '1';
        } else {
            nextTurnBtn.disabled = false;
            nextTurnBtn.style.backgroundColor = 'purple';
            nextTurnBtn.style.color = 'white';
            nextTurnBtn.style.opacity = '1';
        }
    }
    refreshNextTurnCounterDisplay();
    // Attach listeners to save inputField1, inputField2, inputField3 to localStorage
    // ...existing code...
    // Hide input fields if quiz has started
    var inputField1 = document.getElementById('inputField1');
    var inputField2 = document.getElementById('inputField2');
    var inputField3 = document.getElementById('inputField3');
    if (localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1') {
        if (inputField1) inputField1.style.display = 'none';
        if (inputField2) inputField2.style.display = 'none';
        if (inputField3) inputField3.style.display = 'none';
    } else {
        if (inputField1) inputField1.style.display = '';
        if (inputField2) inputField2.style.display = '';
        if (inputField3) inputField3.style.display = '';
    }
    if (inputField1) {
        inputField1.oninput = function () {
            localStorage.setItem('inputField1', this.value);
        };
        // Save initial value
        localStorage.setItem('inputField1', inputField1.value);
    }
    if (inputField2) {
        inputField2.oninput = function () {
            localStorage.setItem('inputField2', this.value);
        };
        localStorage.setItem('inputField2', inputField2.value);
    }
    if (inputField3) {
        inputField3.oninput = function () {
            localStorage.setItem('inputField3', this.value);
        };
        localStorage.setItem('inputField3', inputField3.value);
    }
    // Add padding to the HTML body
    // (If you need to add button listeners, do so in the main render or setup function, not here)
    const container = document.getElementById("teamsContainer");
    const stopBtn = document.getElementById("stop");
    container.innerHTML = "";
    // Inject global font style for DIN Black Regular
    if (!document.getElementById('din-black-font-style')) {
        const style = document.createElement('style');
        style.id = 'din-black-font-style';
        style.innerHTML = `
            @font-face {
                font-family: 'DIN Black Regular';
                src: url('styles/DIN Black Regular.otf') format('opentype');
                font-weight: normal;
                font-style: normal;
            }
            body, body * {
                font-family: 'DIN Black Regular', Arial, sans-serif !important;
            }
        `;
        document.head.appendChild(style);
    }
    const headerRow = document.createElement("div");
    headerRow.className = "team-header-row";
    headerRow.innerHTML = `
        <style>
            @font-face {
                font-family: 'DIN Black Regular';
                src: url('styles/DIN Black Regular.otf') format('opentype');
                font-weight: normal;
                font-style: normal;
            }
            .team-header-row * {
                font-family: 'DIN Black Regular', Arial, sans-serif !important;
            }
            .team-header-row-inner, .team-row-inner {
                display: flex;
                align-items: center;
                font-weight: bold;
                /* background removed */
                padding: 6px 0;
                width: 99vw;
                box-sizing: border-box;
            }
            .team-header-row-inner span, .team-row-inner span {
                display: flex;
                align-items: center;
                justify-content: left;
                text-align: center;
                box-sizing: border-box;
            }
            .col-visible { width: 40px; }
            .col-name { min-width: 150px; max-width: 340px; flex: 2 1 280px; text-align: left; }
            .col-name-header { margin-left: 10px; }
            .col-actions {min-width: 120px; flex: 2 1 120px; flex-wrap: nowrap; justify-content: flex-start; margin-left: 60px; gap: 18px; }
            .col-score-label {margin-left: 326px; font-size: 1em; letter-spacing: 1px; }
            #editRoundBtn {
                background: #fee500ff;
                color: #222222;
                border-radius: 16px;
                font-size: 1.1em;
                font-weight: bold;
                padding: 8px 48px;
                margin-left: 24px;
                min-width: 210px;
                border: none;
                cursor: pointer;
                transition: filter 0.2s;
            }
            #editRoundBtn:hover:not(:disabled) {
                filter: brightness(1.25);
            }
        </style>
        <div class='team-header-row-inner'>
            <span class='col-visible'>&#128065;</span>
            <span class='col-name'><span class="col-name-header">TEAM NAME</span></span>
            <span class='col-actions' style="margin-left: 20px;">&nbsp;ACTIONS
                <button id="editRoundBtn">EDIT</button>
                <span class='col-score-label'>SCORE</span>
            </span>
        </div>
    `;
    container.appendChild(headerRow);
    // Attach edit button logic
    setTimeout(() => {
        const editBtn = document.getElementById('editRoundBtn');
        if (editBtn) {
            editBtn.onclick = function () {
                const roundLabel = document.getElementById('roundLabel');
                let roundNames = ["3-6-9", "OPEN DEUR", "PUZZEL", "GALLERIJ", "COLLEC. GEH.", "FINALE"];
                let currentRound = roundLabel ? roundLabel.textContent.trim() : '';
                let roundIndex = parseInt(localStorage.getItem('roundIndex'));
                if (currentRound !== 'EDIT MODE') {
                    localStorage.setItem('lastRoundIndex', roundIndex);
                    localStorage.setItem('editMode', '1');
                    if (roundLabel) roundLabel.textContent = 'EDIT MODE';
                } else {
                    let lastRoundIndex = parseInt(localStorage.getItem('lastRoundIndex'));
                    if (!isNaN(lastRoundIndex)) {
                        localStorage.setItem('editMode', '0');
                        if (roundLabel) roundLabel.textContent = roundNames[lastRoundIndex];
                    }
                }
                setTimeout(() => {
                    const editBtn = document.getElementById('editRoundBtn');
                    const roundLabel = document.getElementById('roundLabel');
                    let currentRound = roundLabel ? roundLabel.textContent.trim() : '';
                    if (editBtn) editBtn.textContent = (currentRound === 'EDIT MODE') ? 'STOP EDITING' : 'EDIT';
                }, 10);
                renderTeams();
            };
            // Set button text on initial render to match mode
            const roundLabel = document.getElementById('roundLabel');
            const inEditMode = roundLabel && roundLabel.textContent.trim() === 'EDIT MODE';
            editBtn.textContent = inEditMode ? 'STOP EDITING' : 'EDIT';
        }
    }, 0);
    // Add spacing between header and rows
    const spacer = document.createElement('div');
    spacer.style.height = '0px';
    container.appendChild(spacer);
    // let maxTeams = 9; // Already declared at top of function
    // teams already declared above
    for (let i = 1; i <= maxTeams; i++) {
        let name = localStorage.getItem("nameTeam" + i);
        let visible = localStorage.getItem("visibleTeam" + i) !== "0";
        if (!name) continue;
        // No need to increment teamCount, use visibleTeamCount for all logic
        let scoreRaw = localStorage.getItem("team" + i + "Score");
        let score = 60;
        if (scoreRaw !== null && !isNaN(Number(scoreRaw))) {
            score = Number(scoreRaw);
        }
        teams.push({
            i,
            name,
            score,
            visible
        });
    }
    // Always sort teams by score (lowest first) in COLLEC. GEH. round
    if (round === 'COLLEC. GEH.') {
        teams.sort((a, b) => a.score - b.score);
    } else if (round !== '3-6-9') {
        teams.sort((a, b) => a.score - b.score);
    }
    // Render sorted teams
    teams.forEach((team, rowIndex) => {
        let i = team.i;
        let name = team.name;
        let score = team.score;
        let visible = team.visible;
        let done = localStorage.getItem(`team${i}Done`) === '1';
        let roundLabel = document.getElementById('roundLabel');
        let round = roundLabel ? roundLabel.textContent.trim() : '';
        const inEditMode = (round === 'EDIT MODE');
        const rowLocked = done && !inEditMode;
        // In EDIT round, enable all rows and buttons
        let enableRow = false;
        if (!visible) {
            enableRow = false;
        } else if (inEditMode) {
            enableRow = true;
        } else if (round === '3-6-9') {
            enableRow = true;
        } else if (currentTeam !== -1) {
            enableRow = (currentTeam === (i - 1));
        } else if (nextEnabledTeamIndex !== -1) {
            enableRow = (rowIndex === nextEnabledTeamIndex);
        } else {
            enableRow = false;
        }
        const isActiveTeam = inEditMode ? true : currentTeam === (i - 1);
        let disableStartStop = inEditMode;
        const enforceSingleStart = !inEditMode && currentTeam !== -1 && currentTeam !== (i - 1);
        // COLLEC. GEH. progressive logic
        let collProgress = 0;
        if (round === 'COLLEC. GEH.') {
            collProgress = parseInt(localStorage.getItem('collProgress') || '0');
        }
        const canScoreThisRow = inEditMode ? true : isActiveTeam;
        // Button enable logic per round
        let enable10 = false;
        let enable20 = false;
        let enable30 = false;
        let enable40 = false;
        let enable50 = false;
        let enableSub = false;
        if (round === 'EDIT MODE') {
            enable10 = enable20 = enable30 = enable40 = enable50 = enableSub = true;
        } else if (round === 'COLLEC. GEH.') {
            enable10 = canScoreThisRow && collProgress === 0;
            enable20 = canScoreThisRow && collProgress === 1;
            enable30 = canScoreThisRow && collProgress === 2;
            enable40 = canScoreThisRow && collProgress === 3;
            enable50 = canScoreThisRow && collProgress === 4;
        } else if (canScoreThisRow) {
            if (round === '3-6-9' || round === 'GALLERIJ') {
                enable10 = true;
            } else if (round === 'OPEN DEUR') {
                enable20 = true;
            } else if (round === 'PUZZEL') {
                enable30 = true;
            } else if (round === 'FINALE') {
                enableSub = true;
            }
        }
        const enable15 = inEditMode ? true : (round === 'GALLERIJ' && canScoreThisRow);
        let row = document.createElement("div");
        row.className = "team-row " + (rowIndex % 2 === 0 ? "row-odd" : "row-even");
        row.innerHTML = `
            <div class='team-row-inner' style="margin-bottom: -4px;">
                <span class='col-visible'><input type="checkbox" id="visibleTeam${i}" ${visible ? "checked" : ""} style="width: 38px; height: 38px; transform: scale(1.8); accent-color: #2222aa; margin-right: 24px;"/></span>
                <span class='col-name'><input id="nameTeam${i}" value="${name}" class="${rowLocked ? 'stopped-team-name' : ''}" style="background-color: ${rowLocked ? '#222222' : '#fea400'}; color: black; font-size: 1.3em; padding: 14px 10px; min-width: 180px; max-width: 320px; min-height: 65px; width: 100%;" ${(round !== 'EDIT MODE') ? 'disabled' : ''}/></span>
                <span class='col-buttons'>
                    <button id="startTeam${i}" style="background-color: ${(disableStartStop || rowLocked || enforceSingleStart) ? '#222222' : isActiveTeam ? 'red' : enableRow ? 'darkblue' : '#222222'}; color: white; font-size: 1.3em; padding: 18px 10px; min-width: 120px; width: 120px; min-height: 60px; margin-left: 2px; margin-right: 6px;" ${(disableStartStop || rowLocked || !enableRow || enforceSingleStart) ? 'disabled' : ''}>${inEditMode ? '' : (isActiveTeam ? 'STOP' : 'START')}</button>
                    <button id="addTeam${i}_10" style="background-color: ${rowLocked ? '#222222' : (round === 'GALLERIJ' ? '#222222' : enable10 ? 'green' : '#222222')}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 6px;" ${rowLocked || !enable10 || round === 'GALLERIJ' ? 'disabled' : ''}> +10 </button>
                    <button id="addTeam${i}_20" style="background-color: ${rowLocked ? '#222222' : enable20 ? 'green' : '#222222'}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 6px;" ${rowLocked || !enable20 ? 'disabled' : ''}> +20 </button>
                    <button id="addTeam${i}_30" style="background-color: ${rowLocked ? '#222222' : enable30 ? 'green' : '#222222'}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 6px;" ${rowLocked || !enable30 ? 'disabled' : ''}> +30 </button>
                    <button id="addTeam${i}_40" style="background-color: ${rowLocked ? '#222222' : enable40 ? 'green' : '#222222'}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 6px;" ${rowLocked || !enable40 ? 'disabled' : ''}> +40 </button>
                    <button id="addTeam${i}_50" style="background-color: ${rowLocked ? '#222222' : enable50 ? 'green' : '#222222'}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 6px;" ${rowLocked || !enable50 ? 'disabled' : ''}> +50 </button>
                    <button id="addTeam${i}_15" style="background-color: ${rowLocked ? '#222222' : (enable15 ? 'green' : '#222222')}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 6px;" ${rowLocked || !enable15 ? 'disabled' : ''}> +15 </button>
                    <button id="subTeam${i}" style="background-color: ${rowLocked ? '#222222' : enableSub ? 'darkred' : '#222222'}; color: white; font-size: 1.3em; padding: 18px 8px; min-width: 70px; margin-right: 8px;" ${rowLocked || !enableSub ? 'disabled' : ''}> -20 </button>
                    <span class='score-input-wrapper'>
                        <input id="scoreTeam${i}" min="0" max="999" type="number" value="${score}" class="${rowLocked ? 'score-input stopped-team-score' : 'score-input'}" style="width:100px; background-color: ${rowLocked ? '#222222' : 'darkorange'}; color: white;min-height: 65px; font-size: 1.3em; padding: 14px 12px; margin: 0 8px 0 0;" ${inEditMode ? '' : 'readonly'} />
                        ${inEditMode ? `
                        <span class='score-spin-buttons'>
                            <button type="button" id="scoreSpinUp${i}" class="score-spin-button" aria-label="Increase score">+</button>
                            <button type="button" id="scoreSpinDown${i}" class="score-spin-button" aria-label="Decrease score">-</button>
                        </span>
                        ` : ''}
                    </span>
                </span>
            </div>
        `;
        container.appendChild(row);
        // COLLEC. GEH. progressive button click logic
        if (round === 'COLLEC. GEH.') {
            let btn10 = document.getElementById(`addTeam${i}_10`);
            let btn20 = document.getElementById(`addTeam${i}_20`);
            let btn30 = document.getElementById(`addTeam${i}_30`);
            let btn40 = document.getElementById(`addTeam${i}_40`);
            let btn50 = document.getElementById(`addTeam${i}_50`);
            const collButtons = [btn10, btn20, btn30, btn40, btn50];
            function updateCollButtons(nextProgress) {
                collButtons.forEach((button, idx) => {
                    if (!button) return;
                    const shouldEnable = canScoreThisRow && nextProgress === idx;
                    button.disabled = !shouldEnable;
                    button.style.backgroundColor = shouldEnable ? 'green' : '#222222';
                });
            }
            function collButtonHandler(progressValue, btn, label) {
                if (!btn) return;
                btn.onclick = function () {
                    const isEnabled = !btn.disabled;
                    console.log(`[COLLEC. GEH.] ${label} clicked, collProgress before:`, collProgress, 'enabled:', isEnabled, 'row:', rowIndex, 'enabledRow:', enabledTeamIndex);
                    if (isEnabled && canScoreThisRow && collProgress === progressValue) {
                        // Add correct score (+10, +20, ...)
                        const addSeconds = (progressValue + 1) * 10;
                        updateScoreAndField(i, addSeconds);
                        // Update collProgress
                        const newProgress = progressValue + 1;
                        localStorage.setItem('collProgress', String(newProgress));
                        collProgress = newProgress;
                        console.log(`[COLLEC. GEH.] ${label} clicked, collProgress after:`, localStorage.getItem('collProgress'));
                        updateCollButtons(newProgress);
                    }
                };
            }
            // Initialize button states for current progress
            updateCollButtons(collProgress);
            collButtonHandler(0, btn10, '+10');
            collButtonHandler(1, btn20, '+20');
            collButtonHandler(2, btn30, '+30');
            collButtonHandler(3, btn40, '+40');
            collButtonHandler(4, btn50, '+50');
        }
    });
    // ...existing code...
    // NEXT TURN button resets COLLEC. GEH. progress and enables correct team row(s)
    // nextTurnBtn already declared in renderTeams
    if (nextTurnBtn) {
        nextTurnBtn.onclick = function () {
            let maxTeams = 9;
            let currentCount = parseInt(localStorage.getItem('nextTurnCount'));
            if (isNaN(currentCount) || currentCount < 1) {
                currentCount = 1;
            }
            localStorage.setItem('nextTurnCount', String(currentCount + 1));
            refreshNextTurnCounterDisplay();
            if (window.renderTeams) window.renderTeams(); // Immediate UI update
            // Reset COLLEC. GEH. progress
            localStorage.setItem('collProgress', '0');
            // Get current round
            let roundLabel = document.getElementById('roundLabel');
            let round = roundLabel ? roundLabel.textContent.trim() : '';
            let teams = [];
            let firstAvailableIndex = -1;
            for (let i = 1; i <= maxTeams; i++) {
                let name = localStorage.getItem("nameTeam" + i);
                if (!name) continue;
                let scoreRaw = localStorage.getItem("team" + i + "Score");
                let score = 60;
                if (scoreRaw !== null && !isNaN(Number(scoreRaw))) {
                    score = Number(scoreRaw);
                }
                let visible = localStorage.getItem("visibleTeam" + i) !== "0";
                teams.push({ i, name, score, visible });
                if (firstAvailableIndex === -1) firstAvailableIndex = i - 1;
            }
            // Reset all team rows/buttons state
            for (let i = 1; i <= maxTeams; i++) {
                localStorage.setItem(`team${i}Done`, '0');
                // Optionally, reset button states if needed (handled by renderTeams)
            }
            // Always set currentTeam to -1 so the counter does NOT start
            localStorage.setItem('currentTeam', -1);
            // Set nextEnabledTeamIndex to first available team
            localStorage.setItem('nextEnabledTeamIndex', firstAvailableIndex);
            if (window.renderTeams) window.renderTeams();
        };
    }
    // Show/hide start quiz button based on team count (after teamCount is calculated)
    if (startQuizBtn) {
        startQuizBtn.style.display = visibleTeamCount >= 2 ? "inline-block" : "none";
        // Change button text if quiz started
        if (localStorage.getItem('quizStarted') === '1' || localStorage.getItem('quizWasStarted') === '1') {
            startQuizBtn.textContent = 'OPEN QUIZ WINDOW';
        } else {
            startQuizBtn.textContent = 'START QUIZ';
        }
        startQuizBtn.onclick = function () {
            // Set round to 3-6-9 (index 1) on quiz start
            localStorage.setItem('roundIndex', 1);
            localStorage.setItem('quizStarted', '1');
            localStorage.setItem('quizWasStarted', '1');
            localStorage.setItem('nextEnabledTeamIndex', 0); // Only enable first row
            // Hide the title label immediately
            var titleLabel = document.querySelector('#titleRow label');
            if (titleLabel) {
                titleLabel.style.display = 'none';
            }
            window.open('quiz.html', '_blank', 'location=no,menubar=no,scrollbars=no,status=no,toolbar=no');
            renderTeams(); // re-render to show STOP button and hide add row
        };
    }
    // Always show teamsContainer if there are teams
    container.style.display = visibleTeamCount === 0 ? "none" : "block";
    if (stopBtn) {
        let quizStarted = localStorage.getItem('quizStarted') === '1';
        const currentTeam = parseInt(localStorage.getItem('currentTeam'));
        // Only show STOP/START if quiz has started
        stopBtn.style.display = (visibleTeamCount > 0 && quizStarted) ? "inline-block" : "none";
        stopBtn.disabled = false;
        stopBtn.style.opacity = '1';
        // Hide big button completely
        stopBtn.style.display = 'none';
        // Always re-attach STOP handler after render
        stopBtn.onclick = function () {
            // Always mark current team as done if valid
            if (!isNaN(currentTeam) && currentTeam !== -1) {
                localStorage.setItem(`team${currentTeam + 1}Done`, '1');
            }
            // Find all teams, sort by score ascending
            let updatedTeams = [];
            for (let i = 1; i <= 9; i++) {
                let name = localStorage.getItem("nameTeam" + i);
                if (!name) continue;
                let scoreRaw = localStorage.getItem("team" + i + "Score");
                let score = 60;
                if (scoreRaw !== null && !isNaN(Number(scoreRaw))) {
                    score = Number(scoreRaw);
                }
                let visible = localStorage.getItem("visibleTeam" + i) !== "0";
                let done = localStorage.getItem(`team${i}Done`) === '1';
                updatedTeams.push({ i, name, score, visible, done });
            }
            updatedTeams.sort((a, b) => a.score - b.score);
            // Enable the team row with the lowest score that is not done and visible
            let lowestScoreIndex = -1;
            for (let idx = 0; idx < updatedTeams.length; idx++) {
                if (!updatedTeams[idx].done && updatedTeams[idx].visible) {
                    lowestScoreIndex = idx;
                    break;
                }
            }
            if (lowestScoreIndex !== -1) {
                localStorage.setItem('nextEnabledTeamIndex', lowestScoreIndex);
                localStorage.setItem('currentTeam', updatedTeams[lowestScoreIndex].i - 1);
            } else {
                localStorage.setItem('nextEnabledTeamIndex', -1);
                localStorage.setItem('currentTeam', -1);
            }
            // Set flag to sort teams in COLLEC. GEH. after STOP
            if (roundLabel && roundLabel.textContent.trim() === 'COLLEC. GEH.') {
                localStorage.setItem('collecGehSort', '1');
            }
            renderTeams();
            // Reset sort flag after rendering so it only sorts once
            if (roundLabel && roundLabel.textContent.trim() === 'COLLEC. GEH.') {
                localStorage.setItem('collecGehSort', '0');
            }
        };
    }
    // Hide add team input/button if 9 teams
    let addTeamRow = addTeamBtn && addTeamName ? addTeamBtn.parentElement : null;
    // quizStarted and quizWasStarted already declared earlier in this function
    if (addTeamRow) {
        if (visibleTeamCount >= maxTeams) {
            addTeamRow.style.display = "none";
        } else {
            addTeamRow.style.display = "flex";
            addTeamBtn.style.display = "inline-block";
            addTeamName.style.display = "inline-block";
            addTeamBtn.disabled = false;
            addTeamName.disabled = false;
        }
    }
    // Attach event listeners for all teams
    for (let i = 1; i <= maxTeams; i++) {
        if (!localStorage.getItem("nameTeam" + i)) continue;
        document.getElementById(`nameTeam${i}`).oninput = function () {
            localStorage.setItem(`nameTeam${i}`, this.value);
            localStorage.setItem('adminUpdate', Date.now());
        };
        document.getElementById(`visibleTeam${i}`).onchange = function () {
            localStorage.setItem(`visibleTeam${i}`, this.checked ? "1" : "0");
        };
        document.getElementById(`startTeam${i}`).onclick = function () {
            const currentTeam = parseInt(localStorage.getItem('currentTeam'));
            if (currentTeam === (i - 1)) {
                // STOP logic: mark team as done
                localStorage.setItem(`team${i}Done`, '1');
                let roundLabel = document.getElementById('roundLabel');
                let round = roundLabel ? roundLabel.textContent.trim() : '';
                let nextIndex = -1;
                // Always enable the row with the lowest score that is not done and is visible
                let teams = [];
                for (let k = 1; k <= 9; k++) {
                    let name = localStorage.getItem("nameTeam" + k);
                    if (!name) continue;
                    let scoreRaw = localStorage.getItem("team" + k + "Score");
                    let score = 60;
                    if (scoreRaw !== null && !isNaN(Number(scoreRaw))) {
                        score = Number(scoreRaw);
                    }
                    let visible = localStorage.getItem("visibleTeam" + k) !== "0";
                    let done = localStorage.getItem(`team${k}Done`) === '1';
                    teams.push({ k, score, visible, done });
                }
                teams.sort((a, b) => a.score - b.score);
                for (let idx = 0; idx < teams.length; idx++) {
                    if (!teams[idx].done && teams[idx].visible) {
                        nextIndex = idx;
                        break;
                    }
                }
                localStorage.setItem('nextEnabledTeamIndex', nextIndex);
                // After STOP, set currentTeam to -1 so no team is active
                localStorage.setItem('currentTeam', -1);
                renderTeams();
            } else {
                // START logic: set currentTeam and update button
                localStorage.setItem('quizStarted', '1');
                localStorage.setItem('currentTeam', i - 1);
                // Clear nextEnabledTeamIndex after starting
                localStorage.setItem('nextEnabledTeamIndex', -1);
                renderTeams();
            }
        };
        // Remove generic addTeam button handlers to avoid overwriting COLLEC. GEH. progressive logic
        let roundLabel = document.getElementById('roundLabel');
        let round = roundLabel ? roundLabel.textContent.trim() : '';
        if (round !== 'COLLEC. GEH.') {
            if (round === 'GALLERIJ') {
                document.getElementById(`addTeam${i}_10`).onclick = null;
            } else {
                document.getElementById(`addTeam${i}_10`).onclick = function () { updateScoreAndField(i, 10); };
            }
            if (round === 'EDIT MODE' || round === 'GALLERIJ') {
                document.getElementById(`addTeam${i}_15`).onclick = function () { updateScoreAndField(i, 15); };
            } else {
                document.getElementById(`addTeam${i}_15`).onclick = null;
            }
            document.getElementById(`addTeam${i}_20`).onclick = function () { updateScoreAndField(i, 20); };
            document.getElementById(`addTeam${i}_30`).onclick = function () { updateScoreAndField(i, 30); };
            document.getElementById(`addTeam${i}_40`).onclick = function () { updateScoreAndField(i, 40); };
            document.getElementById(`addTeam${i}_50`).onclick = function () { updateScoreAndField(i, 50); };
        }
        document.getElementById(`subTeam${i}`).onclick = function () { updateScoreAndField(i, -20); };
        document.getElementById(`scoreTeam${i}`).oninput = function () {
            localStorage.setItem(`team${i}Score`, parseInt(this.value));
            localStorage.setItem('adminUpdate', Date.now());
        };
        const spinUpBtn = document.getElementById(`scoreSpinUp${i}`);
        if (spinUpBtn) {
            spinUpBtn.onclick = function () {
                if (spinUpBtn.disabled) return;
                updateScoreAndField(i, 1);
            };
        }
        const spinDownBtn = document.getElementById(`scoreSpinDown${i}`);
        if (spinDownBtn) {
            spinDownBtn.onclick = function () {
                if (spinDownBtn.disabled) return;
                updateScoreAndField(i, -1);
            };
        }
        // Update score and input field immediately
        function updateScoreAndField(teamId, delta) {
            let scoreKey = `team${teamId}Score`;
            let score = Number.parseInt(localStorage.getItem(scoreKey)) || 0;
            score += delta;
            if (score < 0) score = 0;
            localStorage.setItem(scoreKey, score);
            const input = document.getElementById(`scoreTeam${teamId}`);
            if (input) input.value = score;
            // Trigger a dummy update to force quiz page to refresh
            localStorage.setItem('adminUpdate', Date.now());
        }
        // DONE button: turn gray when clicked, disable START button
        const checkBtn = document.getElementById(`checkTeam${i}`);
        const startBtn = document.getElementById(`startTeam${i}`);
        if (checkBtn && startBtn) {
            checkBtn.onclick = function () {
                // Mark this team as done
                localStorage.setItem(`team${i}Done`, '1');
                // Disable all buttons in this row
                const rowButtons = [
                    document.getElementById(`startTeam${i}`),
                    document.getElementById(`addTeam${i}_10`),
                    document.getElementById(`addTeam${i}_20`),
                    document.getElementById(`addTeam${i}_30`),
                    document.getElementById(`addTeam${i}_40`),
                    document.getElementById(`addTeam${i}_50`),
                    document.getElementById(`subTeam${i}`),
                    checkBtn
                ];
                rowButtons.forEach(btn => {
                    if (btn) {
                        btn.disabled = true;
                        btn.style.backgroundColor = 'gray';
                        btn.style.color = 'white';
                    }
                });
                localStorage.setItem('currentTeam', -1);
                // Re-render teams to update order and button state
                renderTeams();
            };
        }
    }
}

// Initial render
window.addEventListener('DOMContentLoaded', function () {
    renderTeams();
});



window.onstorage = storage;

function attachResetHandler() {
    const resetBtn = document.getElementById("reset");
    if (resetBtn) resetBtn.onclick = reset;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachResetHandler);
} else {
    attachResetHandler();
}

//
function storage(e) {
    if (e.key == "team1Score") {
        document.getElementById("scoreTeam1").value = localStorage.getItem("team1Score");
    } else if (e.key == "team2Score") {
        document.getElementById("scoreTeam2").value = localStorage.getItem("team2Score");
    } else if (e.key == "team3Score") {
        document.getElementById("scoreTeam3").value = localStorage.getItem("team3Score");
    } else if (e.key == "team4Score") {
        document.getElementById("scoreTeam4").value = localStorage.getItem("team4Score");
    }
}
function startQuiz() {
    window.open("quiz.html", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no");
}

function reset() {
    if (confirm('Weet je zeker dat je alle teams wilt verwijderen?')) {
        let maxTeams = 9;
        for (let i = 1; i <= maxTeams; i++) {
            localStorage.removeItem("nameTeam" + i);
            localStorage.removeItem("team" + i + "Score");
            localStorage.removeItem("visibleTeam" + i);
            localStorage.removeItem(`team${i}Done`);
        }
        // Also clear any stray team slots from previous bugs (10-20)
        for (let i = 10; i <= 20; i++) {
            localStorage.removeItem("nameTeam" + i);
            localStorage.removeItem("team" + i + "Score");
            localStorage.removeItem("visibleTeam" + i);
            localStorage.removeItem(`team${i}Done`);
        }
        localStorage.setItem("currentTeam", -1);
        localStorage.setItem('quizStarted', '0');
        localStorage.setItem('quizWasStarted', '0');
        localStorage.setItem('nextEnabledTeamIndex', -1);
        // Optionally reset other quiz state variables here
        location.reload();
    }
}

function stop() {
    localStorage.setItem("currentTeam", -1);
    // Do NOT set quizStarted to '0' so teams remain visible
    renderTeams(); // re-render to keep STOP button and teams visible
}

//Team1
function change1() {
    localStorage.setItem("nameTeam1", document.getElementById("nameTeam1").value);
}
// Re-attach reset handler in case the button was re-rendered
attachResetHandler();

function start1() {
    localStorage.setItem("currentTeam", 0);
    document.getElementById("nameTeam1").style.backgroundColor = "blue";
    document.getElementById("nameTeam2").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam3").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam4").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam1").style.backgroundColor = "blue";
    document.getElementById("scoreTeam2").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam3").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam4").style.backgroundColor = "darkorange";
}

function add1_10() {
    add(1, 10000);
}
function add1_20() {
    add(1, 20000);
}
function add1_30() {
    add(1, 30000);
}
function add1_40() {
    add(1, 40000);
}
function add1_50() {
    add(1, 50000);
}

function sub1() {
    add(1, -20000);
}
function score1() {
    localStorage.setItem("team1Score", parseInt(document.getElementById("scoreTeam1").value) * 1000);
}

//Team 2
function change2() {
    localStorage.setItem("nameTeam2", document.getElementById("nameTeam2").value);
}

function start2() {
    localStorage.setItem("currentTeam", -1);
    // Do NOT set quizStarted to '0' so STOP and teams remain visible
    renderTeams(); // re-render teams, but keep STOP and teams visible
    document.getElementById("nameTeam3").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam4").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam1").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam2").style.backgroundColor = "blue";
    document.getElementById("scoreTeam3").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam4").style.backgroundColor = "darkorange";
}

function add2_10() {
    add(2, 10000);
}
function add2_20() {
    add(2, 20000);
}
function add2_30() {
    add(2, 30000);
}
function add2_40() {
    add(2, 40000);
}
function add2_50() {
    add(2, 50000);
}

function add(teamId, milliseconds) {
    let score = Number.parseFloat(localStorage.getItem("team" + teamId + "Score"));
    score += milliseconds;
    localStorage.setItem("team" + teamId + "Score", score);
    updateScores();
}
function sub2() {
    add(2, -20000);
}
function score2() {
    localStorage.setItem("team2Score", parseInt(document.getElementById("scoreTeam2").value) * 1000);
}

//Team 3

function change3() {
    localStorage.setItem("nameTeam3", document.getElementById("nameTeam3").value);
}

function start3() {
    localStorage.setItem("currentTeam", 2);
    document.getElementById("nameTeam1").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam2").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam3").style.backgroundColor = "blue";
    document.getElementById("nameTeam4").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam1").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam2").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam3").style.backgroundColor = "blue";
    document.getElementById("scoreTeam4").style.backgroundColor = "darkorange";
}

function add3_10() {
    add(3, 10000);
}
function add3_20() {
    add(3, 20000);
}
function add3_30() {
    add(3, 30000);
}
function add3_40() {
    add(3, 40000);
}
function add3_50() {
    add(3, 50000);
}

function sub3() {
    add(3, -20000);
}

function score3() {
    localStorage.setItem("team3Score", parseInt(document.getElementById("scoreTeam3").value) * 1000);
}

//Team 4

function change4() {
    localStorage.setItem("nameTeam4", document.getElementById("nameTeam4").value);
}

function start4() {
    localStorage.setItem("currentTeam", 3);
    document.getElementById("nameTeam1").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam2").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam3").style.backgroundColor = "darkorange";
    document.getElementById("nameTeam4").style.backgroundColor = "blue";
    document.getElementById("scoreTeam1").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam2").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam3").style.backgroundColor = "darkorange";
    document.getElementById("scoreTeam4").style.backgroundColor = "blue";
}

function add4_10() {
    add(4, 10000);
}
function add4_20() {
    add(4, 20000);
}
function add4_30() {
    add(4, 30000);
}
function add4_40() {
    add(4, 40000);
}
function add4_50() {
    add(4, 50000);
}

function sub4() {
    add(4, -20000);

}

function score4() {
    localStorage.setItem("team4Score", parseInt(document.getElementById("scoreTeam4").value) * 1000);
}


