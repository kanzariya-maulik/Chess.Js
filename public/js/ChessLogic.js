const socket = io();
const chess = new Chess();

const boardElement = document.querySelector('.chessBoard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null; // 'w' or 'b'

const renderBoard = () => {
    console.log("♟ Rendering board...");

    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);

                // ✅ Fix: Ensure draggable pieces match playerRole correctly
                if (playerRole && playerRole.toLowerCase() === square.color) {
                    pieceElement.draggable = true;
                    console.log(`✅ Draggable piece: ${square.type} at (${rowIndex}, ${squareIndex})`);

                    pieceElement.addEventListener("dragstart", (e) => {
                        console.log(`🎯 Drag started: ${square.type} at (${rowIndex}, ${squareIndex})`);
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", ""); // Required for Firefox
                    });

                    pieceElement.addEventListener("dragend", () => {
                        console.log(`⏹ Drag ended: ${square.type} at (${rowIndex}, ${squareIndex})`);
                        draggedPiece = null;
                        sourceSquare = null;
                    });
                } else {
                    console.log(`🚫 Non-draggable piece: ${square.type} at (${rowIndex}, ${squareIndex})`);
                }

                squareElement.appendChild(pieceElement);
            }

            // 🔹 Allow dropping pieces
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
                console.log(`↔ Dragging over: (${squareElement.dataset.row}, ${squareElement.dataset.col})`);
            });

            // 🔹 Handle drop event
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                console.log(`📩 Drop detected on: (${squareElement.dataset.row}, ${squareElement.dataset.col})`);

                if (draggedPiece && sourceSquare) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                } else {
                    console.log("⚠ Drop ignored: No piece was dragged.");
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q", // Always promote to queen (simplified)
    };
    console.log("♞ Sending move:", move);
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    if (!piece) return "";

    const unicodePieces = {
        p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔", // White pieces
        P: "♟", R: "♜", N: "♞", B: "♝", Q: "♛", K: "♚"  // Black pieces
    };

    return unicodePieces[piece.type] || "";
};

// 🔹 Listen for role assignment
socket.on("playerRole", function (role) {
    playerRole = role.toLowerCase(); // Ensure lowercase ('w' or 'b')
    console.log(`🎭 Player role assigned: ${playerRole.toUpperCase()}`);
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null; // Spectators can't move pieces
    console.log("👀 Spectator mode activated.");
    renderBoard();
});

// 🔹 Update board state
socket.on("boardState", function (fen) {
    chess.load(fen);
    console.log("📜 Board updated to FEN:", fen);
    renderBoard();
});

// 🔹 Handle move from other players
socket.on("move", function (move) {
    console.log("🔄 Move received:", move);
    chess.move(move);
    renderBoard();
});

// 🚀 Initial render
renderBoard();
