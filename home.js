

function sendPost(mode) {

  const name = $("#username-input").val().trim();
  
  if (!name) return alert("Please enter a username.");

  $.post("/api/enter", { username: name, mode: mode }, (response) => {
  
    window.location.href = response.redirect;
  });
}

$("#enter-match").on("click", () => sendPost("match"));
$("#enter-tournament").on("click", () => sendPost("tournament"));
