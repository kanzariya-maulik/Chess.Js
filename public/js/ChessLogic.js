const socket = io();
const chess = new Chess();

const boardElement = document.querySelector('.chessBoard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = new chess.board();
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

                if (playerRole && playerRole.toLowerCase() === square.color) {
                    pieceElement.draggable = true;
                    pieceElement.addEventListener("dragstart", (e) => {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    });

                    pieceElement.addEventListener("dragend", () => {
                        draggedPiece = null;
                        sourceSquare = null;
                    });
                }

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();

                if (draggedPiece && sourceSquare) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    let fromCol = String.fromCharCode(97 + source.col);
    let fromRow = 8 - source.row;
    
    let toCol = String.fromCharCode(97 + target.col);
    let toRow = 8 - target.row;

    let promotion = "";
    if ((fromRow === 7 && toRow === 8) || (fromRow === 2 && toRow === 1)) {
        promotion = "q";
    }

    const move = {
        from: `${fromCol}${fromRow}`,
        to: `${toCol}${toRow}`,
        ...(promotion && { promotion }),
    };

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    if (!piece) return "";

    const unicodePieces = {
        p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔",
        P: "♟", R: "♜", N: "♞", B: "♝", Q: "♛", K: "♚"
    };

    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role.toLowerCase();
    updateRoleDisplay(playerRole);
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    updateRoleDisplay("Spectator");
    renderBoard();
});

function updateRoleDisplay(role) {
    const loadingScreen = document.getElementById("loading-screen");
    const roleDisplay = document.getElementById("player-role");

    if (role === "waiting") {
        loadingScreen.style.display = "flex";  // Show loading screen
        roleDisplay.innerHTML = "Waiting for Black to join...";
    } else {
        loadingScreen.style.display = "none";
        let str = `You are playing as: ${
            role === "w" ? "⚪ White" : role === "b" ? "⚫ Black" : "👀 Spectator"
          }`;
          roleDisplay.innerHTML = str;
    }
}

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

socket.on("gameOver", (result) => {
    document.getElementById("gameOverMessage").innerText = result;
    document.getElementById("gameOverPopup").classList.remove("hidden");
});

function closePopup() {
    document.getElementById("gameOverPopup").classList.add("hidden");
    location.reload();
}

socket.on("invalidMove", function (result) {
    console.log(result);
});

socket.on("error", function (error) {
    showError(error.message || "Invalid Move!");
});

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.textContent = message;
    
    errorDiv.classList.remove("hidden", "opacity-0");
    errorDiv.classList.add("opacity-100");

    setTimeout(() => {
        errorDiv.classList.add("opacity-0");
        setTimeout(() => errorDiv.classList.add("hidden"), 300);
    }, 3000);
}

socket.on("playerDisconnected", (message) => {
    showDisconnectPopup(message);
});

socket.on("allowReset", () => {
    if (!playerRole) {
        document.querySelector(".disconnect-popup").innerHTML += `
            <button onclick="resetGame()">Reset Game</button>
        `;
    }
});

function showDisconnectPopup(message) {
    let popup = document.createElement("div");
    popup.className = "disconnect-popup";
    popup.innerHTML = `
        <p>${message}</p>
        <button onclick="closePopup()">Close</button>
    `;
    document.body.appendChild(popup);
}

function closePopup() {
    document.querySelector(".disconnect-popup").remove();
}

function resetGame() {
    socket.emit("resetGame");
}

socket.on("gameReset", () => {
    location.reload();
});

renderBoard();
