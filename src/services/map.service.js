const loadJsonFile = require("load-json-file");

const MapService = {

    mapPositions: {},

    initialize: async () => {
        try {
            MapService.mapPositions = await loadJsonFile("assets/ressources/MapPositions.json");
        } catch (e) {
            console.error("error during initialize MapService");
        }
    },

    resolveMapPosition: async (mapId) => {
        return MapService.mapPositions[mapId] ? MapService.mapPositions[mapId].posX + "," + MapService.mapPositions[mapId].posY : 0;
    },

    resolveMap: async (mapId) => {
        return new Promise((resolve) => {
            fetch(`https://dofustouch.cdn.ankama.com/assets/2.31.2_GgYeQVuuYVUEkPO6ozwD0cOQeo-E%27y%27e/maps/${mapId}.json`, {
                "method": "GET",
            })
            .then((resp) => resp.json())
            .then((data) => resolve(data));
        });
    },

    resolveNewMapId: (map, dir) => {
        let newMapId;
        switch (dir) {
            case "top": newMapId = map.topNeighbourId;
                break;
            case "right": newMapId = map.rightNeighbourId;
                break;
            case "bottom": newMapId = map.bottomNeighbourId;
                break;
            case "left": newMapId = map.leftNeighbourId;
                break;
            default: null;
        }
        if (!newMapId) {
            console.log(`No mapId defined for direction ${dir}`);
            return;
        }
        return newMapId;
    },

}

module.exports = MapService;