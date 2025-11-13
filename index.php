<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RPS Royale – CSUB</title>

  <!-- Your CSS LAST so it wins the cascade -->
  <link rel="stylesheet" href="./style.css?v=5" />

  <!-- Libraries BEFORE your app script -->
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>

  <!-- Your app script -->
  <script src="./script.js?v=5" defer></script>
</head>

<body>
  <header class="site-header">
    <h1>RPS Royale</h1>
    <p>Rock • Paper • Scissors • Lizard • Spock</p>
  </header>

  <!-- Split-screen board -->
  <main class="board">
    <!-- LEFT: Player 1 -->
    <section id="panel-p1" class="panel left">
      <div class="panel-inner">
        <h2>Player 1</h2>
        <div class="buttons">
          <button class="move-btn blue" data-player="p1" data-move="rock">Rock</button>
          <button class="move-btn blue" data-player="p1" data-move="paper">Paper</button>
          <button class="move-btn blue" data-player="p1" data-move="scissors">Scissors</button>
          <button class="move-btn blue" data-player="p1" data-move="lizard">Lizard</button>
          <button class="move-btn blue" data-player="p1" data-move="spock">Spock</button>
        </div>
        <div class="status"><span>Last Choice:</span> <strong id="last-p1">—</strong></div>
      </div>
    </section>

    <!-- RIGHT: Player 2 -->
    <section id="panel-p2" class="panel right">
      <div class="panel-inner">
        <h2>Player 2</h2>
        <div class="buttons">
          <button class="move-btn gold" data-player="p2" data-move="rock">Rock</button>
          <button class="move-btn gold" data-player="p2" data-move="paper">Paper</button>
          <button class="move-btn gold" data-player="p2" data-move="scissors">Scissors</button>
          <button class="move-btn gold" data-player="p2" data-move="lizard">Lizard</button>
          <button class="move-btn gold" data-player="p2" data-move="spock">Spock</button>
        </div>
        <div class="status"><span>Last Choice:</span> <strong id="last-p2">—</strong></div>
      </div>
    </section>
  </main>

  <!-- Client log -->
  <footer class="console">
    <div class="console-header">Client Console</div>
    <pre id="client-log" class="console-body"></pre>
  </footer>
</body>
</html>

