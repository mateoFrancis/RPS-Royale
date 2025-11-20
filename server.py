

from flask import Flask, send_from_directory, request, session, jsonify, render_template
from flask_socketio import SocketIO, join_room, emit, disconnect
import random
import os


app = Flask(__name__, static_folder=".")
socketio = SocketIO(app, cors_allowed_origins="*")
app.secret_key = "secretkey"

# queues
match_queue = []  # current round
next_round_queue = []  #next round (match_queue will copy to reuse for another ound)
rooms = {} 
tournament_queue = []
usernames = {}

def match_making():

    while len(match_queue) >= 2:

        p1 = match_queue.pop(0)
        p2 = match_queue.pop(0)

        room_id = f"room-{random.randint(1000,9999)}"
        rooms[room_id] = [p1, p2]

        join_room(room_id, sid=p1)
        join_room(room_id, sid=p2)


        emit("match_start", {

            "player_number": 1,
            "room": room_id,
            "opponent_username": usernames.get(p2, "Player 2")
        }, to=p1)

        emit("match_start", {
            
            "player_number": 2,
            "room": room_id,
            "opponent_username": usernames.get(p1, "Player 1")
        }, to=p2)

def tournament_making():
    
    if len(tournament_queue) < 10:
        return

    # take 10 players
    players = [tournament_queue.pop(0) for _ in range(10)]

    # create 5 matches for round 1
    for i in range(0, 10, 2):

        p1, p2 = players[i], players[i+1]

        room_id = f"tournament-{random.randint(10000,19999)}"
        rooms[room_id] = [p1, p2]

        join_room(room_id, sid=p1)
        join_room(room_id, sid=p2)

        emit("match_start", {
            "player_number": 1,
            "room": room_id,
            "opponent_username": usernames.get(p2, "Player 2")
        }, to=p1)

        emit("match_start", {
            "player_number": 2,
            "room": room_id,
            "opponent_username": usernames.get(p1, "Player 1")
        }, to=p2)



def remove_from_queues(sid):

    if sid in match_queue:
        match_queue.remove(sid)

    if sid in tournament_queue:
        tournament_queue.remove(sid)

    if sid in next_round_queue:
        next_round_queue.remove(sid)


def remove_from_rooms(sid):
    for room_id, players in list(rooms.items()):  # list() to allow deletion
       
        if sid in players:
            players.remove(sid)

            # notify other player if exists
            if players:

                other_sid = players[0]
                emit("opponent_disconnected", {}, to=other_sid)

            # delete room
            del rooms[room_id]


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

    sid = request.sid
    usernames[sid] = session.get("username")

    print("User connected!")

@socketio.on("disconnect")
def handle_disconnect():
    
    sid = request.sid
    print(f"User disconnected: {sid}")

    # remove user from queues and rooms
    remove_from_queues(sid)
    remove_from_rooms(sid)

    # remove stored username
    usernames.pop(sid, None)


@socketio.on("join_queue")
def handle_join_queue(data):

    sid = request.sid
    usernames[sid] = session.get("username") 

    username = session.get("username")
    mode = session.get("mode")

    if mode == "match":

        print(f"{username} joined match queue")
        match_queue.append(sid)
        match_making()

    elif mode == "tournament":

        print(f"{username} joined tournament queue")
        tournament_queue.append(sid)
        tournament_making()
        

@socketio.on("match_result") # not tested yet (no progress)
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


@app.route("/api/enter", methods=["POST"])
def enter():

    session["username"] = request.form.get("username")
    session["mode"] = request.form.get("mode")  # match or tournament

    return jsonify({"redirect": "/match"})


@app.route("/match")
def match_page():
    return send_from_directory(".", "match.html")


@app.route('/api/mode')
def api_config():
    return jsonify({
    'username': session.get("username"),
    'mode': session.get("mode")
    })


#@socketio.on("player_move") 
#def round_result(data):


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, debug=True)
