'use strict'

const i18n			= require( './i18n.min' )

const { remote } 	= require('electron')
const path 			= require('path')
const dialog		= remote.dialog
const fs 			= require( 'fs-extra' )
const log 			= require( 'electron-log' )
const Store 		= require( 'electron-store' )
const store			= new Store()
const bookmarks		= new Store( {name: 'bookmarks'} )



module.exports.exportBookmarks = function( filePath ) {
	
	dialog.showSaveDialog(remote.getCurrentWindow(), {
			
		defaultPath: filePath,
		buttonLabel: i18n.t('export:savedialog.button', 'Export Bookmarks'),
		properties: [	'openDirectory',
						'createDirectory'
					],
		filters: [
					{	name:		'html',
						extensions:	['html']
					}
				]
		}
	).then((data) =>{
		
		if( data.canceled === false ) {
			
			store.set( 'exportPath', data.filePath )
			exportAllBookmarks( data.filePath )
		}
	})
}



function exportAllBookmarks( exportPath ) {
	
	let expname 		= path.basename( exportPath ),
		exppath 		= path.dirname( exportPath ),
		bookmarkdata 	= bookmarks.get( 'data' )
	
	let output =
`<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`
	
	
	for ( let item of bookmarkdata ) {
		
		let tagList = item.tags.toString()
			
		output +=
`
<DT><A HREF="${item.url}" TAGS="${tagList}">${item.title}</A>`
		
		if( item.description ) {
			
			output += `<DD>${item.description}`
		}
	}
	
	fs.outputFile( exportPath, output )

	.then( () => fs.readFile( exportPath, 'utf8')
	
	).then(data => {
		
		let exportNotification = new Notification('Nextcloud Bookmark Manager', {
			
			body: i18n.t('export:notification.body', 'the file: {{name}}\nhas been saved to: {{- path}}', {name: expname, path: exppath})
		})
	
	}).catch(error => {
		
		log.error( error )
		
		dialog.showErrorBox(
			i18n.t('export:errorbox.title', 'Export Error'),
			i18n.t('export:errorbox.content', 'An error occured exporting:\n{{- filepath}}', {filepath: exportPath})
		)
	})
}
