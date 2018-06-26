'use strict'

const {app, BrowserWindow, ipcMain} = require('electron')
const url = require('url') 
const path = require('path')
const Store = require('electron-store')

let win



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
		
		tags: null
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
}

app.on('ready', createWindow) 



ipcMain.on('refresh', (event, message) => {
	
	win.webContents.send('refresh-bookmarks', 'refresh')
})

ipcMain.on('reload', (event, message) => {
	
	console.log('reload')
	
	win.reload()	
})
	
	
	
