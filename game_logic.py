"""
Game logic for RPS Royale (Rock, Paper, Scissors, Lizard, Spock).
This module is independent of Flask/Socket.IO and can be imported
by the server to resolve moves and manage match outcomes.
"""

from enum import Enum

class Move(Enum):
    ROCK = "rock"
    PAPER = "paper"
    SCISSORS = "scissors"
    LIZARD = "lizard"
    SPOCK = "spock"

# Rules: each move beats two others
WIN_RULES = {
    Move.ROCK:     [Move.SCISSORS, Move.LIZARD],
    Move.PAPER:    [Move.ROCK, Move.SPOCK],
    Move.SCISSORS: [Move.PAPER, Move.LIZARD],
    Move.LIZARD:   [Move.SPOCK, Move.PAPER],
    Move.SPOCK:    [Move.SCISSORS, Move.ROCK],
}

def resolve_round(move1: str, move2: str, player1_id: str, player2_id: str):
    """
    Resolve a round given two moves.
    Returns a dict with winner, loser, and result type.
    """
    try:
        m1 = Move(move1.lower())
        m2 = Move(move2.lower())
    except ValueError:
        return {"error": "Invalid move"}

    if m1 == m2:
        return {
            "winner": None,
            "loser": None,
            "result": "tie"
        }

    if m2 in WIN_RULES[m1]:
        return {
            "winner": player1_id,
            "loser": player2_id,
            "result": f"{m1.value} beats {m2.value}"
        }
    else:
        return {
            "winner": player2_id,
            "loser": player1_id,
            "result": f"{m2.value} beats {m1.value}"
        }

def best_of_n(moves_p1, moves_p2, n=3, player1_id="p1", player2_id="p2"):
    """
    Play a best-of-n series. Each list should contain n moves.
    Returns overall winner and round-by-round results.
    """
    results = []
    score_p1 = score_p2 = 0

    for i in range(n):
        r = resolve_round(moves_p1[i], moves_p2[i], player1_id, player2_id)
        results.append(r)
        if r["winner"] == player1_id:
            score_p1 += 1
        elif r["winner"] == player2_id:
            score_p2 += 1

    if score_p1 > score_p2:
        overall = player1_id
    elif score_p2 > score_p1:
        overall = player2_id
    else:
        overall = None  # tie

    return {
        "rounds": results,
        "score": {player1_id: score_p1, player2_id: score_p2},
        "overall_winner": overall
    }
