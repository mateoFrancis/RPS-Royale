// Emits socket events, updates "Last Choice", and spawns a flying token
$(function () {
  //const socket = io("http://localhost:6000", { transports: ["websocket"] });

  // icon set (easy to swap with image URLs later)
  const icons = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️",
    lizard: "🦎",
    spock: "🖖",
  };

  function log(msg){
    console.log(msg);
    const el = document.getElementById("client-log");
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  }

/*
  socket.on("connect", () => log(`Connected (id: ${socket.id})`));
  socket.on("disconnect", r => log(`Disconnected: ${r}`));
  socket.on("server_message", d => log(`server_message: ${JSON.stringify(d)}`));
*/

  // Create a token that flies in from the center line to the player's side
  function spawnFlyingToken(panelEl, move) {
    const token = document.createElement("div");
    token.className = "fly-token";
    token.textContent = icons[move] || "❔";

    // randomize vertical a bit for variety
    const randY = 30 + Math.floor(Math.random() * 40); // 30%..70%
    token.style.setProperty("--y", randY + "%");

    panelEl.appendChild(token);

    // remove when animation finishes
    token.addEventListener("animationend", () => token.remove());
  }

  
  $(document).on("click", ".move-btn", function () {
    const player = $(this).data("player"); // "p1" or "p2"
    const move   = $(this).data("move");   // rock|paper|scissors|lizard|spock

    // Update labels
    $(`#last-${player}`).text(move.toUpperCase());

    // Emit socket event (your server prints this)
   // socket.emit("player_move", { player, move });
    log(`${player} chose ${move}`);

    // Visual: throw a token from the center into the player's panel
    const panel = document.getElementById(player === "p1" ? "panel-p1" : "panel-p2");
    spawnFlyingToken(panel, move);
  });
  
});

