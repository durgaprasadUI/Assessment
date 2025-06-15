var currentPlayerName;
var playersDetails = {};
var defaultColors = ['red', 'green', 'blue', 'yellow'];
var socket = io('localhost:8081');

socket.on("player-connected", (data) => {
    currentPlayerName = 'Player_' + data.count;
    playersDetails = data.playersDetails;
    console.log(playersDetails)
});

socket.on("changeOtherPlayerColor", (data) => {
    playersDetails[data.name].color = data.selectedColor;
    console.log(playersDetails)
});

socket.on("otherPlayersConnected", (data) => {
    playersDetails = data;
    console.log(playersDetails)
})

var updateAntColor = () => {
    var selectedColor = document.querySelector("#antColor").value;
    playersDetails[currentPlayerName].color = selectedColor;
    socket.emit("update_color", {selectedColor: selectedColor, name: currentPlayerName})
}


