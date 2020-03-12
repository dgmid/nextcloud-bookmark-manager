'use strict'

const { remote }	= require( 'electron' )
const ipc 			= require( 'electron' ).ipcRenderer
const dialog		= remote.dialog
const Store			= require( 'electron-store' )
const store			= new Store()
const $				= require( 'jquery' )
const log			= require( 'electron-log' )



let bookmarkFile = new Store({
	
	name: 'bookmarks',
	defaults: {
		data: null
	}
})



const path = '/index.php/apps/bookmarks/public/rest/v2'
const calltype = {
	
	'all': {
		'method': 'GET',
		'url': '/bookmark?page=-1'	
	},
	'single': {
		'method': 'GET',
		'url': '/bookmark/'
	},
	'add': {
		'method': 'POST',
		'url': '/bookmark?'
	},
	'modify': {
		'method': 'PUT',
		'url': '/bookmark/',
	},
	'delete': {
		'method': 'DELETE',
		'url': '/bookmark/'
	},
	'modifytag': {
		'method': 'POST',
		'url': '/tag?'
	},
	'deletetag': {
		'method': 'DELETE',
		'url': '/tag?old_name='
	}
}



module.exports.bookmarksApi = function( call, id, data, callback ) {
	
	let server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )
	
	let init = {
		
		method: calltype[call]['method'],
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'no-cache',
		credentials: 'omit'
	}
	
	// modifytag /index.php/apps/bookmarks/public/rest/v2/tag?${data}
	// deletetag /index.php/apps/bookmarks/public/rest/v2/
	
	let url = `${path}${calltype[call]['url']}${id}${data}`
	
	log.info(`${call} : ${url}`)
	
	fetch(server + url, init)
	.then(function(response) {
		
		if(!response.ok) {
			
			log.warn(`fetch error: ${response.status} - ${response.statusText}`)
			let errTxt = response.status
			throw Error( `${response.status} ${errTxt}` )
			
		} else {
		
			log.info( `response ok` )
			return response.text()
		}
		
	}).then(function(message) {
		
		switch( call ) {
			
			case 'all':
				
				let doc = JSON.parse(message)
				
				if (doc['status'] == 'error') {
					
					dialog.showErrorBox(
						`JSON parsing error`,
						`An error occured parsing the bookmarks`
					)
					
					log.error(doc['message'])
				
				} else {
					
					callback( doc.data )
					bookmarkFile.set('data', doc.data)
				}
				
			break
			
			case 'single': callback( message )
			break
			
			default: callback()
		}
		
	}).catch(function( error ) {
		
		log.error(error)
		
		dialog.showErrorBox(
			`Error`,
			`problem retrieving:\n${server}${url}\n\n${error}`
		)
	})
}