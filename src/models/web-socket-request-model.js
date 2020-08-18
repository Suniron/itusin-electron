module.exports = class WebSocketRequestModel {
    constructor(proxyUsername = "", proxyPassword = "", proxyHost = "", proxyPort = "") {        
        this.proxy = proxyUsername.length && proxyPassword.length && proxyHost.length && proxyPort.length ? "http://" + proxyUsername + ":" + proxyPassword + "@" + proxyHost + ":" + proxyPort : proxyHost.length && proxyPort.length ? "http://" + proxyHost + ":" + proxyPort : "";
    }
}