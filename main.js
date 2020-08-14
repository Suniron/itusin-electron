const { app, BrowserWindow, ipcMain } = require("electron");

var win = null;

function createWindow () {
	win = new BrowserWindow({
		show: false,
		width: 1000,
		height: 600,
		frame: false,
		webPreferences: {
			nodeIntegration: true
		}
	})
	win.webContents.session.clearCache();
	win.setMenuBarVisibility(false);
	win.loadFile("index.html");
	win.once("ready-to-show", () => {
		win.show();
	})
	win.webContents.openDevTools();
}
app.whenReady().then(createWindow)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})
app.on("activate", () => {
	if (win === null) {
		createWindow()
	}
})
ipcMain.on('quit', () => app.quit());
