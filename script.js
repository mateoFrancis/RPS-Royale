// Emits socket events, updates "Last Choice", and spawns a flying token
$(function () {
  // We use the global `socket` created in events.js

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
    if (!el) return;
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

  // Click handler for move buttons (visual + logging only)
  $(document).on("click", ".move-btn", function () {
    const player = $(this).data("player"); // "p1" or "p2"
    const move   = $(this).data("move");   // rock|paper|scissors|lizard|spock

    // Update labels
    $(`#last-${player}`).text(move.toUpperCase());

    // Emit socket event (handled in events.js), left commented on this file
    // socket.emit("player_move", { player, move });
    log(`${player} chose ${move}`);

    // Visual: throw a token from the center into the player's panel
    const panel = document.getElementById(player === "p1" ? "panel-p1" : "panel-p2");
    if (panel) {
      spawnFlyingToken(panel, move);
    }
  });

  // =========================
  // Move button hover tooltip
  // =========================

  // One shared tooltip element attached to <body>
  const $tooltip = $("<div class='move-tooltip'></div>").appendTo("body").hide();

  // Show tooltip on hover
  $(document).on("mouseenter", ".move-btn", function (e) {
    const text = $(this).data("tooltip");
    if (!text) return;

    $tooltip.text(text).show();
    positionTooltip(e);
  });

  // Follow the mouse while hovering
  $(document).on("mousemove", ".move-btn", function (e) {
    positionTooltip(e);
  });

  // Hide tooltip when leaving the button
  $(document).on("mouseleave", ".move-btn", function () {
    $tooltip.hide();
  });

  function positionTooltip(e) {
    const padding = 10;
    const tooltipHeight = $tooltip.outerHeight();
    const left = e.pageX + padding;
    const top = e.pageY - tooltipHeight - padding;

    $tooltip.css({
      left: left + "px",
      top: top + "px"
    });
  }

  // ======================
  // Result overlay logic
  // ======================

  let redirectUrl = "/";
  let countdownInterval = null;

  // Helper: show overlay as winner or loser
  function showResultOverlay(mode) {
    clearInterval(countdownInterval);

    const $overlay   = $("#result-overlay");
    const $title     = $("#result-title");
    const $subtitle  = $("#result-subtitle");
    const $countSpan = $("#result-count");
    const $rain      = $("#result-rain");

    if (!$overlay.length) return; // safety if not on match page

    // Reset rain container
    $rain.empty();

    // Configure content
    let duration = 5;
    $countSpan.text(duration.toString());

    if (mode === "winner") {
      $title.text("WINNER!");
      $subtitle.text("You won the match! 🎉");
      spawnRain($rain, "🎉");
    } else {
      $title.text("YOU LOST");
      $subtitle.text("Better luck next time 😢");
      spawnRain($rain, "😢");
    }

    // Show overlay
    $overlay.addClass("show");

    // Countdown
    countdownInterval = setInterval(() => {
      duration -= 1;
      $countSpan.text(duration.toString());

      if (duration <= 0) {
        clearInterval(countdownInterval);

        if (mode === "winner") {
          // Hide overlay and continue to waiting queue / next opponent
          $overlay.removeClass("show");
          $rain.empty();
        } else {
          // Redirect loser to home screen
          window.location.href = redirectUrl || "/";
        }
      }
    }, 1000);
  }

  // Helper: create falling emojis/confetti
  function spawnRain($container, emoji) {
    const total = 40;

    for (let i = 0; i < total; i++) {
      const $item = $("<span class='rain-emoji'></span>").text(emoji);

      const leftPercent = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 3 + Math.random() * 2;

      $item.css({
        left: leftPercent + "vw",
        animationDelay: delay + "s",
        animationDuration: duration + "s"
      });

      $container.append($item);
    }
  }

  // ============================
  // Player side highlight / lock
  // ============================

  let myPlayerNumber = null; // 1 or 2

  function applyPlayerHighlight() {
    $(".panel").removeClass("panel-active");

    if (myPlayerNumber === 1) {
      $("#panel-p1").addClass("panel-active");
    } else if (myPlayerNumber === 2) {
      $("#panel-p2").addClass("panel-active");
    }

    // Reset board border back to default so only the panel stands out
    $(".board").css("border", "1px solid rgba(255,255,255,.2)");
  }

  // Disable the OTHER side's buttons so you can only click your own side
  function updateButtonAccess() {
    if (!myPlayerNumber) return;

    if (myPlayerNumber === 1) {
      $("#panel-p2 .move-btn").prop("disabled", true);
    } else if (myPlayerNumber === 2) {
      $("#panel-p1 .move-btn").prop("disabled", true);
    }
    // We never force-enable our own buttons here; events.js is still free
    // to disable them after a choice to prevent spamming.
  }

  // ===========================
  // Hook into socket events
  // ===========================

  if (typeof socket !== "undefined") {

    // Overall match finished (both winner and loser)
    socket.on("match_finished", (data) => {
      const overallWinner = data.overall_winner; // SID of winner

      if (overallWinner === socket.id) {
        // We are the winner
        showResultOverlay("winner");
      } else {
        // We lost – overlay will be triggered on redirect_loser when we know the URL
      }
    });

    // Override the default redirect_loser handler from events.js
    // (this prevents instant redirect and lets us show our overlay)
    socket.off("redirect_loser");
    socket.on("redirect_loser", (data) => {
      redirectUrl = (data && data.url) || "/";
      showResultOverlay("loser");
    });

    // When a match starts, remember which player we are and highlight that side
    socket.on("match_start", (data) => {
      myPlayerNumber = data.player_number; // 1 or 2
      applyPlayerHighlight();
      updateButtonAccess();
    });

    // After each round, events.js re-enables buttons; we immediately
    // re-lock the opponent's side.
    socket.on("round_result", () => {
      updateButtonAccess();
    });

    // When we're waiting as the winner, keep our panel highlighted and
    // the opponent side locked.
    socket.on("winner_waiting", () => {
      $(".board").css("border", "1px solid rgba(255,255,255,.2)");
      applyPlayerHighlight();
      updateButtonAccess();
    });
  }

});

