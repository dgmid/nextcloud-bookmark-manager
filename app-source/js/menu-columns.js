'use strict'

let i18n = require('./i18n.min')

const {
	app,
	BrowserWindow,
	Menu,
	MenuItem,
	ipcMain
} = require( 'electron' )

const Store		= require( 'electron-store' )
const store		= new Store()

const entities 	= require( './entities.min' )



ipcMain.on('show-columns-menu', ( event, message ) => {
	
	let settings = store.get( 'tableColumns' )
	
	const columnsMenuTemplate = [
		{
			label: i18n.t('menucolumns:description', 'Description'),
			type: 'checkbox',
			checked: settings.description,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('toggle-column',
				{
					"id": 3,
					"name": "description",
					"state": settings.description
				}
			) }
		},
		{
			label: i18n.t('menucolumns:url', 'Url'),
			type: 'checkbox',
			checked: settings.url,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('toggle-column',
				{
					"id": 4,
					"name": "url",
					"state": settings.url
				}
			) }
		},
		{
			label: i18n.t('menucolumns:created', 'Created'),
			type: 'checkbox',
			checked: settings.created,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('toggle-column',
				{
					"id": 6,
					"name": "created",
					"state": settings.created
				}
			) }
		},
		{
			label: i18n.t('menucolumns:modified', 'Modified'),
			type: 'checkbox',
			checked: settings.modified,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('toggle-column',
				{
					"id": 8,
					"name": "modified",
					"state": settings.modified
				}
			) }
		},
		{
			label: i18n.t('menucolumns:tags', 'Tags'),
			type: 'checkbox',
			checked: settings.tags,
			click (item, focusedWindow) { if(focusedWindow) focusedWindow.webContents.send('toggle-column',
				{
					"id": 9,
					"name": "tags",
					"state": settings.tags
				}
			) }
		}
	]
	
	const columnsMenu = Menu.buildFromTemplate( columnsMenuTemplate )
	
	const win = BrowserWindow.fromWebContents( event.sender )
	columnsMenu.popup( win )
})
