

$(document).ready(function() {

  // Connect to socket.io server
  const socket = io('http://localhost:6000');

  // connected to flask
  socket.on('connect', function() {

    console.log('connected to Flask server');
  });

  // handle server messages
  socket.on('server_message', function(data) {

    console.log('Message from server:', data);
  });


  // button events
  $("#btn1").click(function() {

    socket.emit('button_press', { button: 'Button 1' });
  });

  $("#btn2").click(function() {

    socket.emit('button_press', { button: 'Button 2' });
  });

});
