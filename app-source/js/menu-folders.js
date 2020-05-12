'use strict'

let i18n = require('./i18n.min')

const {
	app,
	BrowserWindow,
	Menu,
	MenuItem,
	ipcMain
} = require( 'electron' )

const entities = require( './entities.min' )



ipcMain.on('show-folders-menu', ( event, message ) => {
	
	let folder = entities.decode( message[1] )
	
	const foldersMenuTemplate = [
		{
			label: i18n.t('menufolders:delete', 'Delete {{- folder}} Folder…', { folder: unescape(folder) }),
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-folder', message) }
		}
	]
	
	const foldersMenu = Menu.buildFromTemplate( foldersMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	foldersMenu.popup( win )
})
