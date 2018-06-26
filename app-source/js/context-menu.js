'use strict'

const electron = require( 'electron' )
const {shell, app} = require( 'electron' )
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const ipc = electron.ipcMain



ipc.on('show-bookmark-menu', ( event, message ) => {
	
	
	const bookmarkMenuTemplate = [
		{
			label: `Open ${message[1]} URL…`,
			click () { require('electron').shell.openExternal( message[3] ) }
		},
		{
			type: 'separator'
		},
		{
			label: `Edit ${message[1]} Bookmark…`,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-bookmark', message) }
		},
		{
			label: `Delete ${message[1]} Bookmark…`,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-bookmark', message) }
			
		},
	]
	
	const bookmarkMenu = Menu.buildFromTemplate( bookmarkMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	bookmarkMenu.popup( win )
})
