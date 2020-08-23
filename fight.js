console.log('fight');

var cellsDiffRowPair = [-14,-13,14,15];
var cellsDiffRowOdd = [-15,-14,13,14];
function getAvailableCellsToMove(rowPair, characterCellId) {
    var x = characterCellId;
    var cells = [];
    if (rowPair) {
        for (var diff of cellsDiffRowPair) {
            cells.push(x + diff);
        }
    } else {
        for (var diff of cellsDiffRowOdd) {
            cells.push(x + diff);
        }
    }


    return cells;
}

console.log(getAvailableCellsToMove(true, 72));
console.log(getAvailableCellsToMove(false, 58));