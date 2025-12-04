

//const socket = io("http://localhost:8000", { transports: ["websocket"] });
//const socket = io("http://10.55.8.120:8000", { transports: ["websocket"] });
const socket = io("http://192.168.1.122:8000", { transports: ["websocket"] });
//const socket = io("http://192.168.0.178:8000", { transports: ["websocket"] });


// both assigned by server
let playerNumber = null;
let room = null;
let gameMode = null;
let hasChosen = false;


fetch("/api/mode")
  .then(res => res.json())
  .then(cfg => {

    window.gameMode = cfg.mode; 
    window.username = cfg.username;
    console.log("Game mode loaded:", window.gameMode);
  })
  .catch(err => console.error("Failed to fetch game mode:", err));



// move buttons
$(document).on("click", ".move-btn", function () {

    if (!playerNumber || !room) {
        console.log("Waiting for a match");
        return;
    }

    if (hasChosen) {
        console.log("You already made your choice this round!");
        return;
    }

    let $btn = $(this);
    let move =  $btn.data("move"); // rock, paper, scissors, etc.

    // disable buttons immediately to prevent spamming
    $(".move-btn").prop("disabled", true);

    // send to server
    socket.emit("player_move", {
        room: room,
        player: playerNumber, // 1 or 2
        move: move,
    });

    $(`#last-p${playerNumber}`).text(move.toUpperCase()); // player's last choice
    hasChosen = true;
});


// join match button

/*
$(document).on("click", "#join-match-btn", function () {

    console.log("Joining match queue...");

    socket.emit("join_match");  // tells server the player is ready
});
*/


/*** server/client events ***/

// comfirms connection
socket.on("connect", () => {

  console.log(`Connected! Socket ID: ${socket.id}`);

  const interval = setInterval(() => {

    if (window.gameMode && window.username) {

      socket.emit("join_queue", { mode: window.gameMode, username: window.username });
      clearInterval(interval);

      $("#panel-p1 h2").text(window.username);
      $("#panel-p2 h2").text("Waiting for Player...");

    }

  }, 50);
});

// disconnects
socket.on("disconnect", () => {

    console.log("Disconnected, returning to home page.");

    // Optional alert
    alert("Connection lost. Returning to home page.");
    window.location.href = "/";
});

// match found
socket.on("match_start", (data) => {

    playerNumber = data.player_number; // 1 or 2
    room = data.room;

    console.log(`Match found! You are Player ${playerNumber} in room ${room}`);

    if (playerNumber === 1) {

        $("#panel-p1 h2").text(window.username);
        $("#panel-p2 h2").text(data.opponent_username);
    } 
    else if (playerNumber === 2) {

        $("#panel-p2 h2").text(window.username);
        $("#panel-p1 h2").text(data.opponent_username);
    }

    // change board to show match was found
    $(".board").css("border", "5px solid yellow");

    $("#client-log").append(`\nMatch found! Room: ${room}, you are player ${playerNumber}`);
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

    // reset buttons for next round
    $(".move-btn").prop("disabled", false);
    hasChosen = false;
});

socket.on("redirect_loser", (data) => {

    console.log("You lost the match, returning to home page.");
    window.location.href = data.url;
});


socket.on("winner_waiting", (data) => {

    $(".board").css("border", "2px solid gray"); // reset board highlight
    $(".move-btn").prop("disabled", false);

    hasChosen = false;

        if (window.gameMode === "tournament") {

            if (playerNumber === 1) {

                $("#panel-p2 h2").text("Waiting for Player...");
            } 
            else if (playerNumber === 2) {

                $("#panel-p1 h2").text("Waiting for Player...");
            }
    }
});

socket.on("tournament_finished", (data) => {

    alert(`Tournament finished! Winner SID: ${data.winner}`);
    window.location.href = "/"; // back to home page or redirect to a results page
});
