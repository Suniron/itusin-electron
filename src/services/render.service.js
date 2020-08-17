const RenderService = {
    initializeView: () => {
        document.body.innerHTML += `
        <header>
            <div id="header-content">
                <button type="button" class="btn characterbtn current users" onclick="manage()">Gestion des comptes</button>
                <button type="button" class="btn characterbtn current quit" onclick="quit()">Quitter</button>
            </div>
        </header>
        <div class="content">
            <div id="content-nav"></div>
            <div id="content-panel">
                <div id="content-panel-container">
                    <div id="content-panel-control">
                    </div>
                    <div id="content-panel-console">
                    </div>
                </div>
            </div>
        </div>
        <footer>
            <div id="content-stats">
                <div>
                    <div class="icon level"></div>
                    <div class="value">
                        <div class="progress">
                            <div class="progress-bar-value">1 (0%)</div>
                            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="icon life"></div>
                    <div class="value">
                        <div class="progress">
                            <div class="progress-bar-value">0%</div>
                            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="icon energy"></div>
                    <div class="value">
                        <div class="progress">
                            <div class="progress-bar-value">0%</div>
                            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="icon pods"></div>
                    <div class="value">
                        <div class="progress">
                            <div class="progress-bar-value">0%</div>
                            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="icon kamas"></div>
                    <div class="value">
                        <div class="progress">
                            <div class="progress-bar-value">0</div>
                            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="icon map"></div>
                    <div class="value">
                        <div class="progress">
                            <div class="progress-bar-value">0</div>
                            <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
        <div id="manageModal">
            <div class="quitManage" onclick="closeManage()"></div>
            <form>
                <div class="form-group">
                    <label for="username">Nom de compte</label>
                    <input type="text" class="form-control" id="username" placeholder="bob" value="nirhoriel">
                </div>
                <div class="form-group">
                    <label for="password">Mot de passe</label>
                    <input type="password" class="form-control" id="password" placeholder="******" value="s4EasX9E4">
                </div>
                <div class="form-group">
                    <label for="proxy">Adresse proxy</label>
                    <input type="text" class="form-control" id="proxy" placeholder="http://user:pass@host:port">
                </div>
                <div class="form-group">
                    <button type="button" class="btn characterbtn current" onclick="loadNewAccount()">Connexion</button>
                </div>
            </form>
        </div>
        `;
    }
}

module.exports = RenderService;