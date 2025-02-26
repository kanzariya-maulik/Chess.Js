const express = require("express");
const http = require("http");
const Socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = Socket(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

const chess = new Chess();
const player = {};

io.on("connection", function (socket) {
    console.log("A user connected:", socket.id);

    if (!player.white) {
        player.white = socket.id;
        socket.emit("playerRole", "W");
    } else if (!player.black) {
        player.black = socket.id;
        socket.emit("playerRole", "B");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", function () {
        if (socket.id === player.white) {
            delete player.white;
        } else if (socket.id === player.black) {
            delete player.black;
        }
    });

    socket.on("move", function (move) {
        try {
            if (chess.turn() === "w" && socket.id !== player.white) return;
            if (chess.turn() === "b" && socket.id !== player.black) return;

            const result = chess.move(move);

            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());

                // Check if the game is over
                if (chess.isGameOver()) {
                    let resultMessage = "Game Over!";
                    if (chess.isCheckmate()) {
                        resultMessage = `Checkmate! Winner: ${chess.turn() === "w" ? "Black" : "White"}`;
                    } else if (chess.isDraw()) {
                        resultMessage = "Game Draw!";
                    }
                    io.emit("gameOver", resultMessage);
                }
            } else {
                console.log("Invalid move");
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            console.error(error);
            socket.emit("error", error);
        }
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
