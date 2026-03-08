document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const boardElement = document.getElementById('game-board');
    const decorationsElement = document.getElementById('board-decorations');
    const startScreen = document.getElementById('start-screen');
    const gameUI = document.getElementById('game-ui');
    const timerREl = document.getElementById('timer-r');
    const timerBEl = document.getElementById('timer-b');
    const btnPvE = document.getElementById('btn-pve');
    const btnPvP = document.getElementById('btn-pvp');
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
    const PIECES = {
        'K': '帥', 'A': '仕', 'E': '相', 'H': '傌', 'R': '俥', 'C': '炮', 'P': '兵', // Red
        'k': '將', 'a': '士', 'e': '象', 'h': '馬', 'r': '車', 'c': '砲', 'p': '卒'  // Black
    };
    const PIECE_VALUES = { 'p': 10, 'c': 45, 'h': 40, 'r': 90, 'e': 20, 'a': 20, 'k': 10000 };
    const INITIAL_BOARD = () => [
        ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'],
        ['', '', '', '', '', '', '', '', ''],
        ['', 'c', '', '', '', '', '', 'c', ''],
        ['p', '', 'p', '', 'p', '', 'p', '', 'p'],
        ['', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', ''],
        ['P', '', 'P', '', 'P', '', 'P', '', 'P'],
        ['', 'C', '', '', '', '', '', 'C', ''],
        ['', '', '', '', '', '', '', '', ''],
        ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R']
    ];
    const ROWS = 10, COLS = 9;
    let timeLimit = 300; // 5 minutes, default

    // === AI EVALUATION (Piece-Square Tables) ===
    // Bảng điểm được định nghĩa cho quân Đỏ (Red). Quân Đen sẽ dùng bảng lật ngược theo chiều dọc.
    const PST = {
        'p': [ // Tốt (Soldier)
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 3, 3, 3, 0, 0, 0],
            [0, 0, 0, 5, 5, 5, 0, 0, 0],
            [0, 0, 0, 7, 7, 7, 0, 0, 0],
            [0, 0, 0, 9, 9, 9, 0, 0, 0], // Sông
            [9, 9, 9, 11, 13, 11, 9, 9, 9],
            [9, 9, 9, 11, 13, 11, 9, 9, 9],
            [10, 10, 10, 12, 12, 12, 10, 10, 10],
            [10, 10, 10, 12, 12, 12, 10, 10, 10],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'h': [ // Mã (Horse)
            [0, -3, 0, 0, 0, 0, 0, -3, 0],
            [0, 0, 4, 6, 8, 6, 4, 0, 0],
            [0, 4, 8, 10, 12, 10, 8, 4, 0],
            [0, 6, 10, 12, 14, 12, 10, 6, 0],
            [4, 8, 12, 14, 16, 14, 12, 8, 4],
            [4, 8, 10, 12, 14, 12, 10, 8, 4],
            [0, 6, 8, 10, 12, 10, 8, 6, 0],
            [0, 4, 6, 8, 10, 8, 6, 4, 0],
            [0, 0, 2, 4, 6, 4, 2, 0, 0],
            [-5, -3, 0, 0, 0, 0, 0, -3, -5]
        ],
        'r': [ // Xe (Chariot)
            [0, 0, 6, 6, 6, 6, 6, 0, 0],
            [2, 2, 6, 12, 12, 12, 6, 2, 2],
            [2, 2, 6, 12, 16, 12, 6, 2, 2],
            [4, 4, 8, 14, 18, 14, 8, 4, 4],
            [6, 6, 10, 16, 20, 16, 10, 6, 6],
            [6, 6, 10, 16, 20, 16, 10, 6, 6],
            [4, 4, 8, 14, 18, 14, 8, 4, 4],
            [2, 2, 6, 12, 16, 12, 6, 2, 2],
            [2, 2, 6, 12, 12, 12, 6, 2, 2],
            [0, 0, 6, 6, 6, 6, 6, 0, 0]
        ],
        'c': [ // Pháo (Cannon)
            [0, 0, 1, 2, 2, 2, 1, 0, 0],
            [0, 0, 1, 2, 3, 2, 1, 0, 0],
            [0, 0, 1, 3, 4, 3, 1, 0, 0],
            [0, 0, 2, 4, 5, 4, 2, 0, 0],
            [0, 0, 2, 4, 5, 4, 2, 0, 0],
            [0, 0, 1, 3, 4, 3, 1, 0, 0],
            [1, 2, 3, 4, 5, 4, 3, 2, 1],
            [1, 1, 1, 2, 2, 2, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, -1, -1, -1, 0, 0, 0]
        ],
        // Sĩ, Tượng, Tướng có vị trí rất hạn chế, PST đơn giản hơn
        'a': [ [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,1,0,1,0,0,0], [0,0,0,0,2,0,0,0,0], [0,0,0,1,0,1,0,0,0] ],
        'e': [ [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,2,0,0,0,2,0,0], [0,0,0,0,0,0,0,0,0], [1,0,0,0,1,0,0,0,1], [0,0,0,0,0,0,0,0,0] ],
        'k': [ [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,1,1,1,0,0,0], [0,0,0,2,2,2,0,0,0], [0,0,0,1,1,1,0,0,0] ]
    };

    // === GAME STATE ===
    let boardState, currentPlayer, gameMode, gameActive, selectedPoint, legalMoves, generalInCheck, timeLeft, timerInterval;
    let score = { 'r': 0, 'b': 0 };
    let botDifficulty = 1; // 1: Dễ, 2: Trung bình, 3: Khó, 4: Siêu khó

    // === EVENT LISTENERS ===
    btnPvP.addEventListener('click', () => startGame('pvp'));
    btnPvE.addEventListener('click', () => startGame('pve'));
    btnRestart.addEventListener('click', resetGame);
    btnMenu.addEventListener('click', () => inGameMenu.classList.remove('hidden'));
    btnQuit.addEventListener('click', () => window.parent.postMessage('exit-game', '*'));
    btnResultMenu.addEventListener('click', () => window.parent.postMessage('exit-game', '*'));
    btnResultRestart.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        gameUI.style.display = 'flex';
        resetGame();
    });
    btnSurrender.addEventListener('click', () => {
        if (!gameActive) return;
        inGameMenu.classList.add('hidden');
        const winner = currentPlayer === 'r' ? 'Đen' : 'Đỏ';
        const winnerCode = currentPlayer === 'r' ? 'b' : 'r';
        const loser = currentPlayer === 'r' ? 'Đỏ' : 'Đen';
        score[winnerCode]++;
        endGame(`${winner} thắng!`, `Quân ${loser} đã đầu hàng.`);
    });
    boardElement.addEventListener('click', handlePointClick);
    if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => inGameMenu.classList.add('hidden'));

    // Guide Logic
    if (btnGuide) btnGuide.addEventListener('click', () => guideScreen.classList.remove('hidden'));
    if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => guideScreen.classList.add('hidden'));

    // === CORE GAME FLOW ===
    function startGame(mode) {
        const timeInput = document.getElementById('time-limit');
        let minutes = parseInt(timeInput.value);
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 30) minutes = 30;
        timeLimit = minutes * 60;

        gameMode = mode;
        startScreen.classList.add('hidden');
        gameUI.style.display = 'flex';
        resetGame();
    }

    function resetGame() {
        boardState = INITIAL_BOARD();
        currentPlayer = 'r'; // Red moves first
        gameActive = true;
        selectedPoint = null;
        legalMoves = [];
        generalInCheck = null;
        
        clearInterval(timerInterval);
        timeLeft = { 'r': timeLimit, 'b': timeLimit };
        updateTimerDisplay('r');
        updateTimerDisplay('b');
        startTimer();

        renderBoard();
    }

    function handlePointClick(event) {
        if (!gameActive || (gameMode === 'pve' && currentPlayer === 'b')) return;

        const point = event.target.closest('.point');
        if (!point) return;

        const row = parseInt(point.dataset.row);
        const col = parseInt(point.dataset.col);

        if (selectedPoint) {
            const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
            if (move) {
                makeMove(move);
            } else {
                selectedPoint = null;
                legalMoves = [];
                renderBoard(); // Deselect
            }
        } else {
            const piece = boardState[row][col];
            // Chỉ cho phép chọn quân cờ của người chơi hiện tại
            if (piece && getPieceColor(piece) === currentPlayer) {
                selectedPoint = { row, col };
                legalMoves = getLegalMovesForPiece(row, col);
                renderBoard();
            }
        }
    }

    function makeMove(move) {
        const { from, to } = move;
        const piece = boardState[from.row][from.col];

        // Update board
        boardState[to.row][to.col] = piece;
        boardState[from.row][from.col] = '';

        // Switch player and reset selection
        currentPlayer = (currentPlayer === 'r') ? 'b' : 'r';
        selectedPoint = null;
        legalMoves = [];

        // Check for check/checkmate/stalemate
        const generalPos = findGeneral(currentPlayer);
        generalInCheck = generalPos && isSquareAttacked(generalPos.row, generalPos.col, getOpponent(currentPlayer)) ? generalPos : null;

        renderBoard();
        checkGameEnd();

        if (gameActive && gameMode === 'pve' && currentPlayer === 'b') {
            setTimeout(botMove, 500);
        }
    }

    function checkGameEnd() {
        if (!gameActive) return;
        const allMoves = getAllLegalMoves(currentPlayer);
        if (allMoves.length === 0) {
            const winner = getOpponent(currentPlayer);
            const winnerName = winner === 'r' ? 'Đỏ' : 'Đen';
            score[winner]++;
            if (winner === 'r' && gameMode === 'pve' && botDifficulty < 4) {
                botDifficulty++; // Tăng độ khó nếu người chơi thắng, tối đa là 4
            }
            const reason = generalInCheck ? 'Chiếu bí!' : 'Hết nước đi (Stalemate)!';
            endGame(reason, `${winnerName} thắng!`);
        }
    }

    function endGame(title, message) {
        gameActive = false;
        clearInterval(timerInterval);
        resultTitle.textContent = title;
        resultMessage.innerHTML = `${message}<br><br>Tỉ số: Đỏ ${score['r']} - Đen ${score['b']}`;
        resultScreen.classList.remove('hidden');
        gameUI.style.display = 'none';
    }

    // === RENDERING ===
    function renderBoard() {
        boardElement.innerHTML = '';
        decorationsElement.innerHTML = ''; // Clear old decorations

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const point = document.createElement('div');
                point.classList.add('point');
                point.dataset.row = r;
                point.dataset.col = c;

                if (selectedPoint && selectedPoint.row === r && selectedPoint.col === c) point.classList.add('selected');
                if (generalInCheck && generalInCheck.row === r && generalInCheck.col === c) point.classList.add('in-check');

                const piece = boardState[r][c];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece', getPieceColor(piece));
                    pieceElement.textContent = PIECES[piece];
                    point.appendChild(pieceElement);
                }

                const move = legalMoves.find(m => m.to.row === r && m.to.col === c);
                if (move) {
                    if (boardState[r][c]) {
                        point.classList.add('capture-hint');
                    } else {
                        const dot = document.createElement('div');
                        dot.classList.add('valid-move-dot');
                        point.appendChild(dot);
                    }
                }
                boardElement.appendChild(point);
            }
        }
        drawBoardDecorations();
    }

    function drawBoardDecorations() {
        const boardRect = boardElement.getBoundingClientRect();
        // Thêm kiểm tra để tránh lỗi khi board chưa hiển thị
        if (boardRect.width === 0 || boardRect.height === 0) return;

        const cellWidth = boardRect.width / COLS;
        const cellHeight = boardRect.height / ROWS;

        // Vertical lines
        for (let c = 0; c < COLS; c++) {
            const line = document.createElement('div');
            line.className = 'line';
            line.style.left = `${(c + 0.5) * cellWidth}px`;
            line.style.top = `${0.5 * cellHeight}px`;
            line.style.width = '1px';
            line.style.height = `${(ROWS - 1) * cellHeight}px`;
            decorationsElement.appendChild(line);
        }

        // Horizontal lines
        for (let r = 0; r < ROWS; r++) {
            const line = document.createElement('div');
            line.className = 'line';
            line.style.top = `${(r + 0.5) * cellHeight}px`;
            line.style.left = `${0.5 * cellWidth}px`;
            line.style.height = '1px';
            line.style.width = `${(COLS - 1) * cellWidth}px`;
            decorationsElement.appendChild(line);
        }

        // Tô màu cho sông
        const riverFill = document.createElement('div');
        riverFill.style.position = 'absolute';
        riverFill.style.top = `${4.5 * cellHeight}px`;
        riverFill.style.left = 0;
        riverFill.style.width = `${boardRect.width}px`;
        riverFill.style.height = `${cellHeight}px`;
        riverFill.style.backgroundColor = '#c4a883'; // Màu gỗ sẫm hơn, phù hợp với bàn cờ
        decorationsElement.appendChild(riverFill);

        // River
        const createRiverLabel = (text, position) => {
            const label = document.createElement('div');
            label.className = 'river-label';
            label.textContent = text;
            label.style.left = position;
            label.style.transform = 'translate(-50%, -50%)'; // Căn giữa cả ngang và dọc
            decorationsElement.appendChild(label);
        };

        // Tạo hai nhãn riêng biệt, đọc từ phải qua trái theo truyền thống
        createRiverLabel('楚 河', '70%'); // "Sở Hà", dịch vào trong cho cân đối
        createRiverLabel('漢 界', '30%'); // "Hán Giới", dịch vào trong cho cân đối

        // Palaces
        const drawPalace = (topRow) => {
            const x1 = (3 + 0.5) * cellWidth; // Tọa độ X của cột 3
            const x2 = (5 + 0.5) * cellWidth; // Tọa độ X của cột 5
            const y1 = (topRow + 0.5) * cellHeight; // Tọa độ Y của hàng trên cùng của cung
            const y2 = (topRow + 2 + 0.5) * cellHeight; // Tọa độ Y của hàng dưới cùng của cung

            // Hàm trợ giúp để vẽ một đường thẳng giữa hai điểm
            const createLine = (startX, startY, endX, endY) => {
                const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const angleRad = Math.atan2(endY - startY, endX - startX);
                const angleDeg = angleRad * 180 / Math.PI;

                const line = document.createElement('div');
                line.className = 'line';
                line.style.cssText = `
                    position: absolute;
                    left: ${startX}px;
                    top: ${startY}px;
                    width: ${length}px;
                    height: 1px; /* Thêm độ dày cho đường kẻ */
                    transform-origin: 0 0;
                    transform: rotate(${angleDeg}deg);
                `;
                decorationsElement.appendChild(line);
            };

            // Vẽ 2 đường chéo
            createLine(x1, y1, x2, y2); // Đường chéo từ (3, top) đến (5, top+2)
            createLine(x2, y1, x1, y2); // Đường chéo từ (5, top) đến (3, top+2)
        };
        drawPalace(0); // Black palace
        drawPalace(7); // Red palace

        // Markers for Cannons and Soldiers
        const markers = [
            { r: 2, c: 1 }, { r: 2, c: 7 }, // Black Cannons
            { r: 3, c: 0 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8 }, // Black Soldiers
            { r: 6, c: 0 }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8 }, // Red Soldiers
            { r: 7, c: 1 }, { r: 7, c: 7 }  // Red Cannons
        ];

        markers.forEach(pos => {
            const marker = document.createElement('div');
            marker.className = 'marker';
            marker.style.left = `${(pos.c + 0.5) * cellWidth}px`;
            marker.style.top = `${(pos.r + 0.5) * cellHeight}px`;
            decorationsElement.appendChild(marker);
        });
    }

    // === BOT AI (MINIMAX + ALPHA-BETA) ===
    function botMove() {
        // --- 1. "Opening Book" Simulation ---
        // Nếu là nước đi đầu tiên của Bot (còn 31 quân sau khi Đỏ đi),
        // chọn ngẫu nhiên từ một tập các nước khai cuộc mạnh để tăng sự đa dạng.
        const pieceCount = boardState.flat().filter(p => p).length;
        if (pieceCount === 31) {
            const openingMoves = [
                // 1. Pháo đầu (Central Cannon response)
                { from: { row: 2, col: 1 }, to: { row: 2, col: 4 } },
                // 2. Bình phong mã (Screen Horses) - nhảy mã
                { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
                // 3. Mở Pháo còn lại
                { from: { row: 2, col: 7 }, to: { row: 2, col: 6 } },
            ];
            // Lọc ra các nước đi hợp lệ (phòng trường hợp người chơi đi nước cản trở)
            const legalOpeningMoves = openingMoves.filter(openingMove => {
                const legalPieceMoves = getLegalMovesForPiece(openingMove.from.row, openingMove.from.col);
                return legalPieceMoves.some(legalMove => 
                    legalMove.to.row === openingMove.to.row && legalMove.to.col === openingMove.to.col
                );
            });

            if (legalOpeningMoves.length > 0) {
                const move = legalOpeningMoves[Math.floor(Math.random() * legalOpeningMoves.length)];
                setTimeout(() => makeMove(move), 100);
                return; // Thoát sau khi đi nước khai cuộc
            }
        }

        // --- 2. Minimax Search ---
        // Tăng độ sâu tối thiểu để Bot có thể "nhìn" thấy nước trả lời của đối thủ.
        // Điều này giúp Bot tránh được các lỗi cơ bản như đi vào vị trí bị ăn ngay.
        let depth = 2; // Mặc định: Dễ/Trung bình (đủ để thấy nguy hiểm)
        if (botDifficulty === 3) depth = 3; // Khó
        else if (botDifficulty >= 4) depth = 4; // Siêu khó

        setTimeout(() => {
            const bestMove = getBestMove(depth);
            if (bestMove) {
                makeMove(bestMove);
            }
        }, 100);
    }

    function getBestMove(depth) {
        const possibleMoves = getAllLegalMoves('b');
        if (possibleMoves.length === 0) return null;

        possibleMoves.sort((a, b) => (boardState[b.to.row][b.to.col] ? 10 : 0) - (boardState[a.to.row][a.to.col] ? 10 : 0));

        let bestMoves = [];
        let bestValue = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (const move of possibleMoves) {
            const movingPiece = boardState[move.from.row][move.from.col];
            const captured = boardState[move.to.row][move.to.col];
            // Thực hiện nước đi thử
            boardState[move.to.row][move.to.col] = movingPiece;
            boardState[move.from.row][move.from.col] = '';

            const boardValue = minimax(depth - 1, alpha, beta, false);

            // Hoàn tác nước đi
            boardState[move.from.row][move.from.col] = movingPiece;
            boardState[move.to.row][move.to.col] = captured;

            // Nếu tìm thấy nước đi có điểm cao hơn, reset danh sách và cập nhật điểm
            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMoves = [move];
            } else if (boardValue === bestValue) {
                // Nếu có nước đi khác bằng điểm, thêm vào danh sách để lựa chọn ngẫu nhiên
                bestMoves.push(move);
            }

            alpha = Math.max(alpha, boardValue);
            if (beta <= alpha) break;
        }
        
        // Chọn một nước đi ngẫu nhiên từ danh sách các nước đi tốt nhất
        if (bestMoves.length === 0) return possibleMoves[0]; // Fallback
        const randomIndex = Math.floor(Math.random() * bestMoves.length);
        return bestMoves[randomIndex];
    }

    function minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0) return evaluateBoard();

        const moves = getAllLegalMoves(isMaximizing ? 'b' : 'r');
        if (moves.length === 0) return isMaximizing ? -100000 : 100000;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const movingPiece = boardState[move.from.row][move.from.col];
                const captured = boardState[move.to.row][move.to.col];
                // Đi thử
                boardState[move.to.row][move.to.col] = movingPiece;
                boardState[move.from.row][move.from.col] = '';
                
                const eval = minimax(depth - 1, alpha, beta, false);
                // Hoàn tác
                boardState[move.from.row][move.from.col] = movingPiece;
                boardState[move.to.row][move.to.col] = captured;
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const movingPiece = boardState[move.from.row][move.from.col];
                const captured = boardState[move.to.row][move.to.col];
                // Đi thử
                boardState[move.to.row][move.to.col] = movingPiece;
                boardState[move.from.row][move.from.col] = '';

                const eval = minimax(depth - 1, alpha, beta, true);
                // Hoàn tác
                boardState[move.from.row][move.from.col] = movingPiece;
                boardState[move.to.row][move.to.col] = captured;
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function evaluateBoard() {
        let totalEvaluation = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = boardState[r][c];
                if (!piece) continue;
                
                const type = piece.toLowerCase();
                const isRed = getPieceColor(piece) === 'r';
                
                const materialValue = PIECE_VALUES[type];
                let positionValue = 0;

                // Bảng PST được định nghĩa theo góc nhìn của quân Đỏ
                if (isRed) {
                    positionValue = PST[type][r][c];
                } else {
                    // Với quân Đen, lật ngược chỉ số hàng để đọc bảng
                    positionValue = PST[type][(ROWS - 1) - r][c];
                }

                const totalValue = materialValue + positionValue;

                // Bot is Black (b), so positive is good for bot.
                totalEvaluation += isRed ? -totalValue : totalValue;
            }
        }

        // Thêm điểm thưởng/phạt cho việc chiếu Tướng
        // Việc này giúp Bot ưu tiên các nước đi tấn công Tướng đối phương và tránh bị chiếu
        const CHECK_BONUS = 50; // Tương đương nửa giá trị quân Tốt

        const redGeneralPos = findGeneral('r');
        if (redGeneralPos && isSquareAttacked(redGeneralPos.row, redGeneralPos.col, 'b')) {
            totalEvaluation += CHECK_BONUS; // Tốt cho Bot (Đen) khi chiếu được Tướng Đỏ
        }

        const blackGeneralPos = findGeneral('b');
        if (blackGeneralPos && isSquareAttacked(blackGeneralPos.row, blackGeneralPos.col, 'r')) {
            totalEvaluation -= CHECK_BONUS; // Xấu cho Bot (Đen) khi bị Tướng Đỏ chiếu
        }

        // Nâng cấp AI: Thêm điểm thưởng cho "độ linh hoạt" (Mobility)
        // Giúp Bot ưu tiên phát triển quân đến các vị trí có nhiều nước đi hơn.
        let mobilityScore = 0;
        const MOBILITY_WEIGHT = 2; // Điểm cho mỗi nước đi (giá trị nhỏ để không lấn át giá trị quân cờ)

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = boardState[r][c];
                if (!piece) continue;

                const color = getPieceColor(piece);
                // Sử dụng getPseudoLegalMoves để tính toán nhanh, tránh quá tải cho AI
                const moves = getPseudoLegalMoves(piece, r, c);
                
                if (color === 'b') { // Bot (Đen) được cộng điểm
                    mobilityScore += moves.length * MOBILITY_WEIGHT;
                } else { // Người chơi (Đỏ) bị trừ điểm
                    mobilityScore -= moves.length * MOBILITY_WEIGHT;
                }
            }
        }
        totalEvaluation += mobilityScore;

        // --- 3. Threat Analysis ---
        // Giúp Bot nhận biết và phản ứng với các quân cờ đang bị đe dọa (phòng thủ).
        // Đồng thời khuyến khích Bot tấn công quân của người chơi.
        let threatScore = 0;
        // Trọng số nhỏ để không làm Bot quá nhút nhát, chỉ là một yếu tố để cân nhắc.
        const THREAT_WEIGHT = 0.2; 

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const piece = boardState[r][c];
                if (!piece) continue;

                const color = getPieceColor(piece);
                const opponentColor = getOpponent(color);

                // Kiểm tra xem quân cờ này có đang bị đối phương tấn công không
                if (isSquareAttacked(r, c, opponentColor)) {
                    const pieceValue = PIECE_VALUES[piece.toLowerCase()];
                    
                    // Nếu quân của Bot bị tấn công -> trừ điểm (ưu tiên phòng thủ)
                    if (color === 'b') { threatScore -= pieceValue * THREAT_WEIGHT; } 
                    // Nếu quân của người chơi bị tấn công -> cộng điểm (khuyến khích tấn công)
                    else { threatScore += pieceValue * THREAT_WEIGHT; }
                }
            }
        }
        totalEvaluation += threatScore;

        return totalEvaluation;
    }

    // === MOVE GENERATION & VALIDATION ===
    function getLegalMovesForPiece(row, col) {
        const piece = boardState[row][col];
        if (!piece) return [];

        const pseudoLegalMoves = getPseudoLegalMoves(piece, row, col);
        
        return pseudoLegalMoves.filter(move => {
            const tempBoard = boardState.map(r => [...r]);
            tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
            tempBoard[move.from.row][move.from.col] = '';
            
            const generalPos = findGeneral(currentPlayer, tempBoard);
            if (!generalPos) return false; // Should not happen

            // Check for flying general
            const opponentGeneralPos = findGeneral(getOpponent(currentPlayer), tempBoard);
            if (opponentGeneralPos && generalPos.col === opponentGeneralPos.col) {
                let piecesBetween = 0;
                for (let r = Math.min(generalPos.row, opponentGeneralPos.row) + 1; r < Math.max(generalPos.row, opponentGeneralPos.row); r++) {
                    if (tempBoard[r][generalPos.col]) piecesBetween++;
                }
                if (piecesBetween === 0) return false;
            }

            return !isSquareAttacked(generalPos.row, generalPos.col, getOpponent(currentPlayer), tempBoard);
        });
    }

    function getPseudoLegalMoves(piece, row, col) {
        const type = piece.toLowerCase();
        switch (type) {
            case 'p': return getSoldierMoves(row, col);
            case 'c': return getCannonMoves(row, col);
            case 'r': return getChariotMoves(row, col);
            case 'h': return getHorseMoves(row, col);
            case 'e': return getElephantMoves(row, col);
            case 'a': return getAdvisorMoves(row, col);
            case 'k': return getGeneralMoves(row, col);
            default: return [];
        }
    }

    function addMoveIfValid(moves, r1, c1, r2, c2) {
        if (isValid(r2, c2)) {
            const targetPiece = boardState[r2][c2];
            if (!targetPiece || getPieceColor(targetPiece) !== getPieceColor(boardState[r1][c1])) {
                moves.push({ from: { row: r1, col: c1 }, to: { row: r2, col: c2 } });
            }
        }
    }

    function getSoldierMoves(row, col) {
        const moves = [];
        const color = getPieceColor(boardState[row][col]);
        const forwardDir = color === 'r' ? -1 : 1;

        // Forward
        addMoveIfValid(moves, row, col, row + forwardDir, col);

        // Sideways after river
        const hasCrossedRiver = (color === 'r' && row < 5) || (color === 'b' && row > 4);
        if (hasCrossedRiver) {
            addMoveIfValid(moves, row, col, row, col - 1);
            addMoveIfValid(moves, row, col, row, col + 1);
        }
        return moves;
    }

    function getCannonMoves(row, col) {
        const moves = [];
        const color = getPieceColor(boardState[row][col]);
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            let jump = false;
            for (let i = 1; i < Math.max(ROWS, COLS); i++) {
                const newRow = row + i * dr, newCol = col + i * dc;
                if (!isValid(newRow, newCol)) break;
                const target = boardState[newRow][newCol];
                if (!jump) {
                    if (!target) moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                    else jump = true;
                } else {
                    if (target) {
                        if (getPieceColor(target) !== color) {
                            moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                        }
                        break;
                    }
                }
            }
        }
        return moves;
    }

    function getChariotMoves(row, col) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            for (let i = 1; i < Math.max(ROWS, COLS); i++) {
                const newRow = row + i * dr, newCol = col + i * dc;
                if (!isValid(newRow, newCol)) break;
                const target = boardState[newRow][newCol];
                if (target) {
                    if (getPieceColor(target) !== getPieceColor(boardState[row][col])) {
                        moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                    }
                    break;
                }
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
            }
        }
        return moves;
    }

    function getHorseMoves(row, col) {
        const moves = [];
        const deltas = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        const blockDeltas = [[-1, 0], [-1, 0], [0, -1], [0, 1], [0, -1], [0, 1], [1, 0], [1, 0]];
        for (let i = 0; i < deltas.length; i++) {
            const blockRow = row + blockDeltas[i][0];
            const blockCol = col + blockDeltas[i][1];
            if (isValid(blockRow, blockCol) && !boardState[blockRow][blockCol]) {
                addMoveIfValid(moves, row, col, row + deltas[i][0], col + deltas[i][1]);
            }
        }
        return moves;
    }

    function getElephantMoves(row, col) {
        const moves = [];
        const color = getPieceColor(boardState[row][col]);
        const deltas = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
        const blockDeltas = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (let i = 0; i < deltas.length; i++) {
            const newRow = row + deltas[i][0], newCol = col + deltas[i][1];
            const blockRow = row + blockDeltas[i][0], blockCol = col + blockDeltas[i][1];
            const hasCrossedRiver = (color === 'r' && newRow < 5) || (color === 'b' && newRow > 4);
            if (hasCrossedRiver) continue;
            if (isValid(blockRow, blockCol) && !boardState[blockRow][blockCol]) {
                addMoveIfValid(moves, row, col, newRow, newCol);
            }
        }
        return moves;
    }

    function getAdvisorMoves(row, col) {
        const moves = [];
        const color = getPieceColor(boardState[row][col]);
        const deltas = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of deltas) {
            const newRow = row + dr, newCol = col + dc;
            if (newCol < 3 || newCol > 5) continue;
            if ((color === 'r' && (newRow < 7 || newRow > 9)) || (color === 'b' && (newRow < 0 || newRow > 2))) continue;
            addMoveIfValid(moves, row, col, newRow, newCol);
        }
        return moves;
    }

    function getGeneralMoves(row, col) {
        const moves = [];
        const color = getPieceColor(boardState[row][col]);
        const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of deltas) {
            const newRow = row + dr, newCol = col + dc;
            if (newCol < 3 || newCol > 5) continue;
            if ((color === 'r' && (newRow < 7 || newRow > 9)) || (color === 'b' && (newRow < 0 || newRow > 2))) continue;
            addMoveIfValid(moves, row, col, newRow, newCol);
        }
        return moves;
    }

    function isSquareAttacked(row, col, attackerColor, board = boardState) {
        const opponent = attackerColor;
        // Soldier
        const soldierDir = opponent === 'r' ? -1 : 1;
        if (isValid(row - soldierDir, col) && board[row - soldierDir][col]?.toLowerCase() === 'p' && getPieceColor(board[row - soldierDir][col]) === opponent) return true;
        // Sideways attacks (from soldiers that have crossed the river)
        for (const dCol of [-1, 1]) {
            const attackerRow = row;
            const attackerCol = col + dCol;
            if (isValid(attackerRow, attackerCol)) {
                const piece = board[attackerRow][attackerCol];
                if (piece?.toLowerCase() === 'p' && getPieceColor(piece) === attackerColor) {
                    const hasCrossed = (attackerColor === 'r' && attackerRow < 5) || (attackerColor === 'b' && attackerRow > 4);
                    if (hasCrossed) return true;
                }
            }
        }

        // Horse
        const horseDeltas = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        const horseBlockDeltas = [[-1, 0], [-1, 0], [0, -1], [0, 1], [0, -1], [0, 1], [1, 0], [1, 0]];
        for (let i = 0; i < horseDeltas.length; i++) {
            const r = row + horseDeltas[i][0], c = col + horseDeltas[i][1];
            const br = row + horseBlockDeltas[i][0], bc = col + horseBlockDeltas[i][1];
            if (isValid(r, c) && isValid(br, bc) && !board[br][bc] && board[r][c]?.toLowerCase() === 'h' && getPieceColor(board[r][c]) === opponent) return true;
        }

        // Chariot, Cannon, General
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            let jump = false;
            for (let i = 1; i < Math.max(ROWS, COLS); i++) {
                const r = row + i * dr, c = col + i * dc;
                if (!isValid(r, c)) break;
                const piece = board[r][c];
                if (piece) {
                    const pieceType = piece.toLowerCase();
                    const pieceColor = getPieceColor(piece);
                    if (pieceColor === opponent) {
                        if (!jump) { // Chariot or General
                            if (pieceType === 'r' || (pieceType === 'k' && i === 1)) return true;
                        } else { // Cannon
                            if (pieceType === 'c') return true;
                        }
                    }
                    if (!jump) jump = true;
                    else break;
                }
            }
        }
        return false;
    }

    // === HELPER FUNCTIONS ===
    function getAllLegalMoves(playerColor) {
        const allMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (boardState[r][c] && getPieceColor(boardState[r][c]) === playerColor) {
                    allMoves.push(...getLegalMovesForPiece(r, c));
                }
            }
        }
        return allMoves;
    }

    function findGeneral(color, board = boardState) {
        const generalChar = color === 'r' ? 'K' : 'k';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === generalChar) return { row: r, col: c };
            }
        }
        return null;
    }

    function getPieceColor(piece) { return piece ? (piece === piece.toUpperCase() ? 'r' : 'b') : null; }
    function getOpponent(color) { return color === 'r' ? 'b' : 'r'; }
    function isValid(row, col) { return row >= 0 && row < ROWS && col >= 0 && col < COLS; }

    // === TIMER LOGIC ===
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameActive) return;
            timeLeft[currentPlayer]--;
            updateTimerDisplay(currentPlayer);
            if (timeLeft[currentPlayer] <= 0) {
                const winner = getOpponent(currentPlayer);
                const winnerName = winner === 'r' ? 'Đỏ' : 'Đen';
                const loserName = currentPlayer === 'r' ? 'Đỏ' : 'Đen';
                score[winner]++;
                endGame('Hết giờ!', `${winnerName} thắng do quân ${loserName} hết thời gian.`);
            }
        }, 1000);
    }

    function updateTimerDisplay(player) {
        const el = player === 'r' ? timerREl : timerBEl;
        const minutes = Math.floor(timeLeft[player] / 60).toString().padStart(2, '0');
        const seconds = (timeLeft[player] % 60).toString().padStart(2, '0');
        el.innerHTML = `<div class="player-title">Quân ${player === 'r' ? 'Đỏ' : 'Đen'}</div><div class="time-val">${minutes}:${seconds}</div>`;
        timerREl.classList.toggle('active', currentPlayer === 'r');
        timerBEl.classList.toggle('active', currentPlayer === 'b');
    }

    // Initial call
    renderBoard();
});