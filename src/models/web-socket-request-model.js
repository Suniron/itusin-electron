module.exports = class WebSocketRequestModel {
    constructor(username, password, sessionId, proxyUsername = "", proxyPassword = "", proxyHost = "", proxyPort = "") {        
        this.username = username;
        this.password = password;
        this.sessionId = sessionId;
        this.proxy = proxyUsername.length && proxyPassword.length && proxyHost.length && proxyPort.length ? "http://" + proxyUsername + ":" + proxyPassword + "@" + proxyHost + ":" + proxyPort : proxyHost.length && proxyPort.length ? "http://" + proxyHost + ":" + proxyPort : "";
    }
}