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

const Store 			= require( 'electron-store' )
const store 			= new Store()
const detectBrowsers 	= require('detect-browsers')

const entities 			= require( './entities.min' )



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
			label: i18n.t('menubookmarks:deletefromfolder', 'Delete from Folder…'),
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
	
	let browsers = store.get( 'browsers' )
	
	for(let browser of browsers) {
		
		bookmarkMenuTemplate[1].submenu.push({
			label: browser.browser,
			click () {
				
				detectBrowsers.launchBrowser( browser, message[4] )
			}
		})
	}
	
	const 	folders 	= store.get( 'folders' ),
			folderIds 	= message[9].split( ',' )
	
	if( !folderIds.includes( '-1' ) ) {
		
		bookmarkMenuTemplate[7].submenu.push(
			{
				label: i18n.t('menubookmarks:home', 'Home'),
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('move-bookmark',
					{
						'method': 'addtofolder',
						'bookmark_id': id,
						'folder_id': '-1',
						'count': folderIds.length
					}
				)}
			},
			{
				type: 'separator'
			}
		)
	
	} else {
		
		bookmarkMenuTemplate[8].submenu.push(
			{
				label: i18n.t('menubookmarks:home', 'Home'),
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('move-bookmark',
					{
						'method': 'deletefromfolder',
						'bookmark_id': id,
						'folder_id': '-1',
						'count': folderIds.length
					}
				)}
			},
			{
				type: 'separator'
			}
		)
	}
	
	for( let folder of folders ) {
	
		if( !folderIds.includes( folder.id )  ) {
	
			bookmarkMenuTemplate[7].submenu.push({
				
				label: folder.text,
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('move-bookmark',
					{
						'method': 'addtofolder',
						'bookmark_id': id,
						'folder_id': folder.id,
						'count': folderIds.length
					}
				)}
			})
		
		} else {
			
			bookmarkMenuTemplate[8].submenu.push({
				
				label: folder.text,
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('move-bookmark',
					{
						'method': 'deletefromfolder',
						'bookmark_id': id,
						'folder_id': folder.id,
						'count': folderIds.length
					}
				)}
			})
		}
	}
	
	
	const bookmarkMenu = Menu.buildFromTemplate( bookmarkMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	bookmarkMenu.popup( win )
})
