'use strict'

const remote = require( 'electron' ).remote
const ipc = require( 'electron' ).ipcRenderer
const dialog = remote.dialog

const Store = require( 'electron-store' )
const store = new Store()

const $ = require( 'jquery' )
require('select2')($)



//note(@duncanmid): get login credentials

const 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )



//note(@duncanmid): serialize object

var serialize = function( obj ) {
	
	const str = []
	
	for ( let p in obj )
	
		if ( obj.hasOwnProperty(p) ) {
			
			str.push( encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]) )
		}
	
	return str.join("&")
}



//note(@duncanmid): add function

function addBookmark() {
	
	let query = serialize({
		
		'url': $('input[name="url"]').val(),
		'title': $('input[name="title"]').val(),
		'description': $('textarea[name="description"]').val()
		
	})
	
	const tags = $('#tags').select2('data')
	
	for (var i = 0; i < tags.length; i++) {
			
		query += '&item[tags][]=' + encodeURIComponent(tags[i]['text'])
			
	}
	
	const addUrl = "/index.php/apps/bookmarks/public/rest/v2/bookmark"
		
	const addInit = {
		
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'default'
	}
	
	
	fetch(server + addUrl + '?' + query, addInit).then(function(response) {
		
		if (response.ok) {
			
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				'Add Bookmark Error',
				'An error occured whilst trying to add the bookmark'
			)
			
			return response.text()
		}
	
	}).then(function(message) {
		
		ipc.send('refresh', 'refresh')
		closeModal()	
	
	}).catch(function(error) {
		
		console.log('ERROR')
		console.log(error)
	})
}



//note(@duncanmid): close modal

function closeModal() {
	
	const modal = remote.getCurrentWindow()
	modal.close()
}



$(document).ready(function() {
	
	
	$('#tags').select2({
		theme: "custom",
		width: '320px',
		tags: true,
		tokenSeparators: [',',';'],
		data: store.get('tags')
	})
	
	
	
	//note(@duncanmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	
	//note(@duncanmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		addBookmark()	
	})
})
