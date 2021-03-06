'use strict'

const {app, BrowserWindow, ipcMain, protocol, Menu} = require( 'electron' )
const url 				= require( 'url' ) 
const path 				= require( 'path' )
const dialog 			= require( 'electron' ).dialog
const Store 			= require( 'electron-store' )
const log				= require( 'electron-log' )
const detectBrowsers	= require( 'detect-browsers' )

const menuApp 			= require( './menu-app.min' )
const menuTable 		= require( './menu-table.min' )
const menuSidebar 		= require( './menu-sidebar.min' )
const menuTray 			= require( './menu-tray.min' )

const favicons 			= require( './favicons.min' )


let win,
	loginFlow,
	isQuitting = false


let store = new Store({
	name: 'config',
	defaults: {
		
		windowBounds: {
			width: 1000,
			height: 700,
			x: 0,
			y: 0
		},
		
		tableColumns: {
			
			description: false,
			url: false,
			created: true,
			modified: true,
			folders: false,
			tags: true
		},
		
		loginCredentials: {
			
			server: '',
			username: '',
			password: ''
		},
		
		exportPath: app.getPath('desktop'),
		dirPath: app.getPath( 'appData' ) + '/' + app.name,
		tags: null,
		folders: null,
		browsers: null,
		defaultIcons: []
	}
})

let bookmarkFile = new Store({
	name: 'bookmarks',
	defaults: {
		data: null
	}
})


app.allowRendererProcessReuse = true


function createWindow() {
	
	let { x, y, width, height } = store.get('windowBounds')
	
	win = new BrowserWindow({
		show: false,
		x: x,
		y: y,
		width: width,
		height: height,
		minWidth: 550,
		minHeight: 544,
		vibrancy: 'under-window',
		webPreferences: {
			devTools: true,
			nodeIntegration: true,
			enableRemoteModule: true,
			preload: path.join(__dirname, './preload.min.js')
		}
	})
	
	function saveWindowBounds() {
		
		store.set('windowBounds', win.getBounds())
	}
	
	win.loadURL(url.format ({
		
		pathname: path.join(__dirname, '../html/app.html'), 
		protocol: 'file:',
		slashes: true 
	}))
	
	win.once('ready-to-show', () => {
		
		win.show()
		favicons.generate( win.id, false, false  )
	})
	
	win.on('resize', saveWindowBounds)
	win.on('move', saveWindowBounds)
	
	win.on('blur', () => {
		
		win.webContents.send('state', 'blur')
	})
	
	win.on('focus', () => {
		
		win.webContents.send('state', 'focus')
	})
	
	app.on('before-quit', () => {
		
		isQuitting = true
	})
	
	win.on('close', function(e) {
	
		if( !isQuitting ) {
			
			e.preventDefault()
			Menu.sendActionToFirstResponder('hide:')
		}
	})
	
	win.webContents.on('did-fail-load', () => {
		
		log.error( `main window did not load` )
	})
	
	win.webContents.on( 'crashed', ( event, killed ) => {
		
		log.info( `main window has crashed:` )
		log.error( event )
	})
	
	win.on( 'unresponsive', () => {
		
		log.info( `main window is not responding…` )
	})
	
	win.on( 'responsive', () => {
		
		log.info( `main window is responding` )
	})
	
	detectBrowsers.getAvailableBrowsers()
	.then(browsers => {
		
		store.set('browsers', browsers )
	
	})
	.catch( error => log.error(error) )
	
	menuApp.menuApp()
	menuTable.menuBookmarks( win.id )
	menuTable.menuColumns( win.id )
	menuTable.menuPanels( win.id )
	menuSidebar.menuFolders( win.id )
	menuSidebar.menuTags( win.id )
	menuTray.menuTray()
}



app.on('ready', function() {
	
	createWindow()
	
	protocol.registerFileProtocol('nc', (request, callack) => {
		
		const url = request.url
		
		if( url ) {
			
			const parts = url.split( '&' )
			
			const 	user = parts[1].replace('user:', ''),
					pass = parts[2].replace('password:', '')
			
			store.set( 'loginCredentials.username', decodeURIComponent(user) )
			store.set( 'loginCredentials.password', pass )
			
			loginFlow.close()
			win.webContents.send('login-ok', 'login-ok')
		}
	
	}, ( error ) => {
		
		if (error) {
			
			log.error('Failed to register protocol')
			
			dialog.showErrorBox(
				`Error`,
				`Failed to register protocol`
			)
		}
	})
}) 



app.on('window-all-closed', function () {
	
	if (process.platform !== 'darwin') {
		
		app.quit()
	}
})



app.on('activate', ( event, hasVisibleWindows ) => {
	
	if (!hasVisibleWindows) {
		
		createWindow()
	}
})



app.on('quit-app', () => {
	
	isQuitting = true
	app.quit()
})



ipcMain.on('refresh', (event, message) => {
	
	win.webContents.send('refresh-bookmarks', 'refresh')
})



ipcMain.on('update-favicon', (event, message) => {
	
	favicons.generate( win.id, message, false )
})


ipcMain.on('loginflow', (event, message) => {
	
	loginFlow = new BrowserWindow({
		
		width: 800,
		height: 600,
		resizable: false,
		minimizable: false,
		maximizable: false,
		show: false,
		titleBarStyle: 'hidden',
		backgroundColor: '#0082c9',
		webPreferences: {
			devTools: true,
			nodeIntegration: false
		}
	})
	
	loginFlow.loadURL( message + '/index.php/login/flow' , {
		
		userAgent: 'Nextcloud Bookmark Manager - Macintosh',
		extraHeaders: 'OCS-APIRequest: true'
	})
	
	loginFlow.once('ready-to-show', () => {
		
		loginFlow.show()
	})
	
	loginFlow.webContents.on('did-fail-load', () => {
		
		log.error( `loginflow window did not load` )
	})
	
	loginFlow.webContents.on( 'crashed', ( event, killed ) => {
		
		log.info( `loginflow window has crashed:` )
		log.error( event )
	})
	
	loginFlow.on( 'unresponsive', () => {
		
		log.info( `loginflow window is not responding…` )
	})
	
	loginFlow.on( 'responsive', () => {
		
		log.info( `loginflow window is responding` )
	})
})



ipcMain.on('error-in-render', function(event, message) {
	
	log.error(`exception in render process:`)
	log.info (message)
})
