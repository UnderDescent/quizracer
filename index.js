let express = require('express');
let socket = require('socket.io');
let connectedCount = 0;
let guestCounter = 0;
let notStarted = true;
const ROUND_SECONDS = 120;
let roundTimeLeft = ROUND_SECONDS;
let roundTimer = null;
let gameEnded = false;

//app setup
let app = express();
let server = app.listen(5023, () => {
    console.log("Listening on 5023");
});

//static files
app.use(express.static('public'));

//socket setup
let io = socket(server);


//users and questions
const questions = require('./questions.json');
const TOTAL_QUESTIONS = 15;
let users = []

function getSortedUsers() {
    return [...users].sort((a, b) => b.score - a.score);
}

function emitLeaderboard() {
    io.emit("leaderboard", getSortedUsers());
}

function hasAnyConnectedUser() {
    return users.some((user) => user.connected);
}

function areAllConnectedUsersFinished() {
    const connectedUsers = users.filter((user) => user.connected);
    if (connectedUsers.length === 0) {
        return false;
    }
    return connectedUsers.every((user) => user.qno >= TOTAL_QUESTIONS);
}

function endGameForEveryone() {
    if (gameEnded) {
        return;
    }
    gameEnded = true;
    if (roundTimer) {
        clearInterval(roundTimer);
        roundTimer = null;
    }
    io.emit("gameover", getSortedUsers());
}

function startRoundTimer() {
    if (roundTimer) {
        clearInterval(roundTimer);
    }
    roundTimeLeft = ROUND_SECONDS;
    io.emit("roundTimer", roundTimeLeft);
    roundTimer = setInterval(function () {
        roundTimeLeft -= 1;
        io.emit("roundTimer", Math.max(0, roundTimeLeft));
        if (roundTimeLeft <= 0) {
            clearInterval(roundTimer);
            roundTimer = null;
            endGameForEveryone();
        }
    }, 1000);
}

io.on('connection', function (socket) {
    console.log("New client connected");
    connectedCount++;
    const incomingClientId = socket.handshake.auth && socket.handshake.auth.clientId;
    const clientId = incomingClientId ? incomingClientId : socket.id;

    let user = users.find((existingUser) => existingUser.clientId === clientId);
    if (user) {
        user.id = socket.id;
        user.connected = true;
    }
    else {
        guestCounter++;
        user = { name: "Guest " + guestCounter, id: socket.id, score: 0, qno: 0, clientId: clientId, connected: true };
        users.push(user);
    }

    io.to(socket.id).emit("resumeState", { score: user.score, qno: user.qno });
    emitLeaderboard();

    if (!notStarted && !gameEnded) {
        io.to(socket.id).emit("roundTimer", Math.max(0, roundTimeLeft));
    }

    if (notStarted) {
        if (connectedCount >= 3) {
            timeleft = 10;
            console.log("Game is starting in 10 seconds")
            timeSender(true);
            notStarted = false;
        }
        else {
            io.emit('beforetimer', timeleft);
        }
    }
    else {
        if (gameEnded) {
            io.to(socket.id).emit("gameover", getSortedUsers());
        }
        else {
            timeSender(false, socket.id);
            if (user.qno >= TOTAL_QUESTIONS) {
                io.to(socket.id).emit("gameover", getSortedUsers());
            }
            else if (timeleft < 0) {
                io.to(socket.id).emit("quest", questions[user.qno])
            }
        }
    }

    socket.on("nextQuest", (ob) => {
        if (gameEnded) {
            io.to(socket.id).emit("gameover", getSortedUsers());
            return;
        }

        const activeUser = users.find((existingUser) => existingUser.id === socket.id);
        if (!activeUser) {
            return;
        }

        activeUser.score = ob.score;
        activeUser.qno = ob.qno;

        const sorted = getSortedUsers();
        io.emit("leaderboard", sorted)
        if (ob.qno >= TOTAL_QUESTIONS) {
            io.to(socket.id).emit("gameover", sorted);
            if (areAllConnectedUsersFinished()) {
                endGameForEveryone();
            }
        } else {
            io.to(socket.id).emit("quest", questions[ob.qno])
        }
    })

    socket.on('disconnect', () => {
        console.log("A client has disconnected");
        connectedCount = Math.max(0, connectedCount - 1);
        const disconnectedUser = users.find((existingUser) => existingUser.id === socket.id);
        if (disconnectedUser) {
            disconnectedUser.connected = false;
        }
        emitLeaderboard();

        if (!gameEnded && !hasAnyConnectedUser()) {
            if (roundTimer) {
                clearInterval(roundTimer);
                roundTimer = null;
            }
        }
    })
});



function quiz() {
    gameEnded = false;
    startRoundTimer();
    io.emit("quest", questions[0])
}




var timeleft = 10;
function timeSender(x, n) {
    if (x) {
        io.emit('timer', 10);
        var timer = setInterval(function () {
            if (timeleft <= 0) {
                quiz();
                clearInterval(timer);
            }
            timeleft -= 1;
        }, 1000);
    }
    else {
        io.to(n).emit('timer', timeleft)
    }
}



