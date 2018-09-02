'use strict'

const electron = require( 'electron' )
const {shell, app, clipboard} = require( 'electron' )
const dialog = require( 'electron' ).dialog
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const ipc = electron.ipcMain

const Store = require( 'electron-store' )
const store = new Store()

const applescript = require( 'applescript' )

//note(@duncanmid): decodeentities

function decodeEntities( str ) {
    
    return 	String(str)
    		.replace(/&lt;/g, '<')
    		.replace(/&gt;/g, '>')
}



ipc.on('show-bookmark-menu', ( event, message ) => {
	
	let title = decodeEntities( message[1] )
	
	const bookmarkMenuTemplate = [
		{
			label: `Open ${title} in Default Browser`,
			click () { require('electron').shell.openExternal( message[3] ) }
		},
		{
			label: `Open ${title} with…`,
			submenu: []
		},
		{
			label: `Copy ${title} url to Clipboard`,
			click () { clipboard.writeText(message[3], title) }	
		},
		{
			type: 'separator'
		},
		{
			label: `Edit ${title} Bookmark…`,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-bookmark', message) }
		},
		{
			label: `Delete ${title} Bookmark…`,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-bookmark', message) }
			
		},
	]
	
	const browsers = store.get('browsers')
	
	for (let i = 0, len = browsers.length; i < len; i++) {
		
		let theBrowser = browsers[i]['name']
		
		let launchScript =
		
		`tell application "${theBrowser}"
			open location "${message[3]}"
		end tell
		tell application "System Events"
			tell application process "${theBrowser}"
			set frontmost to true
			end tell
		end tell`
		
		bookmarkMenuTemplate[1].submenu.push({
				label: theBrowser,
				click () {
					
					applescript.execString(launchScript, function(err, rtn) {
						if (err) {
							
							dialog.showErrorBox(
								`Error launching: ${theBrowser}`,
								`the url ${message[3]} could not be opened`
							)
							
							console.log( err )
						}
					})
				}
			}
		)
	}
	
	const bookmarkMenu = Menu.buildFromTemplate( bookmarkMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	bookmarkMenu.popup( win )
})
