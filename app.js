const express = require("express");
const http = require("http");
const Socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");
const app = express();

const server = http.createServer(app);
const io = Socket(server);

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index");
})

const player ={}
let currentPlayer = "W";

io.on("connection",function (socket){
    console.log(socket.id);
})

server.listen(3000,()=>{
    console.log("running on port 3000");
});
