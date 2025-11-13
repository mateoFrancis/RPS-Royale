$(function () {
  const socket = io("http://localhost:6000", { transports: ["websocket"] });

  function log(msg){
    console.log(msg);
    const el = document.getElementById("client-log");
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  }

  socket.on("connect", () => log(`Connected (id: ${socket.id})`));
  socket.on("disconnect", r => log(`Disconnected: ${r}`));
  socket.on("server_message", d => log(`server_message: ${JSON.stringify(d)}`));

  $(document).on("click", ".move-btn", function () {
    const player = $(this).data("player"); // "p1" or "p2"
    const move   = $(this).data("move");   // rock|paper|scissors|lizard|spock
    $(`#last-${player}`).text(move.toUpperCase());
    socket.emit("player_move", { player, move }); // server prints this
    log(`${player} chose ${move}`);
  });
});

