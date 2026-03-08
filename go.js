document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const boardElement = document.getElementById('game-board');
    const startScreen = document.getElementById('start-screen');
    const gameUI = document.getElementById('game-ui');
    const timerBEl = document.getElementById('timer-b');
    const timerWEl = document.getElementById('timer-w');
    const btnPvE = document.getElementById('btn-pve');
    const btnPvP = document.getElementById('btn-pvp');
    const btnPass = document.getElementById('btn-pass');
    const btnRestart = document.getElementById('btn-restart');
    const btnMenu = document.getElementById('btn-menu');
    const inGameMenu = document.getElementById('ingame-menu');
    const btnSurrender = document.getElementById('btn-surrender');
    const btnQuit = document.getElementById('btn-quit');
    const btnCloseMenu = document.getElementById('btn-close-menu');
    const resultScreen = document.getElementById('result-screen');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const btnResultRestart = document.getElementById('btn-result-restart');
    const btnResultMenu = document.getElementById('btn-result-menu');
    const btnGuide = document.getElementById('btn-guide');
    const guideScreen = document.getElementById('guide-screen');
    const btnCloseGuide = document.getElementById('btn-close-guide');

    // === CONSTANTS & CONFIG ===
    const SIZE = 19;
    const starPoints = [3, 9, 15]; // Các điểm sao (Hoshi)

    // === GAME STATE ===
    let boardState, currentPlayer, gameMode, gameActive, capturedStones, koInfo, lastMoveWasPass;
    let timeLimit, timeLeft, timerInterval;

    // === EVENT LISTENERS ===
    if (btnPvP) btnPvP.addEventListener('click', () => startGame('pvp'));
    if (btnPvE) btnPvE.addEventListener('click', () => startGame('pve'));
    if (btnPass) btnPass.addEventListener('click', passTurn);
    if (btnRestart) btnRestart.addEventListener('click', resetGame); // Nút này có thể không tồn tại trong HTML mới, dùng btnResultRestart
    
    // Menu & Navigation Listeners
    if (btnMenu) btnMenu.addEventListener('click', () => inGameMenu.classList.remove('hidden'));
    if (btnQuit) btnQuit.addEventListener('click', () => window.parent.postMessage('exit-game', '*'));
    if (btnResultMenu) btnResultMenu.addEventListener('click', () => window.parent.postMessage('exit-game', '*'));
    if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => inGameMenu.classList.add('hidden'));
    
    if (btnResultRestart) btnResultRestart.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        gameUI.style.display = 'flex';
        resetGame();
    });

    if (btnSurrender) btnSurrender.addEventListener('click', () => {
        if (!gameActive) return;
        inGameMenu.classList.add('hidden');
        const winner = currentPlayer === 'black' ? 'Trắng' : 'Đen';
        endGame(`${winner} thắng!`, `Người chơi ${currentPlayer === 'black' ? 'Đen' : 'Trắng'} đã đầu hàng.`);
    });

    // Guide Logic
    if (btnGuide) btnGuide.addEventListener('click', () => guideScreen.classList.remove('hidden'));
    if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => guideScreen.classList.add('hidden'));

    // === CORE GAME FLOW ===
    function startGame(mode) {
        const timeInput = document.getElementById('time-limit');
        let minutes = timeInput ? parseInt(timeInput.value) : 10;
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 60) minutes = 60;
        timeLimit = minutes * 60;

        gameMode = mode;
        if (startScreen) startScreen.classList.add('hidden');
        if (gameUI) gameUI.style.display = 'flex';
        resetGame();
    }

    function resetGame() {
        boardState = Array(SIZE).fill(null).map(() => Array(SIZE).fill(''));
        currentPlayer = 'black';
        gameActive = true;
        capturedStones = { 'black': 0, 'white': 0 };
        koInfo = null; // {row, col} - vị trí cấm đi nước tiếp theo
        lastMoveWasPass = false;
        
        clearInterval(timerInterval);
        timeLeft = { 'black': timeLimit, 'white': timeLimit };
        updateTimerDisplay('black');
        updateTimerDisplay('white');
        startTimer();

        createBoard(); // Vẽ lại bàn cờ và các ô
    }

    function endGame(title, message) {
        gameActive = false;
        clearInterval(timerInterval);
        resultTitle.textContent = title;
        resultMessage.innerHTML = message; // Đổi sang innerHTML để hiển thị định dạng xuống dòng
        resultScreen.classList.remove('hidden');
        gameUI.style.display = 'none';
    }

    function passTurn() {
        if (!gameActive) return;

        if (lastMoveWasPass) {
            // Tính điểm khi cả 2 cùng bỏ lượt
            const { blackTerritory, whiteTerritory } = calculateScore();
            const komi = 6.5;
            
            // Tổng điểm = Đất + Tù binh (+ Komi cho Trắng)
            const blackScore = blackTerritory + capturedStones.black;
            const whiteScore = whiteTerritory + capturedStones.white + komi;

            let msg = `
            <div class="result-breakdown">
                <div class="result-player-score">
                    <h3>⚫ Đen</h3>
                    <ul>
                        <li>Đất: <span>${blackTerritory}</span></li>
                        <li>Tù binh: <span>${capturedStones.black}</span></li>
                        <li style="border-top: 1px solid #475569; margin-top: 5px; padding-top: 5px;"><strong>Tổng:</strong> <span>${blackScore}</span></li>
                    </ul>
                </div>
                <div class="result-player-score">
                    <h3>⚪ Trắng</h3>
                    <ul>
                        <li>Đất: <span>${whiteTerritory}</span></li>
                        <li>Tù binh: <span>${capturedStones.white}</span></li>
                        <li>Komi: <span>${komi}</span></li>
                        <li style="border-top: 1px solid #475569; margin-top: 5px; padding-top: 5px;"><strong>Tổng:</strong> <span>${whiteScore}</span></li>
                    </ul>
                </div>
            </div>`;
            
            const winnerMsg = blackScore > whiteScore 
                ? `<div class="winner-message black">Đen Thắng! 🎉</div>` 
                : `<div class="winner-message white">Trắng Thắng! 🎉</div>`;

            endGame("Kết Quả Chung Cuộc", msg + winnerMsg);
            return;
        }

        lastMoveWasPass = true;
        currentPlayer = (currentPlayer === 'black') ? 'white' : 'black';
        updateTimerUI(); // Cập nhật visual active cho đồng hồ

        if (gameMode === 'pve' && currentPlayer === 'white' && gameActive) {
            setTimeout(botMove, 500);
        }
    }

    // === RENDERING ===
    function createBoard() {
        boardElement.innerHTML = '';
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const intersection = document.createElement('div');
                intersection.classList.add('intersection');
                intersection.dataset.row = row;
                intersection.dataset.col = col;

                if (row === 0) intersection.classList.add('top');
                if (row === SIZE - 1) intersection.classList.add('bottom');
                if (col === 0) intersection.classList.add('left');
                if (col === SIZE - 1) intersection.classList.add('right');

                if (starPoints.includes(row) && starPoints.includes(col)) {
                    const star = document.createElement('div');
                    star.classList.add('star-point');
                    intersection.appendChild(star);
                }

                intersection.addEventListener('click', handleIntersectionClick);
                boardElement.appendChild(intersection);
            }
        }
    }

    function renderBoard() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const intersection = boardElement.querySelector(`[data-row='${r}'][data-col='${c}']`);
                const stoneEl = intersection.querySelector('.stone');
                if (boardState[r][c] && !stoneEl) {
                    placeStone(intersection, boardState[r][c]);
                } else if (!boardState[r][c] && stoneEl) {
                    stoneEl.remove();
                }
            }
        }
    }

    function placeStone(intersection, player) {
        const stone = document.createElement('div');
        stone.classList.add('stone', player);
        intersection.appendChild(stone);
    }

    // === TIMER LOGIC ===
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameActive) return;
            timeLeft[currentPlayer]--;
            updateTimerDisplay(currentPlayer);
            if (timeLeft[currentPlayer] <= 0) {
                const winner = currentPlayer === 'black' ? 'Trắng' : 'Đen';
                endGame('Hết giờ!', `${winner} thắng do đối thủ hết thời gian.`);
            }
        }, 1000);
    }

    function updateTimerDisplay(player) {
        const el = player === 'black' ? timerBEl : timerWEl;
        const minutes = Math.floor(timeLeft[player] / 60).toString().padStart(2, '0');
        const seconds = (timeLeft[player] % 60).toString().padStart(2, '0');
        // Hiển thị thêm số quân bắt được trong ô thời gian
        // Fix: Hiển thị đúng số quân mà người chơi hiện tại đã bắt được
        const capturedCount = capturedStones[player];
        el.innerHTML = `<div class="player-title">${player === 'black' ? 'Đen' : 'Trắng'} (Bắt: ${capturedCount})</div><div class="time-val">${minutes}:${seconds}</div>`;
    }

    function updateTimerUI() {
        timerBEl.classList.toggle('active', currentPlayer === 'black');
        timerWEl.classList.toggle('active', currentPlayer === 'white');
    }

    // === MOVE HANDLING ===
    function handleIntersectionClick(event) {
        if (!gameActive || (gameMode === 'pve' && currentPlayer === 'white')) return;

        const intersection = event.currentTarget;
        const row = parseInt(intersection.dataset.row);
        const col = parseInt(intersection.dataset.col);

        makeMove(row, col);
    }

    function makeMove(row, col) {
        if (boardState[row][col] !== '') return false;
        if (koInfo && koInfo.row === row && koInfo.col === col) {
            console.log("Nước đi không hợp lệ: Luật Ko!");
            return false;
        }

        const tempBoard = boardState.map(r => [...r]);
        tempBoard[row][col] = currentPlayer;

        const opponent = (currentPlayer === 'black') ? 'white' : 'black';
        let capturedAny = false;
        let capturedForKo = [];

        // Kiểm tra và bắt quân đối phương
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = row + dr, nc = col + dc;
            if (isValid(nr, nc) && tempBoard[nr][nc] === opponent) {
                const group = findGroupInfo(nr, nc, tempBoard);
                if (group.liberties.size === 0) {
                    capturedAny = true;
                    if (group.stones.length === 1) capturedForKo.push(group.stones[0]);
                    for (const stone of group.stones) {
                        tempBoard[stone.r][stone.c] = '';
                        capturedStones[currentPlayer]++;
                    }
                }
            }
        }

        // Kiểm tra tự sát
        const ownGroup = findGroupInfo(row, col, tempBoard);
        if (ownGroup.liberties.size === 0) {
            console.log("Nước đi không hợp lệ: Tự sát!");
            capturedStones[currentPlayer] -= capturedForKo.length; // Hoàn lại điểm nếu nước đi không hợp lệ
            return false;
        }

        // Cập nhật trạng thái bàn cờ
        boardState = tempBoard;

        // Xử lý luật Ko: nếu bắt 1 quân, cấm đối phương đi lại ngay vào vị trí đó
        if (capturedAny && capturedForKo.length === 1 && ownGroup.stones.length === 1) {
            koInfo = { row: capturedForKo[0].r, col: capturedForKo[0].c };
        } else {
            koInfo = null;
        }

        lastMoveWasPass = false;
        currentPlayer = opponent;

        renderBoard();
        updateTimerDisplay('black'); // Cập nhật để hiển thị số quân bắt mới
        updateTimerDisplay('white');
        updateTimerUI();

        if (gameMode === 'pve' && currentPlayer === 'white' && gameActive) {
            setTimeout(botMove, 500);
        }
        return true;
    }

    // === RULE LOGIC ===
    function findGroupInfo(r, c, board) {
        const player = board[r][c];
        if (player === '') return { stones: [], liberties: new Set() };

        const q = [{ r, c }];
        const visited = new Set([`${r},${c}`]);
        const stones = [];
        const liberties = new Set();

        while (q.length > 0) {
            const { r: curR, c: curC } = q.shift();
            stones.push({ r: curR, c: curC });

            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = curR + dr, nc = curC + dc;
                const key = `${nr},${nc}`;

                if (!isValid(nr, nc) || visited.has(key)) continue;

                if (board[nr][nc] === player) {
                    visited.add(key);
                    q.push({ r: nr, c: nc });
                } else if (board[nr][nc] === '') {
                    liberties.add(key);
                }
            }
        }
        return { stones, liberties };
    }

    function isValid(r, c) {
        return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
    }

    // === BOT AI LOGIC ===
    function botMove() {
        if (!gameActive) return;

        const botPlayer = 'white';
        let bestMove = null;
        let maxCaptured = -1;

        const possibleMoves = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (boardState[r][c] === '') {
                    possibleMoves.push({ r, c });
                }
            }
        }
        possibleMoves.sort(() => Math.random() - 0.5); // Xáo trộn để các nước đi ngẫu nhiên hơn

        for (const move of possibleMoves) {
            // Bỏ qua nếu vi phạm luật Ko
            if (koInfo && koInfo.row === move.r && koInfo.col === move.c) continue;

            // Thử đi một nước
            const tempBoard = boardState.map(r => [...r]);
            tempBoard[move.r][move.c] = botPlayer;
            let capturedCount = 0;
            let isSuicide = false;

            // Kiểm tra bắt quân
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = move.r + dr, nc = move.c + dc;
                if (isValid(nr, nc) && tempBoard[nr][nc] === 'black') {
                    const group = findGroupInfo(nr, nc, tempBoard);
                    if (group.liberties.size === 0) {
                        capturedCount += group.stones.length;
                    }
                }
            }

            // Kiểm tra tự sát
            if (capturedCount === 0) {
                const ownGroup = findGroupInfo(move.r, move.c, tempBoard);
                if (ownGroup.liberties.size === 0) {
                    isSuicide = true;
                }
            }

            if (!isSuicide) {
                // Ưu tiên nước đi bắt được nhiều quân nhất
                if (capturedCount > maxCaptured) {
                    maxCaptured = capturedCount;
                    bestMove = move;
                }
            }
        }

        if (bestMove) {
            makeMove(bestMove.r, bestMove.c);
        } else {
            // Nếu không tìm thấy nước đi hợp lệ nào, bỏ lượt
            passTurn();
        }
    }

    // === SCORING LOGIC (Tính điểm) ===
    function calculateScore() {
        let blackTerritory = 0;
        let whiteTerritory = 0;
        const visited = new Set();

        // Duyệt qua từng ô trên bàn cờ
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                // Nếu gặp ô trống chưa được kiểm tra
                if (boardState[r][c] === '' && !visited.has(`${r},${c}`)) {
                    const region = getRegion(r, c);
                    region.points.forEach(p => visited.add(`${p.r},${p.c}`));
                    
                    // Nếu vùng trống chỉ tiếp xúc với quân Đen -> Đất của Đen
                    if (region.blackBorder && !region.whiteBorder) {
                        blackTerritory += region.points.length;
                    } 
                    // Nếu vùng trống chỉ tiếp xúc với quân Trắng -> Đất của Trắng
                    else if (region.whiteBorder && !region.blackBorder) {
                        whiteTerritory += region.points.length;
                    }
                    // Nếu tiếp xúc cả 2 (vùng trung lập/Dame) -> Không ai có điểm
                }
            }
        }
        return { blackTerritory, whiteTerritory };
    }

    // Thuật toán loang (Flood Fill) để tìm vùng đất trống liền kề
    function getRegion(startR, startC) {
        const points = [];
        const q = [{r: startR, c: startC}];
        const visitedInRegion = new Set([`${startR},${startC}`]);
        let blackBorder = false;
        let whiteBorder = false;

        while (q.length > 0) {
            const {r, c} = q.shift();
            points.push({r, c});

            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const nr = r + dr, nc = c + dc;
                if (isValid(nr, nc)) {
                    const stone = boardState[nr][nc];
                    if (stone === '') {
                        if (!visitedInRegion.has(`${nr},${nc}`)) {
                            visitedInRegion.add(`${nr},${nc}`);
                            q.push({r: nr, c: nc});
                        }
                    } else if (stone === 'black') {
                        blackBorder = true;
                    } else if (stone === 'white') {
                        whiteBorder = true;
                    }
                }
            }
        }
        return { points, blackBorder, whiteBorder };
    }

    // --- INITIALIZATION ---
    // Bắt đầu với màn hình menu, hoặc reset game nếu các element không tồn tại
    if (startScreen) {
        startScreen.classList.remove('hidden');
        if (gameUI) gameUI.style.display = 'none';
    } else {
        resetGame();
    }
});