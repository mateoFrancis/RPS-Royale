
const socket = io("http://localhost:8000", { transports: ["websocket"] });

// both assigned by server
let playerNumber = null;
let room = null;

// move buttons
$(document).on("click", ".move-btn", function () {

    if (!playerNumber || !room) {

        console.log("Waiting for a match");
        return;
    }

    let $btn = $(this);
    let move =  $btn.data("move"); // rock, paper, scissors, etc.

    // send to server
    socket.emit("player_move", {
        room: room,
        player: playerNumber, // 1 or 2
        move: move,
    });

    $(`#last-p${playerNumber}`).text(move.toUpperCase()); // player's last choice
    //console.log(`You chose ${move}`);
});

// join match button
$(document).on("click", "#join-match-btn", function () {

    console.log("Joining match queue...");

    socket.emit("join_match");  // tells server the player is ready
});



/*** server/client events ***/

// comfirms connection
socket.on("connect", () => {

    console.log(`Connected! Socket ID: ${socket.id}`);    
});

// disconnects
socket.on("disconnect", (reason) => {

  console.log(`Disconnected`);
});

// match found
socket.on("match_start", (data) => {

  playerNumber = data.player_number;
  room = data.room;

  console.log(`Match found! You are Player ${playerNumber} in room ${room}`);
});


socket.on("opponent_move", (data) => {

  let opponent = data.player;
  let move = data.move;

  // opponent's last choice
  $(`#last-p${opponent}`).text(move.toUpperCase());
  //console.log(`Opponent chose ${move}`);

});

socket.on("round_result", (data) => {

  let {winner, move_p1, move_p2} = data;

  console.log(`Round result: Player 1 chose ${move_p1}, Player 2 chose ${move_p2}. Winner: ${winner}`);
});