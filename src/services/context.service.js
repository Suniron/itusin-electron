var axios = require("axios");

var SettingsModel = require("../models/settings-model");

const ConnectionService = {

    furyTouchSettingsUrl: "https://itusin.github.io/assets/scripts/settings.js",

    getSettings: () => {
        return new Promise((resolve, reject) => {
            axios.get(ContextService.furyTouchSettingsUrl)
                .then(response => resolve(new SettingsModel(response.data.buildVersion, response.data.appVersion)))
                .catch(error => reject(error));
        })
    }

}

module.exports = ConnectionService;