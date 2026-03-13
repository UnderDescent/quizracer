let express = require('express');
let socket = require('socket.io');
let nop = 0;
let notStarted = true;

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

io.on('connection', function (socket) {
    console.log("New client connected");
    nop++;
    let score = 0
    let name = "Guest " + nop
    users[nop - 1] = ({ name: name, id: socket.id, score: score });

    if (nop >= 3) {
        if (notStarted) {
            timeleft = 10;
            console.log("Game is starting in 10 seconds")
            timeSender(true, socket.id);
            notStarted = false;
        }
        else {
            timeSender(false, socket.id);
        }

    }
    else {
        io.emit('beforetimer', timeleft);
    }

    socket.on("nextQuest", (ob) => {
        for (let j = 0; j < users.length; j++) {
            if (users[j].id == socket.id) {
                users[j].score = ob.score;
            }
        }
        io.emit("score", users)
        if (ob.qno >= TOTAL_QUESTIONS) {
            const sorted = [...users].sort((a, b) => b.score - a.score);
            io.emit("gameover", sorted);
        } else {
            io.to(socket.id).emit("quest", questions[ob.qno])
        }
    })

    socket.on('disconnect', () => {
        console.log("A client has disconnected");
        nop--;
    })
});



function quiz() {
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
        if (timeleft >= 0) {
            io.to(n).emit('timer', timeleft)
        }
        else {
            io.to(n).emit('timer', timeleft)
        }
    }
}



