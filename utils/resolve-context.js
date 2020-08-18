var axios = require("axios");

async function resolveContext() {
    const buildVersion = await new Promise((resolve, reject) => {
        axios.get('https://proxyconnection.touch.dofus.com/build/script.js').then(response => {
            resolve(response.data.match(/window\.buildVersion\s?=\s?"(\d+\.\d+\.\d+(?:\-\d+)?)"/)[1])
        }).catch(error => {
            console.log(JSON.stringify(error, null, 2));
            reject(error);
        });
    });
    const appVersion = await new Promise((resolve, reject) => {
        axios.get('https://itunes.apple.com/lookup?id=1041406978&t=' + (new Date().getTime())).then(response => {
            resolve(response.data.results[0].version)
        }).catch(error => {
            console.log(JSON.stringify(error, null, 2));
            reject(error);
        });
    });
    console.log(`
    {
        "buildVersion": "${buildVersion}",
        "appVersion": "${appVersion}"
    }`);
}
resolveContext();
