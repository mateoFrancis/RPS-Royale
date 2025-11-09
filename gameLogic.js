// gameLogic.js

// All possible moves
const moves = ["rock", "paper", "scissors", "lizard", "spock"];

// Rules: each move beats certain other moves
const rules = {
  rock:     ["scissors", "lizard"],
  paper:    ["rock", "spock"],
  scissors: ["paper", "lizard"],
  lizard:   ["spock", "paper"],
  spock:    ["scissors", "rock"]
};

// Action phrases for each winning matchup
const actions = {
  rock: {
    scissors: "crushes",
    lizard: "crushes"
  },
  paper: {
    rock: "covers",
    spock: "disproves"
  },
  scissors: {
    paper: "cuts",
    lizard: "decapitates"
  },
  lizard: {
    spock: "poisons",
    paper: "eats"
  },
  spock: {
    scissors: "smashes",
    rock: "vaporizes"
  }
};

/**
 * Decide who wins between two players
 * @param {string} moveA - move chosen by player A
 * @param {string} userA - username of player A
 * @param {string} moveB - move chosen by player B
 * @param {string} userB - username of player B
 * @returns {string} winner's username or "draw"
 */
function getWinner(moveA, userA, moveB, userB) {
  if (moveA === moveB) return "draw";
  if (rules[moveA].includes(moveB)) return userA;
  return userB;
}

/**
 * Creates a descriptive sentence about the outcome
 * @param {string} moveA - move chosen by player A
 * @param {string} userA - username of player A
 * @param {string} moveB - move chosen by player B
 * @param {string} userB - username of player B
 * @returns {string} descriptive outcome
 */
function getOutcomeDescription(moveA, userA, moveB, userB) {
  if (moveA === moveB) {
    return `It's a draw! Both ${userA} and ${userB} chose ${moveA}.`;
  }

  if (rules[moveA].includes(moveB)) {
    const action = actions[moveA][moveB] || "beats";
    return `${userA}'s ${moveA} ${action} ${userB}'s ${moveB}.`;
  }

  const action = actions[moveB][moveA] || "beats";
  return `${userB}'s ${moveB} ${action} ${userA}'s ${moveA}.`;
}