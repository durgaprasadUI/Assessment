// client.js

const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const ruleInput = document.getElementById('ruleInput');
const updateRuleBtn = document.getElementById('updateRuleBtn');
const playerColorSpan = document.getElementById('playerColor');

// Connect to the WebSocket server
const socket = new WebSocket('ws://localhost:8080');

// Global state
let grid = [];
let gridSize = 100;      // default value; will be updated on init
let cellSize = 5;        // will be computed from canvas and grid size
let ants = [];
let placedAnt = false;   // flag: have we placed our ant yet?

// When the user updates the rule, send the new rule to the server.
updateRuleBtn.addEventListener('click', () => {
  const rule = ruleInput.value.trim();
  socket.send(JSON.stringify({ type: 'updateRule', rule }));
});

// On connection open…
socket.onopen = () => {
  console.log("Connected to server.");
};

// Process messages from server.
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'init') {
    // The server assigns your unique color and grid size.
    playerColorSpan.textContent = msg.color;
    playerColorSpan.style.color = msg.color;
    gridSize = msg.gridSize;
    cellSize = canvas.width / gridSize;
  } else if (msg.type === 'gridUpdate') {

    console.log('ants');
    console.log(ants);
    grid = msg.grid;
    ants = msg.ants;
    drawGrid();
    drawAnts();
  }
};

// On canvas clicks:
// – If user haven’t placed an ant yet, this click “places” your ant.
// – If user already placed, further clicks flip your tile (if you own it).
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  // Determine grid cell clicked.
  const x = Math.floor((event.clientX - rect.left) / cellSize);
  const y = Math.floor((event.clientY - rect.top) / cellSize);

  if (!placedAnt) {
    socket.send(JSON.stringify({ type: 'placeAnt', x, y }));
    placedAnt = true;
  } else {
    socket.send(JSON.stringify({ type: 'flipTile', x, y }));
  }
});

// Draw all grid cells.
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      let cellColor = grid[row][col];
      // Draw white if blank.
      ctx.fillStyle = cellColor ? cellColor : "#ffffff";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
}

// Draw ants as circles on top of the grid.
function drawAnts() {
  if (!ants) return;
  ants.forEach(ant => {
    ctx.beginPath();
    ctx.arc((ant.x + 0.5) * cellSize, (ant.y + 0.5) * cellSize, cellSize / 2, 0, 2 * Math.PI);
    ctx.fillStyle = ant.color;
    ctx.fill();
  });

  
}

// To change custom color
function updateCustomColor() {
  var color = document.querySelector("#customColor").value;
  socket.send(JSON.stringify({ type: 'updateColor', color }));
}