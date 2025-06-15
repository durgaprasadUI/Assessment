/* -------------- ANT moves controllers*/

var leftColor = 'black';
var rightColor = 'white';


var updateLeftColor = () => {
    leftColor = document.querySelector("#leftColor").value;
}

var updaterightColor = () => {
    leftColor = document.querySelector("#rightColor").value;
}
var loadGridtoCanvas = () => {
    const canvas = document.querySelector(canvasId);
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const cellSize = 20;
    const cols = width / cellSize;
    const rows = height / cellSize;
    

    // Initialize grid (false = white, true = black)
    const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    console.log(grid);// Ant properties

    let antX = Math.floor(cols / 2);
    let antY = Math.floor(rows / 2);
    let direction = 0; // 0=up, 1=right, 2=down, 3=left

    function drawCell(x, y, state) {
        ctx.fillStyle = state ? leftColor : rightColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  
    function drawAnt(x, y) {
        ctx.fillStyle = playersDetails[currentPlayerName].color; //user selected color
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }

    function update() {
        const current = grid[antY][antX];
        // Turn and flip color
        direction = current ? (direction + 3) % 4 : (direction + 1) % 4;
        grid[antY][antX] = !current;

        // Redraw cell
        drawCell(antX, antY, grid[antY][antX]);

        // Move forward
        switch (direction) {
            case 0: antY = (antY - 1 + rows) % rows; break; // up
            case 1: antX = (antX + 1) % cols; break;       // right
            case 2: antY = (antY + 1) % rows; break;       // down
            case 3: antX = (antX - 1 + cols) % cols; break; // left
        }

        drawAnt(antX, antY);
    }

    function loop() {
        for (let i = 0; i < 100; i++) {
          update();
        }
      //   setInterval(() => {
      //     loop();
      //   }, 5000)
         requestAnimationFrame(loop);
    }
  
      // Initialize white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
  
      loop(); // Start simulation
};

