const loadJsonFile = require("load-json-file");

const MapService = {
    resolveMapPosition: async (mapId) => {
        try {
            var mapPositions = await loadJsonFile("assets/ressources/MapPositions.json");
        } catch (e) {
            return 0;
        }
        return mapPositions[mapId] ? mapPositions[mapId].posX + ", " + mapPositions[mapId].posY : 0;
    }

}

module.exports = MapService;