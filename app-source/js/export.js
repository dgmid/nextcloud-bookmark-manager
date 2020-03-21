'use strict'

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
		buttonLabel: 'Export Bookmarks',
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
			
			log.info('OK!')
			
			store.set( 'exportPath', data.filePath )
			exportAllBookmarks( data.filePath )
		}
	})
}



function exportAllBookmarks( exportPath ) {
	
	let exportname 		= path.basename( exportPath ),
		exportpath 		= path.dirname( exportPath ),
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
			
			body: `the file: ${exportname}\nhas been saved to: ${exportpath}`
		})
	
	}).catch(error => {
		
		log.error( error )
		
		dialog.showErrorBox(
			`Export Error`,
			`An error occured exporting:\n${exportPath}`
		)
	})
}
