var cloudscraper = require("cloudscraper");

var HaapiKeyResponseModel = require("../models/haapi-keys-response-model");
var ApiIdResponseModel = require("../models/api-id-response-model");
var TokenResponseModel = require("../models/token-response-model");

const ConnectionService = {

    createApiUrl: "https://haapi.ankama.com/json/Ankama/v2/Api/CreateApiKey",

    getHaapi: async (haapiKeyRequestModel) => {
        return new Promise(async (resolve, reject) => {
            const options = {
                uri: "https://haapi.ankama.com/json/Ankama/v2/Api/CreateApiKey",
                proxy: haapiKeyRequestModel.proxy,
                qs: new URLSearchParams({
                    login: haapiKeyRequestModel.username,
                    password: haapiKeyRequestModel.password,
					long_life_token: "false"
                }),
                formData: {
					login: haapiKeyRequestModel.username,
					password: haapiKeyRequestModel.password
                },
            };
            cloudscraper.post(options).then(response => resolve(new HaapiKeyResponseModel(JSON.parse(response).account_id, JSON.parse(response).key))).catch(error => reject(error));
        });
    },

    getApiId: async (apiIdRequestModel) => {
        return new Promise(async (resolve, reject) => {
            const options = {
                uri: "https://proxyconnection.touch.dofus.com/config.json",
                proxy: apiIdRequestModel.proxy,
            };
            cloudscraper.get(options).then(response => resolve(new ApiIdResponseModel(JSON.parse(response).sessionId, JSON.parse(response).haapi.id) )).catch(error => reject(error));
        });
    },

    getToken: async (tokenRequestModel) => {
        return new Promise(async (resolve, reject) => {
            const options = {
                uri: "https://haapi.ankama.com/json/Ankama/v2/Account/CreateToken?game=" + tokenRequestModel.haapiId,
                proxy: tokenRequestModel.proxy,
                headers: { "apiKey": tokenRequestModel.haapiKey }
            };
            cloudscraper.get(options).then(response => resolve(new TokenResponseModel(JSON.parse(response).token))).catch(error => reject(error));
        }); 
    }



}

module.exports = ConnectionService;