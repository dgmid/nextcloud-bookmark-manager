'use strict'

const {
	app,
	BrowserWindow,
	ipcMain,
	Menu,
	Tray,
	shell
} = require( 'electron' )

const path 		= require( 'path' )
const fs 		= require( 'fs-extra' )
const log		= require( 'electron-log' )
const Store		= require( 'electron-store' )
const store 	= new Store()
const isUrl 	= require( 'is-url' )

const favicons 	= require( './favicons.min' )
const dir 		= store.get( 'dirPath' )

let trayIcon 	= null,
	bookmarks 	= new Store( {name: 'bookmarks'} )
	
	

module.exports.menuTray = function () {
	
	ipcMain.on( 'tray-menu', (event) => {
		
		if( trayIcon !== null ) trayIcon.destroy()
		
		let bookmarkdata 	= bookmarks.get( 'data' ),
			folders 		= store.get( 'folders' )
		
		folders.sort((a,b) => (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0))
		bookmarkdata.sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))
		
		const 	iconPath 	= path.join( __dirname , '../assets/png/iconTemplate.png' ),
				folderPath 	= path.join( __dirname , '../assets/png/folderTemplate.png' )
		
		trayIcon = new Tray( iconPath )
		
		const	trayMenuTemplate = []
		
		for( let folder of folders ) {
			
			trayMenuTemplate.push({
				label: folder.text,
				id: folder.id,
				icon: folderPath,
				submenu: []
			})
		}
		
		
		trayMenuTemplate.push({ type: 'separator' })
		
		for( let bookmark of bookmarkdata ) {
			
			for( let id of bookmark.folders  ) {
				
				if( id === -1 ) {
					
					trayMenuTemplate.push({
						label: bookmark.title,
						toolTip: bookmark.description,
						id: bookmark.id,
						icon: favicons.get( bookmark.id ),
						click () {
							shell.openExternal( bookmark.url )
						}
					})
					
				} else {
					
					let submenu = trayMenuTemplate.find(x => x.id === id).submenu
					
					submenu.push({
						label: bookmark.title,
						toolTip: bookmark.description,
						id: bookmark.id,
						icon: favicons.get( bookmark.id ),
						click () {
							shell.openExternal( bookmark.url )
						}
					})
				}
			}
		}
		
		
		const trayMenu = Menu.buildFromTemplate( trayMenuTemplate )
		trayIcon.setContextMenu( trayMenu )
		
		
		
		trayIcon.on('drop-text', (event, text) => {
			
			if( isUrl( text ) ) {
			
				let win = BrowserWindow.fromId(1)
				win.show()
				win.webContents.send( 'drop-on-tray', { "url": text, "title": '' } )
			}
		})
		
		
		trayIcon.on('drop-files', (event, files) => {
			
			if( path.extname( files[0] ) === '.webloc' ) {
			
				let name = path.basename( files[0], '.webloc' )
				
				fs.readFile( files[0], 'utf8', (err, data ) => {
					
					if ( err ) {
						
						log.error( err )
						return
					}
					
					let loc = data.match( '\<string\>(.*?)\<\/string\>' )
					
					let win = BrowserWindow.fromId(1)
					win.show()
					win.webContents.send( 'drop-on-tray', { "url": loc[1], "title": name } )
					
				})
			}
		})
	})
}
