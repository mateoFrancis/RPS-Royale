

from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, join_room, emit, disconnect
import random
import os


app = Flask(__name__, static_folder=".")
socketio = SocketIO(app, cors_allowed_origins="*")

# Queues
match_queue = []  # current round
next_round_queue = []  #next round (match_queue will copy to reuse for another ound)
rooms = {} 

def match_making():
    
    # pair players 2 at a time from match_queue into rooms
    while len(match_queue) >= 2:

        p1 = match_queue.pop(0)
        p2 = match_queue.pop(0)

        room_id = f"room-{random.randint(1000,9999)}"
        rooms[room_id] = [p1, p2]

        join_room(room_id, sid=p1)
        join_room(room_id, sid=p2)

        # send number and room to client
        emit("match_start", {"player_number": 1, "room": room_id}, to=p1)
        emit("match_start", {"player_number": 2, "room": room_id}, to=p2)

# serve index.html
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# serve static files (js, css)
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)


# socket connection
@socketio.on('connect')
def handle_connect():
    print("Client connected!")


@socketio.on("join_match")
def handle_join_match():
    sid = request.sid
    print(f"{sid} joined the queue")
    match_queue.append(sid)

    # match players
    match_making()

@socketio.on("match_result")
def match_result(data):

    winner_sid = data["winner"]
    room_id = data["room"]

    print(f"Match {room_id} finished. Winner: {winner_sid}")

    # add winner to next round queue
    next_round_queue.append(winner_sid)

    rooms.pop(room_id, None)

    # if the current round is over, start next round
    if not match_queue and len(next_round_queue) >= 2:

        # move winners to match_queue for next round
        match_queue.extend(next_round_queue)
        next_round_queue.clear()

        match_making()


if __name__ == "__main__":
    socketio.run(app, host="localhost", port=8000, debug=True)
