"use strict";

var axios = require("axios");

var SettingsModel = require("../models/settings-model");

var ConnectionService = {
  furyTouchSettingsUrl: "https://itusin.github.io/assets/scripts/settings.js",
  getSettings: function getSettings() {
    return new Promise(function (resolve, reject) {
      axios.get(ConnectionService.furyTouchSettingsUrl).then(function (response) {
        return resolve(new SettingsModel(response.data.buildVersion, response.data.appVersion));
      })["catch"](function (error) {
        return reject(error);
      });
    });
  }
};
module.exports = ConnectionService;