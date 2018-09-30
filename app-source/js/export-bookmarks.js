'use strict'

const remote = require('electron').remote
const {ipcRenderer} = require( 'electron' )
const fs = require( 'fs-extra' )
const Store = require( 'electron-store' )
const store = new Store()

const dialog = remote.dialog

const 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )

let today = new Date().toISOString().slice(0, 10)
let serverName = server.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]

const exportProcess = remote.getCurrentWindow()
const exportPath = store.get('exportPath')  + `/${serverName} Bookmarks (${today}).html`


let bookmarks =
`<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`



function getBookmarks() {
	
	const getUrl = "/index.php/apps/bookmarks/public/rest/v2/bookmark?page=-1"
	
	let getInit = {
		
		method: 'GET',
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'default'
	}
	
	
	fetch(server + getUrl, getInit).then(function(response) {
		
		if (response.ok) {
			
			console.log('response OK')
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				'Server connection error',
				`there was an error connecting to:\n${server}`
			)
			
			console.log( response.error() )
		}
	
	}).then(function(message) {
		
		let doc = JSON.parse(message)
		

		if (doc['status'] == 'error') {
			
			dialog.showErrorBox(
				'JSON parsing error',
				`An error occured parsing the bookmarks`
			)
			
			console.log(doc['message'])	
		
		} else {
						
			outputBookmarks( doc.data )
		}
	
	}).catch(function(error) {
		
		dialog.showErrorBox(
			'Server connection error',
			`there was an error connecting to:\n${server}`
		)
		
		console.log(error)
	})
}



function outputBookmarks( array ) {
	
	for ( let item of array ) {
		
		let tagList = item.tags.toString()
		
		bookmarks +=
`
<DT><A HREF="${item.url}" TAGS="${tagList}">${item.title}</A>`
		
		if( item.description ) {
			
			bookmarks += `<DD>${item.description}`
		}
	}
	
	
	fs.outputFile( exportPath, bookmarks )

	.then(() => fs.readFile( exportPath, 'utf8') )
	
	.then(data => {
		
		let exportNotification = new Notification('Export Successful', {
			
			body: 'The bookmarks have been exported.'
		})
		
		exportNotification.onclick = () => {
			
			exportProcess.close()
		}
	})
	
	.catch(err => {
		
		console.error(err)
		
		let exportNotification = new Notification('Export Failed', {
			
			body: 'An error occured exporting the bookmarks.'
		})
		
		exportNotification.onclick = () => {
			
			exportProcess.close()
		}
	})
}

getBookmarks()
