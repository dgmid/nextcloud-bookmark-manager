'use strict'

let i18n = require('./i18n.min')

const {
	app,
	Menu,
	shell
} = require( 'electron' )

const path 			= require('path')
const name 			= app.name
const log			= require( 'electron-log' )

const about 		= require('./about.min')



const template = [
	{
		label: name,
		submenu: [
			{
				label: i18n.t('menu:app.name', 'About {{name}}', { name: name }),
				click() { about.createAbout() }
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menu:app.login', 'Log in/out to Nextcloud…'),
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
				label: i18n.t('menu:app.quit', 'Quit {{name}}', { name: name }),
				accelerator: 'Command+q',
				click () { app.emit('quit-app') }
			}
		]
	},
	{
		label: i18n.t('menu:bookmarks.bookmarks', 'Bookmarks'),
		submenu:
		[
			{
				label: i18n.t('menu:bookmarks.new', 'Add New Bookmark…'),
				accelerator: 'Command+N',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('add-bookmark', 'add-bookmark') }
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menu:bookmarks.edit', 'Edit Bookmark…'),
				accelerator: 'Command+E',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('edit-bookmark', 'edit-bookmark') }
			},
			{
				label: i18n.t('menu:bookmarks.delete', 'Delete Bookmark…'),
				accelerator: 'Command+D',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('delete-bookmark', 'delete-bookmark') }
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menu:bookmarks.sync', 'Sync all Bookmarks'),
				accelerator: 'Cmd+R',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('refresh-bookmarks', 'refresh-bookmarks') }
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menu:bookmarks.export', 'Export Bookmarks File…'),
				accelerator: 'Command+Alt+E',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('export-bookmarks', 'export-bookmarks') }
			}
		]  
	},
	{
		label: i18n.t('menu:edit.edit', 'Edit'),
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
				label: i18n.t('menu:edit.find', 'Find…'),
				accelerator: 'Command+F',
				click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('find', 'find') }
			}
		]
	},
	{
		label: i18n.t('menu:view.view', 'View'),
		submenu:
		[
			//@exclude
			{
				label: 'Toggle Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.toggleDevTools()
				}
			},
			{
				type: 'separator'
			},
			//@end
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
		label: i18n.t('menu:window.window', 'Window'),
		role: 'window',
		submenu:
		[
			{
				label: i18n.t('menu:window.close', 'Close'),
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			},
			{
				label: i18n.t('menu:window.minimize', 'Minimize'),
				accelerator: 'CmdOrCtrl+M',
				role: 'minimize'
			},
			{
				label: i18n.t('menu:window.zoom', 'Zoom'),
				role: 'zoom'
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menu:window.front', 'Bring All to Front'),
				role: 'front'
			}
		]
	},
	{
		label: i18n.t('menu:help.help', 'Help'),
		role: 'help',
		submenu:
		[
			{
				label: i18n.t('menu:help.homepage', 'Nextcloud Bookmark Manager Homepage'),
				click () { require('electron').shell.openExternal('https://www.midwinter-dg.com/mac-apps/nextcloud-bookmark-manager.html?app') }
			}
		]
	}
]
	

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
