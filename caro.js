document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const startScreen = document.getElementById('start-screen');
    const gameUI = document.getElementById('game-ui');
    const timerXEl = document.getElementById('timer-x');
    const timerOEl = document.getElementById('timer-o');
    const scoreXEl = document.getElementById('score-x-display');
    const scoreOEl = document.getElementById('score-o-display');
    const timeInput = document.getElementById('time-limit');
    
    // Buttons
    const btnPvE = document.getElementById('btn-pve');
    const btnPvP = document.getElementById('btn-pvp');
    const btnRestart = document.getElementById('btn-restart');
    const btnMenu = document.getElementById('btn-menu');

    // In-game Menu Elements
    const inGameMenu = document.getElementById('ingame-menu');
    const btnSurrender = document.getElementById('btn-surrender');
    const btnQuit = document.getElementById('btn-quit');
    const btnCloseMenu = document.getElementById('btn-close-menu');

    // Result Screen Elements
    const resultScreen = document.getElementById('result-screen');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const btnResultRestart = document.getElementById('btn-result-restart');
    const btnResultMenu = document.getElementById('btn-result-menu');
    const btnGuide = document.getElementById('btn-guide');
    const guideScreen = document.getElementById('guide-screen');
    const btnCloseGuide = document.getElementById('btn-close-guide');

    const size = 15; // Nâng cấp lên 15x15
    let currentPlayer = 'X';
    let gameActive = true;
    let gameMode = 'pvp'; // 'pvp' hoặc 'pve'
    let botDifficulty = 1; // Bậc độ khó của Bot, từ 1-10
    let score = { 'X': 0, 'O': 0 };
    const cells = []; // Mảng lưu trữ trạng thái các ô
    
    // Timer variables
    let timeLimit = 300; // Mặc định 5 phút (giây)
    let timeLeft = { 'X': 300, 'O': 300 };
    let timerInterval = null;

    // Tạo bàn cờ 15x15
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        board.appendChild(cell);
        cells.push(''); // Khởi tạo ô trống
    }

    // --- EVENT LISTENERS ---
    btnPvP.addEventListener('click', () => startGame('pvp'));
    btnPvE.addEventListener('click', () => startGame('pve'));
    btnRestart.addEventListener('click', resetGame);
    
    // Menu Button Logic
    btnResultRestart.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        gameUI.style.display = 'flex';
        resetGame();
    });

    btnResultMenu.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        window.parent.postMessage('exit-game', '*');
    });

    btnMenu.addEventListener('click', () => {
        // Tạm dừng game bằng cách dừng đồng hồ đếm ngược
        clearInterval(timerInterval);
        inGameMenu.classList.remove('hidden');
    });

    if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => {
        // Tiếp tục game bằng cách khởi động lại đồng hồ
        if (gameActive && !timerInterval) startTimer(); // Chỉ start nếu chưa chạy
        inGameMenu.classList.add('hidden');
    });
    
    btnSurrender.addEventListener('click', () => {
        inGameMenu.classList.add('hidden');
        gameActive = false;
        clearInterval(timerInterval);
        const winner = currentPlayer === 'X' ? 'O' : 'X';
        score[winner]++;
        updateScoreDisplay();
        setTimeout(() => {
            const scoreMsg = `<br><br>Tỉ số: X ${score['X']} - O ${score['O']}`;
            showEndGame('Kết Thúc', `Người chơi ${currentPlayer} đã đầu hàng! ${winner} thắng!${scoreMsg}`);
        }, 100);
    });

    btnQuit.addEventListener('click', () => {
        // Gửi thông điệp về cho app chính để quay lại menu game
        inGameMenu.classList.add('hidden');
        gameActive = false;
        clearInterval(timerInterval);
        // showMenu(); // This would show the caro menu, not the main app menu
        window.parent.postMessage('exit-game', '*');
    });

    // Guide Logic
    if (btnGuide) btnGuide.addEventListener('click', () => guideScreen.classList.remove('hidden'));
    if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => guideScreen.classList.add('hidden'));

    function updateScoreDisplay() {
        if (scoreXEl && scoreOEl) {
            scoreXEl.textContent = score['X'];
            scoreOEl.textContent = score['O'];
        }
    }

    function showEndGame(title, message) {
        resultTitle.textContent = title;
        resultMessage.innerHTML = message; // Đổi sang innerHTML để hỗ trợ định dạng
        resultScreen.classList.remove('hidden');
        gameUI.style.display = 'none';
    }

    function startGame(mode) {
        // Lấy thời gian từ input (giới hạn 1-15 phút)
        let minutes = parseInt(timeInput.value);
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 15) minutes = 15;
        timeLimit = minutes * 60;
        
        gameMode = mode;
        startScreen.classList.add('hidden');
        gameUI.style.display = 'flex';
        resetGame();
        startTimer(); // Bắt đầu đếm giờ
    }

    function handleCellClick(e) {
        const cell = e.target;
        const index = parseInt(cell.dataset.index);

        // Nếu ô đã đánh, game kết thúc, hoặc đang lượt Bot (trong chế độ PvE) thì chặn click
        if (cells[index] !== '' || !gameActive || (gameMode === 'pve' && currentPlayer === 'O')) return;

        makeMove(index, currentPlayer);
    }

    function makeMove(index, player) {
        const cell = board.children[index];
        cells[index] = player;
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());

        // Kiểm tra thắng thua
        if (checkWin(index, player)) {
            gameActive = false;
            clearInterval(timerInterval);
            score[player]++;
            // Nếu người chơi thắng Bot, tăng độ khó
            if (player === 'X' && gameMode === 'pve' && botDifficulty < 10) {
                botDifficulty++;
            }
            updateScoreDisplay();
            const scoreMsg = `<br><br>Tỉ số: X ${score['X']} - O ${score['O']}`;
            const msg = player === 'X' ? "Bạn đã thắng! 🎉" : (gameMode === 'pve' ? "Bot đã thắng! 🤖" : "Người chơi O thắng!");
            setTimeout(() => {
                showEndGame('Chiến Thắng!', msg + scoreMsg);
            }, 100);
            return;
        }

        // Kiểm tra hòa
        if (!cells.includes('')) {
            gameActive = false;
            setTimeout(() => {
                // Luật hoà: Ai ít thời gian hơn thì thua
                let winner = null;
                let msg = "Bàn cờ đã đầy! ";
                if (timeLeft['X'] > timeLeft['O']) {
                    winner = 'X';
                    // Nếu người chơi thắng Bot, tăng độ khó
                    if (gameMode === 'pve' && botDifficulty < 10) {
                        botDifficulty++;
                    }
                    msg += "X thắng do còn nhiều thời gian hơn!";
                } else if (timeLeft['O'] > timeLeft['X']) {
                    winner = 'O';
                    msg += "O thắng do còn nhiều thời gian hơn!";
                } else {
                    msg += "Hai bên hoà nhau (thời gian bằng nhau)!";
                }
                if (winner) { score[winner]++; updateScoreDisplay(); }
                const scoreMsg = `<br><br>Tỉ số: X ${score['X']} - O ${score['O']}`;
                showEndGame('Hòa Cờ', msg + scoreMsg);
            }, 100);
            return;
        }

        // Đổi lượt
        currentPlayer = player === 'X' ? 'O' : 'X';
        updateTimerUI(); // Cập nhật visual active

        // Nếu là chế độ PvE và đến lượt O (Bot)
        if (gameMode === 'pve' && currentPlayer === 'O' && gameActive) {
            setTimeout(botMove, 500); // Delay chút cho tự nhiên
        }
    }

    // --- TIMER LOGIC ---
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameActive) return;

            timeLeft[currentPlayer]--;
            updateTimerDisplay(currentPlayer);

            if (timeLeft[currentPlayer] <= 0) {
                gameActive = false;
                clearInterval(timerInterval);
                const winner = currentPlayer === 'X' ? 'O' : 'X';
                if (winner === 'X' && gameMode === 'pve' && botDifficulty < 10) {
                    botDifficulty++;
                }
                score[winner]++;
                updateScoreDisplay();
                const scoreMsg = `<br><br>Tỉ số: X ${score['X']} - O ${score['O']}`;
                showEndGame('Hết Giờ!', `Người chơi ${currentPlayer} đã hết thời gian! ${winner} thắng!${scoreMsg}`);
            }
        }, 1000);
    }

    function updateTimerUI() {
        // Highlight đồng hồ đang chạy
        if (currentPlayer === 'X') {
            timerXEl.classList.add('active');
            timerOEl.classList.remove('active');
        } else {
            timerOEl.classList.add('active');
            timerXEl.classList.remove('active');
        }
    }

    function updateTimerDisplay(player) {
        const minutes = Math.floor(timeLeft[player] / 60);
        const seconds = timeLeft[player] % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const html = `
            <div class="player-title">Phe ${player}</div>
            <div class="time-val">${timeStr}</div>
        `;
        
        if (player === 'X') {
            timerXEl.innerHTML = html;
        } else {
            timerOEl.innerHTML = html;
        }
    }

    // --- BOT AI LOGIC (MINIMAX) ---

    /**
     * Bot thực hiện nước đi.
     * - Độ khó sẽ quyết định độ sâu tìm kiếm của thuật toán Minimax.
     * - Càng sâu, Bot càng "nhìn xa" và đưa ra quyết định tốt hơn.
     */
    function botMove() {
        // Xác định độ sâu tìm kiếm dựa trên độ khó
        let depth = 1;
        if (botDifficulty >= 4) depth = 2;
        if (botDifficulty >= 8) depth = 3; // Độ sâu 3 đã khá nặng cho JS, giới hạn ở đây

        // Xử lý nước đi đầu tiên của Bot
        const allEmptyCells = cells.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        if (allEmptyCells.length >= size * size - 1) {
            const center = Math.floor(size * size / 2);
            if (cells[center] === '') {
                makeMove(center, 'O');
            } else { // Nếu người chơi đánh vào giữa, Bot đánh cạnh
                makeMove(center + 1, 'O');
            }
            return;
        }

        // Bắt đầu tìm nước đi tốt nhất
        let bestMove = -1;
        let bestScore = -Infinity;
        const candidateMoves = getAvailableMoves();

        for (const move of candidateMoves) {
            cells[move] = 'O'; // Thử đi
            const score = minimax(depth, false, -Infinity, Infinity);
            cells[move] = ''; // Hoàn tác

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        if (bestMove !== -1) makeMove(bestMove, 'O');
    }

    /**
     * Thuật toán Minimax với cắt tỉa Alpha-Beta.
     * @param {number} depth Độ sâu còn lại để tìm kiếm.
     * @param {boolean} isMaximizing Người chơi hiện tại đang tối đa hóa điểm (Bot) hay tối thiểu hóa (Người chơi).
     * @param {number} alpha Giá trị tốt nhất cho người chơi tối đa.
     * @param {number} beta Giá trị tốt nhất cho người chơi tối thiểu.
     * @returns {number} Điểm số của bàn cờ.
     */
    function minimax(depth, isMaximizing, alpha, beta) {
        const score = evaluateBoard();
        // Nếu tìm thấy nước đi chiến thắng/thua hoặc hết độ sâu tìm kiếm
        if (Math.abs(score) >= 10000000 || depth === 0) {
            return score;
        }
        
        const candidateMoves = getAvailableMoves();
        if (candidateMoves.length === 0) return 0;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of candidateMoves) {
                cells[move] = 'O';
                const evaluation = minimax(depth - 1, false, alpha, beta);
                cells[move] = '';
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of candidateMoves) {
                cells[move] = 'X';
                const evaluation = minimax(depth - 1, true, alpha, beta);
                cells[move] = '';
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * Lấy danh sách các nước đi tiềm năng (các ô trống cạnh các ô đã đánh).
     * Việc này giúp giới hạn không gian tìm kiếm, tăng tốc độ AI.
     */
    function getAvailableMoves() {
        const moves = new Set();
        for (let i = 0; i < cells.length; i++) {
            if (cells[i] === '') continue;
            const r = Math.floor(i / size), c = i % size;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size && cells[nr * size + nc] === '') {
                        moves.add(nr * size + nc);
                    }
                }
            }
        }
        return moves.size > 0 ? Array.from(moves) : [];
    }

    /**
     * Hàm lượng giá bàn cờ bằng cách quét các "cửa sổ" 5 ô.
     * Đây là phương pháp hiệu quả để nhận dạng các mẫu và mối đe dọa.
     */
    function evaluateBoard() {
        let totalScore = 0;
        const WINDOW_SIZE = 5;

        // Duyệt ngang
        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= size - WINDOW_SIZE; c++) {
                const window = [];
                for (let i = 0; i < WINDOW_SIZE; i++) window.push(cells[r * size + c + i]);
                totalScore += evaluateWindow(window);
            }
        }

        // Duyệt dọc
        for (let c = 0; c < size; c++) {
            for (let r = 0; r <= size - WINDOW_SIZE; r++) {
                const window = [];
                for (let i = 0; i < WINDOW_SIZE; i++) window.push(cells[(r + i) * size + c]);
                totalScore += evaluateWindow(window);
            }
        }

        // Duyệt chéo \
        for (let r = 0; r <= size - WINDOW_SIZE; r++) {
            for (let c = 0; c <= size - WINDOW_SIZE; c++) {
                const window = [];
                for (let i = 0; i < WINDOW_SIZE; i++) window.push(cells[(r + i) * size + (c + i)]);
                totalScore += evaluateWindow(window);
            }
        }

        // Duyệt chéo /
        for (let r = 0; r <= size - WINDOW_SIZE; r++) {
            for (let c = WINDOW_SIZE - 1; c < size; c++) {
                const window = [];
                for (let i = 0; i < WINDOW_SIZE; i++) window.push(cells[(r + i) * size + (c - i)]);
                totalScore += evaluateWindow(window);
            }
        }

        return totalScore;
    }

    /**
     * Tính điểm cho một "cửa sổ" 5 ô.
     * Điểm dương là lợi cho Bot (O), điểm âm là lợi cho người chơi (X).
     */
    function evaluateWindow(window) {
        let score = 0;
        const botPieces = window.filter(p => p === 'O').length;
        const playerPieces = window.filter(p => p === 'X').length;
        const emptyCells = window.filter(p => p === '').length;

        // Bỏ qua cửa sổ có cả 2 người chơi vì không thể tạo thành hàng 5
        if (botPieces > 0 && playerPieces > 0) return 0;

        if (botPieces > 0) { // Điểm tấn công của Bot
            if (botPieces === 5) score += 10000000; // Thắng
            else if (botPieces === 4 && emptyCells === 1) score += 100000; // Nước 4
            else if (botPieces === 3 && emptyCells === 2) score += 5000;  // Nước 3 mở
            else if (botPieces === 2 && emptyCells === 3) score += 500;   // Nước 2 mở
        } else if (playerPieces > 0) { // Điểm phòng thủ (chặn người chơi)
            if (playerPieces === 5) score -= 10000000; // Thua
            else if (playerPieces === 4 && emptyCells === 1) score -= 500000; // **Phải chặn ngay**
            else if (playerPieces === 3 && emptyCells === 2) score -= 10000; // **Rất nguy hiểm, cần chặn**
            else if (playerPieces === 2 && emptyCells === 3) score -= 1000;  // Cần để ý
        }

        return score;
    }

    function checkWin(index, player) {
        const row = Math.floor(index / size);
        const col = index % size;
        const opponent = player === 'X' ? 'O' : 'X';

        // Các hướng kiểm tra: Ngang, Dọc, Chéo chính, Chéo phụ
        const directions = [
            [0, 1],  // Ngang
            [1, 0],  // Dọc
            [1, 1],  // Chéo chính (\)
            [1, -1]  // Chéo phụ (/)
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            
            // Đếm về phía trước
            let forward_steps = 0;
            for (let i = 1; i < 5; i++) {
                const r = row + i * dx;
                const c = col + i * dy;
                if (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === player) {
                    forward_steps++;
                } else {
                    break;
                }
            }

            // Đếm về phía sau
            let backward_steps = 0;
            for (let i = 1; i < 5; i++) {
                const r = row - i * dx;
                const c = col - i * dy;
                if (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === player) {
                    backward_steps++;
                } else {
                    break;
                }
            }

            count += forward_steps + backward_steps;

            if (count < 5) continue;

            // Kiểm tra chặn 2 đầu
            let blockedEnds = 0;
            // Ô ngay sau chuỗi phía trước
            const r1 = row + (forward_steps + 1) * dx;
            const c1 = col + (forward_steps + 1) * dy;
            // Ô ngay sau chuỗi phía sau
            const r2 = row - (backward_steps + 1) * dx;
            const c2 = col - (backward_steps + 1) * dy;

            if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size || cells[r1 * size + c1] === opponent) {
                blockedEnds++;
            }
            if (r2 < 0 || r2 >= size || c2 < 0 || c2 >= size || cells[r2 * size + c2] === opponent) {
                blockedEnds++;
            }

            // Thắng nếu có trên 5 quân (không quan tâm chặn), hoặc đúng 5 quân mà không bị chặn 2 đầu
            if (count > 5) return true;
            if (count === 5 && blockedEnds < 2) return true;
        }
        return false;
    }

    function resetGame() {
        cells.fill('');
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        currentPlayer = 'X';
        gameActive = true;
        
        // Reset Timer
        timeLeft = { 'X': timeLimit, 'O': timeLimit };
        updateTimerDisplay('X');
        updateTimerDisplay('O');
        updateTimerUI();
        clearInterval(timerInterval);
        if (!startScreen.classList.contains('hidden')) return; // Nếu đang ở menu thì chưa chạy timer
        startTimer();
    }
});