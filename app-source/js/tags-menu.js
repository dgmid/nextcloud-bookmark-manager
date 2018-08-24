'use strict'

const electron = require( 'electron' )
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



ipc.on('show-tags-menu', ( event, message ) => {
	
	let tag = decodeEntities( message )
	
	const tagsMenuTemplate = [
		{
			label: `Edit ${tag}…`,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-tag', message) }
		},
		{
			type: 'separator'
		},
		{
			label: `Delete ${tag}…`,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-tag', message) }
		},
	]
	
	const tagsMenu = Menu.buildFromTemplate( tagsMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	tagsMenu.popup( win )
})
