'use strict'

const {
	app,
	BrowserWindow,
	Menu,
	MenuItem,
	ipcMain
} = require( 'electron' )

const entities = require( './entities.min' )



module.exports.menuFolders = function ( winId ) {
	
	const i18n = require('./i18n.min')
	
	ipcMain.on('show-folders-menu', ( event, message ) => {
		
		let folder = entities.decode( message[1] )
		
		const foldersMenuTemplate = [
			{
				label: i18n.t('menusidebar:folders.delete', 'Delete {{- folder}} Folder…', { folder: unescape(folder) }),
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-folder', message) }
			}
		]
		
		const foldersMenu = Menu.buildFromTemplate( foldersMenuTemplate )
		
		const win = BrowserWindow.fromId( winId )
		foldersMenu.popup( win )
	})
}



module.exports.menuTags = function ( winId ) {
	
	const i18n = require('./i18n.min')
	
	ipcMain.on('show-tags-menu', ( event, message ) => {
		
		let tag = entities.decode( message[1] )
		
		const tagsMenuTemplate = [
			{
				label: i18n.t('menusidebar:tags.edit', 'Edit {{- tag}} Tag…', { tag: unescape(tag) }),
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-tag', message[1]) }
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menusidebar:tags.delete', 'Delete {{- tag}} Tag…', { tag: unescape(tag) }),
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-tag', message[0]) }
			},
		]
		
		const tagsMenu = Menu.buildFromTemplate( tagsMenuTemplate )
		
		const win = BrowserWindow.fromId( winId )
		tagsMenu.popup( win )
	})
}
