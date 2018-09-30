'use strict'

const {app, BrowserWindow, ipcMain, protocol} = require('electron')
const url = require('url') 
const path = require('path')
const dialog = require('electron').dialog
const Store = require('electron-store')

const getAvailableBrowsers = require('detect-installed-browsers').getAvailableBrowsers

let win,
	loginFlow,
	exportProcess



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
			
			description: true,
			url: true,
			created: false,
			modified: false
		},
		
		loginCredentials: {
			
			server: '',
			username: '',
			password: ''
		},
		
		exportPath: app.getPath('desktop'),
		
		tags: null,
		
		browsers: null
	}
})



function createWindow() {
	
	let { x, y, width, height } = store.get('windowBounds')
	
	win = new BrowserWindow({
		show: false,
		titleBarStyle: 'hidden',
		x: x,
		y: y,
		width: width,
		height: height,
		minWidth: 460,
		minHeight: 396,
		backgroundColor: '#fff',
		icon: path.join(__dirname, '../assets/icon/Icon.icns')
	})
	
	win.setSheetOffset( 24 )
	
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
	})
	
	win.on('resize', saveWindowBounds)
	win.on('move', saveWindowBounds)
	
	win.on('closed', () => {
		
		app.quit()
	})
	
	require( './app-menu.min' )
	require( './context-menu.min' )
	require( './tags-menu.min' )
	
	getAvailableBrowsers( {}, ( browserList ) => {
		
		let results = []
		
		for ( let browser of browserList ) {
			
			results.push( { "name": browser.name } )
			store.set('browsers', results )
		}
	})
	
	protocol.registerFileProtocol('nc', (request, callback) => {
		
		const url = request.url.split( '&' )
		
		const 	user = url[1].replace('user:', ''),
				pass = url[2].replace('password:', '')
		
		store.set( 'loginCredentials.username', user )
		store.set( 'loginCredentials.password', pass )
		
		loginFlow.close()
		
		win.webContents.send('close-login-modal', 'close-login-modal')
		win.reload()
	
	}, (error) => {
	
		if (error) console.error('Failed to register protocol')
	})
}

app.on('ready', createWindow) 



ipcMain.on('refresh', (event, message) => {
	
	win.webContents.send('refresh-bookmarks', 'refresh')
})



ipcMain.on('reload', (event, message) => {
	
	win.reload()
})



ipcMain.on('loginflow', (event, message) => {
	
	loginFlow = new BrowserWindow({
		
		width: 800,
		height: 600,
		resizable: false,
		show: false,
		titleBarStyle: 'hidden',
		backgroundColor: '#0082c9',
		webPreferences: {
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
})



app.on('export', (message) => {
	
	const exportPath = store.get('exportPath')
	
	dialog.showOpenDialog(win, {
			
			defaultPath: exportPath + '/',
			buttonLabel: 'Export Bookmarks',
			properties: [	'openDirectory',
							'createDirectory'
						]
		},		
		
		runExportProcess
	)
	
	
	function runExportProcess( exportPath ) {
		
		if( exportPath ) {
			
			store.set('exportPath', exportPath)
			
			const exportProcess = new BrowserWindow({ show: false })
			
			exportProcess.loadURL(url.format ({ 
				
				pathname: path.join(__dirname, '../html/export-bookmarks.html'), 
				protocol: 'file:', 
				slashes: true 
			}))
		}
	}
})
