const config = require('config');
const d2gsi = require('dota2-gsi');
const clone = require('clone');
const OBSWebSocket = require('obs-websocket-js');

const d2gsiConf = config.get('d2gsi');

const gsiServer = new d2gsi(d2gsiConf);

const obs = new OBSWebSocket();
var sourceList = [];

const obsConf = config.get('obs');
obs.connect(obsConf)
    .then(() => {
        console.log(`Successfully connected to OBS.`);
        return obs.GetSourcesList();
    })
    .then(data => {
        // populate sourceList
        sourceList = data.sources.filter(source => source.type == 'input');

        // start with none visible
        sourceList.forEach((source) => {
            obs.SetSceneItemProperties({item: source.name, visible: false})
        });
    })
    .then(() => {
        gsiServer.events.on('newclient', function(client) {
            console.log("New GSI client connection, IP address: " + client.ip);
        
            var shownPlayerID = null;
        
            client.on('newdata', newdata => {
                var data = clone(newdata);

                try {
                    // combine the two team's players/heroes
                    var allHeroes = Object.assign(data.hero.team2, data.hero.team3);
                    var allPlayers = Object.assign(data.player.team2, data.player.team3);
                }
                catch (err) {
                    // indicates not in spectate slot
                    return;
                }
                
                // find the selected hero (null if none)
                var newShown = null;                       
                for (var player in allHeroes) {        
                    if (allHeroes[player].selected_unit) {
                        newShown = allPlayers[player];
                    }
                }
                
                // show/hide sources depending on what is selected
                if (newShown == null && shownPlayerID !== null) {
                    console.log('no player selected');

                    // hide previous cam (all will be hidden)
                    obs.SetSceneItemProperties({item: shownPlayerID, visible: false})
                    .catch(err => {
                        console.log(err.error + ' (' + shownPlayerID + ')');
                    });
                    
                    shownPlayerID = null;
                } else if (newShown !== null && shownPlayerID !== newShown.steamid) {     
                    if (sourceList.find(obj => obj.name == newShown.steamid) === undefined) {
                        // source not found for player 
                        console.log('no source for ' + newShown.name + ' (' + newShown.steamid + ')');

                        if (shownPlayerID !== null) {
                            obs.SetSceneItemProperties({item: shownPlayerID, visible: false})
                            .catch(err => {
                                console.log(err.error + ' (' + shownPlayerID + ')');
                            });
                        }
                        
                    } else {
                        // source found for player
                        console.log('showing ' + newShown.name + ' (' + newShown.steamid + ')');

                        // hide existing cam if one is shown
                        if (shownPlayerID) {
                            obs.SetSceneItemProperties({item: shownPlayerID, visible: false})
                            .catch(err => {
                                console.log(err.error + ' (' + shownPlayerID + ')');
                            });
                        }
                        
                        // show new cam
                        obs.SetSceneItemProperties({item: newShown.steamid, visible: true})
                        .catch(err => {
                            console.log(err.error + ' (' + newShown.steamid + ')');
                        });
                    }

                    shownPlayerID = newShown.steamid;
                } 
            });
        });
    })
    .catch(err => {
        console.log(err);
    });

//handle added sources
obs.on('SceneItemAdded', (data) => {
    sourceList += data.item-name;
});

//handle removed sources
obs.on('SceneItemRemoved', (data)=> {
    var obj = sourceList.find(obj => obj.name = data.name)

    if (obj !== undefined) {
        sourceList.splice( list.indexOf(obj), 1 );
    }
});

//handle scene changes
obs.on('SwitchScenes', (data) => { 
    sourceList = data.sources; 
});

obs.on('error', err => {
	console.error('socket error:', err);
});
