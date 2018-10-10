1. Install and enable OBS Websocket - https://obsproject.com/forum/resources/obs-websocket-remote-control-of-obs-studio-made-easy.466/
2. Create camera sources in OBS named with the SteamID64 of the player it shows
3. Copy the "gamestate_integration_dota-cams.cfg" file into "<Steam_install_directory>/steamapps/common/dota 2 beta/game/dota/cfg/" and edit if necessary
4. Ensure the config file ("config/default.json") is correct. It's setup to use the defaults for GSI and OBS.
5. Run the executable
6. The program will detect when the game is in spectate mode, and begin showing/hiding the cams.