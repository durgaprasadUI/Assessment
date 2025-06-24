// server.js

const WebSocket = require('ws');

const PORT = 8080;
const gridSize = 100;   // A 100x100 grid. (Can be scaled to 1000+)
const tickInterval = 250; // 250 ms per step

// Initialize grid as a 2D array filled with null (white).
const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

// Use a Map to track players (by their WebSocket connection) with an object:
// { color: string, ant: object|null, ruleStr: string, rule: Array }
const players = new Map();
// List that holds all ant objects.
const ants = [];

// Directions: 0 = up, 1 = right, 2 = down, 3 = left.
const directions = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 }
];

// Returns a hex color string.
function randomColor() {
  const color = '#' + Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return color;
}

/*
  Parse a two-letter rule string.
  Expect a string such as "RL". We interpret this as:
    - For state 0 (blank or tile not matching player’s color): if letter is 'R', turn right and set cell to state 1;
    - For state 1 (tile in player's color): if letter is 'L', turn left and set cell to white (state 0).
  (Letters other than R or L default to R for state 0 and L for state 1.)
*/
function parseRule(ruleStr) {
  if (ruleStr.length < 2) {
    ruleStr = "RL";
  }
  const ruleArr = [];
  // For state 0:
  if (ruleStr[0].toUpperCase() === 'R') {
    ruleArr[0] = { turn: 'R', newState: 1 };
  } else if (ruleStr[0].toUpperCase() === 'L') {
    ruleArr[0] = { turn: 'L', newState: 1 };
  } else {
    ruleArr[0] = { turn: 'R', newState: 1 };
  }
  // For state 1:
  if (ruleStr[1].toUpperCase() === 'R') {
    ruleArr[1] = { turn: 'R', newState: 0 };
  } else if (ruleStr[1].toUpperCase() === 'L') {
    ruleArr[1] = { turn: 'L', newState: 0 };
  } else {
    ruleArr[1] = { turn: 'L', newState: 0 };
  }
  return ruleArr;
}

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', ws => {
  const color = randomColor();
  const defaultRuleStr = "RL";
  const rule = parseRule(defaultRuleStr);
  players.set(ws, { color, ant: null, ruleStr: defaultRuleStr, rule });
  
  // Send an init message with your assigned color, default rule, and grid size.
  ws.send(JSON.stringify({ type: 'init', color, rule: defaultRuleStr, gridSize }));

  ws.on('message', message => {
    try {
      const msg = JSON.parse(message);
      const player = players.get(ws);
      console.log("player");
      console.log(player);
      if (!player) return;
      
      if (msg.type === 'placeAnt') {
        // Only allow placing one ant per player.
        if (player.ant == null) {
          // Coerce coordinates inside grid bounds.
          const x = Math.max(0, Math.min(gridSize - 1, msg.x));
          const y = Math.max(0, Math.min(gridSize - 1, msg.y));
          const ant = {
            x, y,
            dir: 0,  // default direction: up.
            color: player.color,
            rule: player.rule  // use player's current rule (an array for two states).
          };
          player.ant = ant;
          ants.push(ant);
        }
      } else if (msg.type === 'flipTile') {
        // Allow flipping only if the tile belongs to this player.
        const x = Math.max(0, Math.min(gridSize - 1, msg.x));
        const y = Math.max(0, Math.min(gridSize - 1, msg.y));
        if (grid[y][x] === player.color) {
          grid[y][x] = null;
        } else if (grid[y][x] === null) {
          grid[y][x] = player.color;
        }
      } else if (msg.type === 'updateRule') {
        // Update player's rule based on user input.
        const newRuleStr = msg.rule;
        const newRule = parseRule(newRuleStr);
        player.ruleStr = newRuleStr;
        player.rule = newRule;
        // If the player already has an ant, update its rule.
        if (player.ant) {
          player.ant.rule = newRule;
        }
      } else if (msg.type == 'updateColor') {
        console.log('msg');
        console.log(msg);

        player.color = msg.color;
        players.set(ws, player);
        console.log(players);

        console.log('ants')
        console.log(ants)
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });


  ws.on('close', () => {
    const player = players.get(ws);
    if (player && player.ant) {
      const index = ants.indexOf(player.ant);
      if (index !== -1) {
        ants.splice(index, 1);
      }
    }
    players.delete(ws);
  });
});

// Server tick: every 250ms, update every ant and broadcast the grid.
setInterval(() => {
  // Process each ant sequentially.
  ants.forEach(ant => {
    // Determine the effective state:
    // If the cell’s color equals the ant’s color, consider it state 1; else state 0.
    const currentCellColor = grid[ant.y][ant.x];
    const effectiveState = (currentCellColor === ant.color) ? 1 : 0;
    const ruleAction = ant.rule[effectiveState];

    // Update ant’s direction.
    if (ruleAction.turn === 'R') {
      ant.dir = (ant.dir + 1) % 4;
    } else if (ruleAction.turn === 'L') {
      ant.dir = (ant.dir + 3) % 4;
    }
    
    // Update cell state: newState 1 means paint with ant’s color; 0 means blank.
    grid[ant.y][ant.x] = (ruleAction.newState === 1) ? ant.color : null;
    
    // Move the ant forward one step (with wrapping).
    ant.x = (ant.x + directions[ant.dir].dx + gridSize) % gridSize;
    ant.y = (ant.y + directions[ant.dir].dy + gridSize) % gridSize;
  });

  // Broadcast an update including the grid and current ant positions.
  const payload = JSON.stringify({ type: 'gridUpdate', grid, ants });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}, tickInterval);

console.log(`WebSocket server is running on ws://localhost:${PORT}`);