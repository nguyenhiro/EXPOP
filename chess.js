document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const boardElement = document.getElementById('game-board');
    const startScreen = document.getElementById('start-screen');
    const gameUI = document.getElementById('game-ui');
    const timerWEl = document.getElementById('timer-w');
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
    const pieces = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟', // Black
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'  // White
    };
    const pieceValues = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900 };
    const initialBoard = () => [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    
    // === AI EVALUATION TABLES (Piece-Square Tables) ===
    // Bảng điểm vị trí cho quân Trắng (White). Quân Đen sẽ dùng bảng đảo ngược (mirror).
    const pst = {
        'p': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        'n': [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        'b': [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        'r': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        'q': [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,   0,  5,  5,  5,  5,  0, -5],
            [0,    0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        'k': [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20,  20,  0,  0,  0,  0,  20, 20],
            [20,  30, 10,  0,  0, 10, 30, 20]
        ]
    };

    // === GAME STATE ===
    let boardState, currentPlayer, gameMode, gameActive, selectedSquare, legalMoves, kingInCheck, enPassantTarget, castlingRights, timeLeft, timerInterval;
    let score = { 'w': 0, 'b': 0 };
    let botDifficulty = 1; // 1: Dễ, 2: Trung bình, 3: Khó

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
        const winner = currentPlayer === 'w' ? 'Đen' : 'Trắng';
        const winnerCode = currentPlayer === 'w' ? 'b' : 'w';
        const loser = currentPlayer === 'w' ? 'Trắng' : 'Đen';
        score[winnerCode]++;
        endGame(`${winner} thắng!`, `Quân ${loser} đã đầu hàng.`);
    });
    boardElement.addEventListener('click', handleSquareClick);
    if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => inGameMenu.classList.add('hidden'));

    // Guide Logic
    if (btnGuide) btnGuide.addEventListener('click', () => guideScreen.classList.remove('hidden'));
    if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => guideScreen.classList.add('hidden'));

    // === CORE GAME FLOW ===
    function startGame(mode) {
        const timeInput = document.getElementById('time-limit');
        // Xử lý an toàn: nếu không có input, dùng giá trị mặc định là 5 phút
        let minutes = timeInput ? parseInt(timeInput.value) : 5;
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 30) minutes = 30; // Giới hạn tối đa 30 phút
        timeLimit = minutes * 60;

        gameMode = mode;
        startScreen.classList.add('hidden');
        gameUI.style.display = 'flex';
        resetGame();
    }

    function resetGame() {
        boardState = initialBoard();
        currentPlayer = 'w';
        gameActive = true;
        selectedSquare = null;
        legalMoves = [];
        kingInCheck = null;
        enPassantTarget = null;
        castlingRights = { w: { k: true, q: true }, b: { k: true, q: true } };
        
        clearInterval(timerInterval);
        timeLeft = { 'w': timeLimit, 'b': timeLimit };
        updateTimerDisplay('w');
        updateTimerDisplay('b');
        startTimer();

        renderBoard();
    }

    function handleSquareClick(event) {
        if (!gameActive || (gameMode === 'pve' && currentPlayer === 'b')) return;

        const square = event.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (selectedSquare) {
            const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
            if (move) {
                makeMove(move);
            } else {
                selectedSquare = null;
                legalMoves = [];
                renderBoard(); // Deselect
            }
        } else {
            const piece = boardState[row][col];
            if (piece && getPieceColor(piece) === currentPlayer) {
                selectedSquare = { row, col };
                legalMoves = getLegalMovesForPiece(row, col);
                renderBoard();
            }
        }
    }

    function makeMove(move) {
        const { from, to, flag } = move;
        const piece = boardState[from.row][from.col];

        // Handle special moves
        if (flag === 'en_passant') {
            boardState[from.row][to.col] = '';
        } else if (flag === 'castling') {
            const rookCol = to.col > from.col ? 7 : 0;
            const newRookCol = to.col > from.col ? 5 : 3;
            boardState[from.row][newRookCol] = boardState[from.row][rookCol];
            boardState[from.row][rookCol] = '';
        }

        // Update board
        boardState[to.row][to.col] = piece;
        boardState[from.row][from.col] = '';

        // Handle promotion
        if (piece.toLowerCase() === 'p' && (to.row === 0 || to.row === 7)) {
            boardState[to.row][to.col] = (currentPlayer === 'w') ? 'Q' : 'q';
        }

        // Update en passant target
        if (piece.toLowerCase() === 'p' && Math.abs(from.row - to.row) === 2) {
            enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
        } else {
            enPassantTarget = null;
        }

        // Update castling rights
        if (piece.toLowerCase() === 'k') {
            castlingRights[currentPlayer].k = false;
            castlingRights[currentPlayer].q = false;
        } else if (piece.toLowerCase() === 'r') {
            if (from.col === 0) castlingRights[currentPlayer].q = false;
            if (from.col === 7) castlingRights[currentPlayer].k = false;
        }

        // Switch player and reset selection
        currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
        selectedSquare = null;
        legalMoves = [];

        // Check for check/checkmate/stalemate
        const kingPos = findKing(currentPlayer);
        kingInCheck = kingPos && isSquareAttacked(kingPos.row, kingPos.col, (currentPlayer === 'w' ? 'b' : 'w')) ? kingPos : null;

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
            if (kingInCheck) {
                const winner = currentPlayer === 'w' ? 'Đen' : 'Trắng';
                const winnerCode = currentPlayer === 'w' ? 'b' : 'w';
                score[winnerCode]++;
                if (winnerCode === 'w' && gameMode === 'pve' && botDifficulty < 3) {
                    botDifficulty++; // Tăng độ khó nếu người chơi thắng
                }
                endGame('Chiếu bí!', `${winner} thắng!`);
            } else {
                endGame('Hòa cờ!', 'Hòa do hết nước đi (Stalemate).');
            }
        }
    }

    function endGame(title, message) {
        gameActive = false;
        clearInterval(timerInterval);
        resultTitle.textContent = title;
        resultMessage.innerHTML = `${message}<br><br>Tỉ số: Trắng ${score['w']} - Đen ${score['b']}`;
        resultScreen.classList.remove('hidden');
        gameUI.style.display = 'none';
    }

    // === RENDERING ===
    function renderBoard() {
        boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.dataset.row = row; square.dataset.col = col;
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');

                if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) square.classList.add('selected');
                if (kingInCheck && kingInCheck.row === row && kingInCheck.col === col) square.classList.add('in-check');

                const piece = boardState[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.classList.add('piece');
                    pieceElement.textContent = pieces[piece];
                    pieceElement.style.color = getPieceColor(piece) === 'w' ? '#f8f8f8' : '#282828';
                    square.appendChild(pieceElement);
                }

                const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
                if (move) {
                    if (boardState[row][col] || move.flag === 'en_passant') {
                        square.classList.add('capture-hint');
                    } else {
                        const dot = document.createElement('div');
                        dot.classList.add('valid-move-dot');
                        square.appendChild(dot);
                    }
                }
                boardElement.appendChild(square);
            }
        }
    }

    // === BOT AI (MINIMAX + ALPHA-BETA) ===
    function botMove() {
        // Độ sâu tìm kiếm dựa trên độ khó
        let depth = 2; // Mặc định (Trung bình)
        if (botDifficulty === 1) depth = 1;
        if (botDifficulty >= 3) depth = 3;

        // Sử dụng setTimeout để không block UI render
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

        // Sắp xếp nước đi để tối ưu cắt tỉa Alpha-Beta (ưu tiên ăn quân)
        possibleMoves.sort((a, b) => {
            const pieceA = boardState[a.to.row][a.to.col] ? 10 : 0;
            const pieceB = boardState[b.to.row][b.to.col] ? 10 : 0;
            return pieceB - pieceA;
        });

        let bestMoves = [];
        let bestValue = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (const move of possibleMoves) {
            // Thực hiện nước đi thử
            const captured = boardState[move.to.row][move.to.col];
            const movingPiece = boardState[move.from.row][move.from.col];
            boardState[move.to.row][move.to.col] = movingPiece;
            boardState[move.from.row][move.from.col] = '';

            // Gọi Minimax
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
        if (depth === 0) {
            return evaluateBoard();
        }

        const moves = getAllLegalMoves(isMaximizing ? 'b' : 'w');
        if (moves.length === 0) {
            // Nếu hết nước đi, kiểm tra chiếu bí hay hòa
            // (Ở đây đơn giản hóa trả về giá trị lớn/nhỏ)
            return isMaximizing ? -10000 : 10000; 
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const captured = boardState[move.to.row][move.to.col];
                const movingPiece = boardState[move.from.row][move.from.col];
                
                boardState[move.to.row][move.to.col] = movingPiece;
                boardState[move.from.row][move.from.col] = '';

                const eval = minimax(depth - 1, alpha, beta, false);

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
                const captured = boardState[move.to.row][move.to.col];
                const movingPiece = boardState[move.from.row][move.from.col];

                boardState[move.to.row][move.to.col] = movingPiece;
                boardState[move.from.row][move.from.col] = '';

                const eval = minimax(depth - 1, alpha, beta, true);

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
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = boardState[r][c];
                if (!piece) continue;
                
                const type = piece.toLowerCase();
                const isWhite = piece === piece.toUpperCase();
                
                // Giá trị quân cờ + Giá trị vị trí
                // Nếu là quân Đen, ta cần lật ngược bảng vị trí (mirror)
                let positionValue = 0;
                if (isWhite) {
                    positionValue = pst[type][r][c];
                } else {
                    positionValue = pst[type][7 - r][c];
                }

                const value = pieceValues[type] + positionValue;
                
                // Bot là quân Đen (Black), nên điểm càng cao cho Đen càng tốt (trong hàm này ta quy ước Đen là dương cho Minimax Bot)
                // Tuy nhiên, logic Minimax ở trên đang dùng: Bot (b) là Maximizing.
                // Vậy: Quân Đen cộng điểm, Quân Trắng trừ điểm.
                if (!isWhite) {
                    totalEvaluation += value;
                } else {
                    totalEvaluation -= value;
                }
            }
        }
        return totalEvaluation;
    }

    // === MOVE GENERATION & VALIDATION ===
    function getLegalMovesForPiece(row, col) {
        const piece = boardState[row][col];
        if (!piece) return [];

        const pseudoLegalMoves = getPseudoLegalMoves(piece, row, col);
        
        // Filter out moves that leave the king in check
        return pseudoLegalMoves.filter(move => {
            const tempBoard = boardState.map(r => [...r]);
            // Simulate move
            tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
            tempBoard[move.from.row][move.from.col] = '';
            
            const kingPos = findKing(currentPlayer, tempBoard);
            return !isSquareAttacked(kingPos.row, kingPos.col, (currentPlayer === 'w' ? 'b' : 'w'), tempBoard);
        });
    }

    function getPseudoLegalMoves(piece, row, col) {
        const type = piece.toLowerCase();
        switch (type) {
            case 'p': return getPawnMoves(row, col);
            case 'r': return getSlidingMoves(row, col, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
            case 'n': return getKnightMoves(row, col);
            case 'b': return getSlidingMoves(row, col, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
            case 'q': return getSlidingMoves(row, col, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
            case 'k': return getKingMoves(row, col);
            default: return [];
        }
    }

    function getPawnMoves(row, col) {
        const moves = [];
        const color = getPieceColor(boardState[row][col]);
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;

        // 1 step forward
        if (isValid(row + dir, col) && !boardState[row + dir][col]) {
            moves.push({ from: { row, col }, to: { row: row + dir, col } });
            // 2 steps forward
            if (row === startRow && !boardState[row + 2 * dir][col]) {
                moves.push({ from: { row, col }, to: { row: row + 2 * dir, col } });
            }
        }
        // Capture
        for (const dCol of [-1, 1]) {
            const newRow = row + dir, newCol = col + dCol;
            if (isValid(newRow, newCol)) {
                const targetPiece = boardState[newRow][newCol];
                if (targetPiece && getPieceColor(targetPiece) !== color) {
                    moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                }
                // En passant
                if (enPassantTarget && enPassantTarget.row === newRow && enPassantTarget.col === newCol) {
                    moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, flag: 'en_passant' });
                }
            }
        }
        return moves;
    }

    function getKnightMoves(row, col) {
        const moves = [];
        const deltas = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        for (const [dr, dc] of deltas) {
            addMoveIfValid(moves, row, col, row + dr, col + dc);
        }
        return moves;
    }

    function getKingMoves(row, col) {
        const moves = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                addMoveIfValid(moves, row, col, row + dr, col + dc);
            }
        }
        // Castling
        const color = getPieceColor(boardState[row][col]);
        if (castlingRights[color].k && !boardState[row][5] && !boardState[row][6] && !isSquareAttacked(row, 4, (color === 'w' ? 'b' : 'w')) && !isSquareAttacked(row, 5, (color === 'w' ? 'b' : 'w')) && !isSquareAttacked(row, 6, (color === 'w' ? 'b' : 'w'))) {
            moves.push({ from: { row, col }, to: { row, col: 6 }, flag: 'castling' });
        }
        if (castlingRights[color].q && !boardState[row][1] && !boardState[row][2] && !boardState[row][3] && !isSquareAttacked(row, 4, (color === 'w' ? 'b' : 'w')) && !isSquareAttacked(row, 3, (color === 'w' ? 'b' : 'w')) && !isSquareAttacked(row, 2, (color === 'w' ? 'b' : 'w'))) {
            moves.push({ from: { row, col }, to: { row, col: 2 }, flag: 'castling' });
        }
        return moves;
    }

    function getSlidingMoves(row, col, directions) {
        const moves = [];
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * dr;
                const newCol = col + i * dc;
                if (!isValid(newRow, newCol)) break;
                const targetPiece = boardState[newRow][newCol];
                if (targetPiece) {
                    if (getPieceColor(targetPiece) !== getPieceColor(boardState[row][col])) {
                        moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
                    }
                    break;
                }
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
            }
        }
        return moves;
    }

    function isSquareAttacked(row, col, attackerColor, board = boardState) {
        // Check for pawn attacks
        const pawnDir = attackerColor === 'w' ? 1 : -1;
        for (const dCol of [-1, 1]) {
            if (isValid(row + pawnDir, col + dCol) && board[row + pawnDir][col + dCol].toLowerCase() === 'p' && getPieceColor(board[row + pawnDir][col + dCol]) === attackerColor) return true;
        }
        // Check for knight attacks
        const knightDeltas = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        for (const [dr, dc] of knightDeltas) {
            if (isValid(row + dr, col + dc) && board[row + dr][col + dc].toLowerCase() === 'n' && getPieceColor(board[row + dr][col + dc]) === attackerColor) return true;
        }
        // Check for sliding pieces (Rook, Bishop, Queen) and King
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const r = row + i * dr, c = col + i * dc;
                if (!isValid(r, c)) break;
                const piece = board[r][c];
                if (piece) {
                    const pieceType = piece.toLowerCase();
                    const pieceColor = getPieceColor(piece);
                    if (pieceColor === attackerColor) {
                        const isRookOrQueen = (pieceType === 'r' || pieceType === 'q');
                        const isBishopOrQueen = (pieceType === 'b' || pieceType === 'q');
                        const isKing = (pieceType === 'k' && i === 1);
                        if (isKing) return true;
                        if ((dr === 0 || dc === 0) && isRookOrQueen) return true;
                        if ((dr !== 0 && dc !== 0) && isBishopOrQueen) return true;
                    }
                    break;
                }
            }
        }
        return false;
    }

    // === HELPER FUNCTIONS ===
    function getAllLegalMoves(playerColor) {
        const allMoves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardState[r][c] && getPieceColor(boardState[r][c]) === playerColor) {
                    allMoves.push(...getLegalMovesForPiece(r, c));
                }
            }
        }
        return allMoves;
    }
    function addMoveIfValid(moves, r1, c1, r2, c2) {
        if (isValid(r2, c2)) {
            const targetPiece = boardState[r2][c2];
            if (!targetPiece || getPieceColor(targetPiece) !== getPieceColor(boardState[r1][c1])) {
                moves.push({ from: { row: r1, col: c1 }, to: { row: r2, col: c2 } });
            }
        }
    }
    function findKing(color, board = boardState) {
        const kingChar = color === 'w' ? 'K' : 'k';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === kingChar) return { row: r, col: c };
            }
        }
        return null;
    }
    function getPieceColor(piece) { return piece === piece.toUpperCase() ? 'w' : 'b'; }
    function isValid(row, col) { return row >= 0 && row < 8 && col >= 0 && col < 8; }

    // === TIMER LOGIC ===
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!gameActive) return;
            timeLeft[currentPlayer]--;
            updateTimerDisplay(currentPlayer);
            if (timeLeft[currentPlayer] <= 0) {
                const winner = currentPlayer === 'w' ? 'Đen' : 'Trắng';
                const winnerCode = currentPlayer === 'w' ? 'b' : 'w';
                const loser = currentPlayer === 'w' ? 'Trắng' : 'Đen';
                score[winnerCode]++;
                endGame('Hết giờ!', `${winner} thắng do quân ${loser} hết thời gian.`);
            }
        }, 1000);
    }
    function updateTimerDisplay(player) {
        const el = player === 'w' ? timerWEl : timerBEl;
        const minutes = Math.floor(timeLeft[player] / 60).toString().padStart(2, '0');
        const seconds = (timeLeft[player] % 60).toString().padStart(2, '0');
        el.innerHTML = `<div class="player-title">Quân ${player === 'w' ? 'Trắng' : 'Đen'}</div><div class="time-val">${minutes}:${seconds}</div>`;
        timerWEl.classList.toggle('active', currentPlayer === 'w');
        timerBEl.classList.toggle('active', currentPlayer === 'b');
    }
});