'use strict'

const electron = require( 'electron' )
const {shell, app} = require( 'electron' )
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const ipc = electron.ipcMain



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
			label: `Open ${title} URL…`,
			click () { require('electron').shell.openExternal( message[3] ) }
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
	
	const bookmarkMenu = Menu.buildFromTemplate( bookmarkMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	bookmarkMenu.popup( win )
})
