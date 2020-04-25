'use strict'

let i18n = require('./i18n.min')

const {
	app,
	BrowserWindow,
	Menu,
	MenuItem,
	ipcMain,
	shell,
	clipboard
} = require( 'electron' )

const dialog 		= require( 'electron' ).dialog
const Store 		= require( 'electron-store' )
const store 		= new Store()
const applescript 	= require( 'applescript' )

const log			= require( 'electron-log' )

const entities 		= require( './entities.min' )



ipcMain.on('show-bookmark-menu', ( event, message ) => {
	
	let id 		= message[0],
		title 	= entities.decode(message[2])
	
	const bookmarkMenuTemplate = [
		{
			label: i18n.t('menubookmarks:open', 'Open {{- title}} in Default Browser', { title: title }),
			click () { require('electron').shell.openExternal( message[4] ) }
		},
		{
			label: i18n.t('menubookmarks:with', 'Open {{- title}} with…', { title: title }),
			submenu: []
		},
		{
			label: i18n.t('menubookmarks:copy', 'Copy {{- title}} url to Clipboard', { title: title }),
			click () { clipboard.writeText(message[4], title) }	
		},
		{
			type: 'separator'
		},
		{
			label: i18n.t('menubookmarks:edit', 'Edit {{- title}} Bookmark…', { title: title }),
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-bookmark', message) }
		},
		{
			label: i18n.t('menubookmarks:delete', 'Delete {{- title}} Bookmark…', { title: title }),
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-bookmark', [id, title]) }
		},
		{
			type: 'separator'
		},
		{
			label: i18n.t('menubookmarks:addtofolder', 'Add to Folder…'),
			submenu: []
		},
		{
			type: 'separator'
		},
		{
			label: i18n.t('menubookmarks:info', 'Show / Hide Info…'),
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('info-bookmark', id) }
		},
	]
	
	const browsers = store.get( 'browsers' )
	
	for ( let browser of browsers ) {
		
		let launchScript =
		
		`tell application "${browser.name}"
			open location "${message[4]}"
		end tell
		tell application "System Events"
			tell application process "${browser.name}"
			set frontmost to true
			end tell
		end tell`
		
		bookmarkMenuTemplate[1].submenu.push({
				label: browser.name,
				click () {
					
					applescript.execString(launchScript, function(err, rtn) {
						if (err) {
							
							dialog.showErrorBox(
								i18n.t('menubookmarks:errorbox.title', 'Error launching: {{browser}}', { browser: browser.name }),
								i18n.t('menubookmarks:errorbox.content', 'the url {{url}} could not be opened', { url: message[4] })
							)
							
							log.info( err )
						}
					})
				}
			}
		)
	}
	
	const 	folders 	= store.get( 'folders' ),
			folderIds 	= message[9].split( ',' )
	
	if( !folderIds.includes( '-1' ) ) {
		
		bookmarkMenuTemplate[7].submenu.push(
			{
				label: i18n.t('menubookmarks:home', 'Home'),
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('add-to-folder', { 'bookmark_id': id, 'folder_id': '-1' }) }
			},
			{
				type: 'separator'
			}
		)	
	}
	
	for( let folder of folders ) {
	
		if( !folderIds.includes( folder.id )  )
	
			bookmarkMenuTemplate[7].submenu.push({
				
				label: folder.text,
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('add-to-folder', { 'bookmark_id': id, 'folder_id': folder.id }) }
			})
	}
	
	
	const bookmarkMenu = Menu.buildFromTemplate( bookmarkMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	bookmarkMenu.popup( win )
})
