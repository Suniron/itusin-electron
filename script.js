/* Libs */
var numeral = require("numeral");
var moment = require("moment");
var Primus = require("./src/libs/primus.js");
var { EventEmitter } = require("events");

/* Services */
var RenderService = require("./src/services/render.service");
var CharacterService = require("./src/services/character.service");
var PathFindingService = require("./src/services/pathfinding.service.js");
var AppService = require("./src/services/app.service");
var ContextService = require("./src/services/context.service");
var ConnectionService = require("./src/services/connection.service");
var MapService = require("./src/services/map.service");

/* Models */
var HaapiKeysRequestModel = require("./src/models/haapi-keys-request-model");
var ApiIdRequestModel = require("./src/models/api-id-request-model");
var TokenRequestModel = require("./src/models/token-request-model");
var WebSocketRequestModel = require("./src/models/web-socket-request-model");

window.addEventListener('DOMContentLoaded', (event) => {
    RenderService.initializeView();
    
});