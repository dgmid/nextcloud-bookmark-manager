'use strict'

const electron = require('electron')
const {Menu, shell} = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const path = require('path')
const name = app.getName()
var about = require('./about.min')



const template = [
	{
		label: name,
		submenu: [
			{
				label: 'About ' + name,
				click() { about.createAbout() }
			},
			{
				type: 'separator'
			},
			{
				label: 'Log in/out to Nextcloud…',
				accelerator: 'Command+Ctrl+Alt+l',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('open-login', 'open-login') }
			
			},
			{
				type: 'separator'
			},
			{
				role: 'services',
				submenu: []
			},
			{
				type: 'separator'
			},
			{
				role: 'hide'
			},
			{
				role: 'hideothers'
			},
			{
				role: 'unhide'
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'Bookmarks',
		submenu:
		[
			{
				label: 'Add New Bookmark…',
				accelerator: 'Command+N',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('add-bookmark', 'add-bookmark') }
			},
			{
				type: 'separator'
			},
			{
				label: 'Edit Bookmark…',
				accelerator: 'Command+E',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-bookmark', 'edit-bookmark') }
			},
			{
				label: 'Delete Bookmark…',
				accelerator: 'Command+D',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-bookmark', 'delete-bookmark') }
			},
			{
				type: 'separator'
			},
			{
				label: 'Export Bookmarks File…',
				accelerator: 'Command+Alt+E',
				click () { app.emit('export', 'export') }
			}
		]  
	},
	{
		label: 'Edit',
		submenu: [
			{
				role: 'undo'
			},
			{
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				role: 'cut'
			},
			{
				role: 'copy'
			},
			{
				role: 'paste'
			},
			{
				role: 'delete'
			},
			{
				role: 'selectall'
			},
			{
				type: 'separator'
			},
			{
				label: 'Find…',
				accelerator: 'Command+F',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('find', 'find') }
			}
		]
	},
	{
		label: 'View',
		submenu:
		[
			{
				label: 'Reload Bookmarks',
				accelerator: 'Cmd+R',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('reload', 'reload') }
			},
			//@exclude
			{
				label: 'Toggle Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.toggleDevTools()
				}
			},
			//@end
			{
				type: 'separator'
			},
			{
				role: 'resetzoom'
			},
			{
				role: 'zoomin'
			},
			{
				role: 'zoomout'
			},
			{
				type: 'separator'
			},
			{
				role: 'togglefullscreen'
			}
		]
	},
	{
		role: 'window',
		submenu:
		[
			{
				label: 'Close',
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			},
			{
				label: 'Minimize',
				accelerator: 'CmdOrCtrl+M',
				role: 'minimize'
			},
			{
				label: 'Zoom',
				role: 'zoom'
			},
			{
				type: 'separator'
			},
			{
				label: 'Bring All to Front',
				role: 'front'
			}
		]
	},
	{
		role: 'help',
		submenu:
		[
			{
				label: 'Nextcloud Bookmark Manager Homepage',
				click () { require('electron').shell.openExternal('https://www.midwinter-dg.com/mac-apps/nextcloud-bookmark-manager.html?app') }
			}
		]
	}
]
	

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)