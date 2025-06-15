var currentPlayerName;
var playersDetails = {};
var defaultColors = ['red', 'green', 'blue', 'yellow'];
var socket = io('localhost:8081');
var canvasId;

socket.on("player-connected", (data) => {

    currentPlayerName = 'Player_' + data.count;
    canvasId = '#canvas_' + data.count;
    document.querySelector('h3 span').innerText = currentPlayerName;
    playersDetails = data.playersDetails;
    loadGridtoCanvas();
});

socket.on("changeOtherPlayerColor", (data) => {
    playersDetails[data.name].color = data.selectedColor;
    console.log(playersDetails)
});

socket.on("otherPlayersConnected", (data) => {
    playersDetails = data;
    console.log(playersDetails) 
});

var updateAntColor = () => {
    var selectedColor = document.querySelector("#antColor").value;
    playersDetails[currentPlayerName].color = selectedColor;
    socket.emit("update_color", {selectedColor: selectedColor, name: currentPlayerName});
    document.querySelector("h3 span").style.color = selectedColor;
}
