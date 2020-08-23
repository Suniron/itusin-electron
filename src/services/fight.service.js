const PathFindingService = require("./pathfinding.service");

const FigthService = {
    resolveDistanceFrom: (elements, sourceCellId) => {
        for (let element of elements) {
            element = FigthService.distanceBetweenTwoCells(sourceCellId, element);
        }
    },
    distanceBetweenTwoCells: (sourceCellId, element) => {
        const rowLength = 14;
        const colLength = 40;
        const grid = [];
        for (var i = 0, cellId = 0; i < colLength; i++) {
            var rowGrid = [];
            for (var j = 0; j < rowLength; j++) {
                rowGrid.push(cellId++);
            }
            grid[i] = rowGrid;
        }
        var aX = 0;
        var aY = 0;
        for (var i = 0; i < colLength; i++) {
            aY = i;
            for (var j = 0; j < rowLength; j++) {
                aX = j;
                if (grid[i][j] === sourceCellId) break;
            }
            if (grid[i][j] === sourceCellId) break;
        }
        var bX = 0;
        var bY = 0;
        for (var i = 0; i < colLength; i++) {
            bY = i;
            for (var j = 0; j < rowLength; j++) {
                bX = j;
                if (grid[i][j] === element.cellId) break;
            }
            if (grid[i][j] === element.cellId) break;
        }
        element.x = bX - aX;
        element.y = bY - aY;
        element.distance = Math.abs(aX - bX) + Math.abs(aY - bY)
        return element;
    },
    orderByDistanceAsc: (elements) => {
        elements.sort(FigthService.compareDistanceAsc);
    },
    compareDistanceAsc: (a, b) => {
        if (a.distance > b.distance) return 1;
        if (b.distance > a.distance) return -1;
        return 0;
    },
    cellsDiffRowPair: [-14,-13,14,15],
    cellsDiffRowOdd: [-15,-14,13,14],
    getAvailableCellsToMove: (rowPair, dofusAccount) => {
        var x = dofusAccount.characterCellId;
        var cells = [];
        if (rowPair) {
            for (var diff of FigthService.cellsDiffRowPair) {
                cells.push(parseInt(x) + diff);
            }
        } else {
            for (var diff of FigthService.cellsDiffRowOdd) {
                cells.push(parseInt(x) + diff);
            }
        }
        var walkableCells = [];
        for (var cell of cells) {
            if (PathFindingService.isWalkable(dofusAccount, cell, true)) {
                walkableCells.push({
                    cellId: cell,
                    distance: 0
                });
            }
        }
        return walkableCells;
    }
}

module.exports = FigthService;