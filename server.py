

from flask import Flask, send_from_directory, request, session, jsonify, render_template
from flask_socketio import SocketIO, join_room, emit, disconnect
import random
import os

from game_logic import resolve_round, best_of_n


app = Flask(__name__, static_folder=".")
socketio = SocketIO(app, cors_allowed_origins="*")
app.secret_key = "secretkey"

# queues
match_queue = []  # current round
next_round_queue = []  #next round (match_queue will copy to reuse for another ound)
rooms = {} 
tournament_queue = []
usernames = {}
active_matches = {}  



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
    
    if len(tournament_queue) < 6:
        return

    # take 10 players
    players = [tournament_queue.pop(0) for _ in range(6)]

    # create 5 matches for round 1
    for i in range(0, 6, 2):

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


def check_tournament_progress():

    if len(next_round_queue) >= 2:

        match_queue.extend(next_round_queue)
        next_round_queue.clear()

        match_making()


def advance_tournament():
   
    while len(next_round_queue) >= 2:

        players = [next_round_queue.pop(0) for _ in range(2)]
        p1, p2 = players
      
        room_id = f"tournament-{random.randint(20000,29999)}"
        rooms[room_id] = [p1, p2]
      
        join_room(room_id, sid=p1)
        join_room(room_id, sid=p2)

        emit("match_start", {
            "player_number": 1,
            "room": room_id,
            "opponent_username": usernames.get(p2)
        }, to=p1)

        emit("match_start", {
            "player_number": 2,
            "room": room_id,
            "opponent_username": usernames.get(p1)
        }, to=p2)



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

    usernames[sid] = data.get("username", f"Player-{sid[:5]}")

    username = usernames[sid]
    mode = data.get("mode") 

    if mode == "match":

        print(f"{username} joined match queue")
        match_queue.append(sid)
        print("Match queue:", match_queue)  # debug
        match_making()

    elif mode == "tournament":

        print(f"{username} joined tournament queue")
        tournament_queue.append(sid)
        print("Tournament queue:", tournament_queue)  # debug
        tournament_making()

        

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


@socketio.on("player_move")
def handle_player_move(data):

    sid = request.sid
    room_id = data["room"]
    move = data["move"]

    if room_id not in active_matches:
        active_matches[room_id] = {"moves": {}, "rounds": [], "best_of": 3}

    match = active_matches[room_id]
    match["moves"][sid] = move

    # Notify opponent
    for player_sid in rooms[room_id]:

        if player_sid != sid:

            emit("opponent_move", {
                "player": 1 if player_sid == rooms[room_id][0] else 2,
                "move": move
            }, to=player_sid)

    # wait for both players
    if len(match["moves"]) < 2:
        return

    # resolve round
    p1, p2 = rooms[room_id]
    move1 = match["moves"][p1]
    move2 = match["moves"][p2]
    round_result = resolve_round(move1, move2, p1, p2)

    match["rounds"].append(round_result)

    # Send round results
    for player_sid in rooms[room_id]:

        emit("round_result", {
            "winner": round_result["winner"],
            "move_p1": move1,
            "move_p2": move2,
            "result": round_result["result"]
        }, to=player_sid)

    # Reset moves for next round
    match["moves"] = {}

    # Best-of logic
    p1_wins = sum(1 for r in match["rounds"] if r["winner"] == p1)
    p2_wins = sum(1 for r in match["rounds"] if r["winner"] == p2)

    best_of = match["best_of"]

    match_over = (
        p1_wins > best_of // 2 or
        p2_wins > best_of // 2 or
        len(match["rounds"]) == best_of
    )

    if not match_over:
        return

    overall_winner = p1 if p1_wins > p2_wins else p2
    loser = p2 if overall_winner == p1 else p1

    # send match finished to both players
    for player_sid in rooms[room_id]:

        emit("match_finished", {
            "overall_winner": overall_winner,
            "rounds": match["rounds"]
        }, to=player_sid)

    # redirect loser for both 1v1 and tournaments
    emit("redirect_loser", {"url": "/"}, to=loser)

    # winner handling (applies to both game modes)
    is_tournament = room_id.startswith("tournament")

    if is_tournament:
        
        # winner goes into next round queue
        next_round_queue.append(overall_winner)
        emit("winner_waiting", {"message": "Waiting for next opponent..."}, to=overall_winner)

        advance_tournament()

        # check tournament status
        if tournament_is_finished():

            final_winner = get_final_winner()
            emit("tournament_finished", {"winner": final_winner}, broadcast=True)
            reset_tournament_state()

    else:
        # normal 1v1, winner goes back to match queue
        emit("winner_waiting", {"message": "Waiting for next match..."}, to=overall_winner)
        match_queue.append(overall_winner)
        try_matchmaking()

    # clean up the room
    del active_matches[room_id]
    rooms.pop(room_id, None)




if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8000, debug=True)
