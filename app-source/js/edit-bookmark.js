'use strict'

const remote = require( 'electron' ).remote
const ipc = require( 'electron' ).ipcRenderer
const dialog = remote.dialog

const Store = require( 'electron-store' )
const store = new Store()

const $ = require( 'jquery' )
require('select2')($)

const urlParams = new URLSearchParams( location.search )



//note(@duncanmid): get login credentials

const 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )



//note(@duncanmid): bookmark id

const theId = urlParams.get('id')


//note(@duncanmid): serialize object

var serialize = function( obj ) {
	
	const str = []
	
	for ( let p in obj )
	
		if ( obj.hasOwnProperty(p) ) {
			
			str.push( encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]) )
		}
	
	return str.join("&")
}



//note(@duncanmid): get bookmark by ID

function getBookmark() {
	
	const editUrl = "/index.php/apps/bookmarks/public/rest/v2/bookmark/"
		
	const editInit = {
		
		method: 'GET',
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'default'
	}
	
	
	fetch(server + editUrl + theId, editInit).then(function(response) {
		
		if (response.ok) {
			
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				'Edit Bookmark Error',
				`An error occured whilst trying to edit the bookmark`
			)
			
			closeModal()
			return response.text()
		}
	
	}).then(function(message) {
		
		populateForm( JSON.parse( message ) )
	
	}).catch(function(error) {
		
		console.log('ERROR')
		console.log(error)
	})
}



//note(@duncanmid): populate form

function populateForm( bookmark ) {
	
	$('header').append( bookmark['item']['title'] )
	$('input[name="url"]').val( bookmark['item']['url'] )
	$('input[name="title"]').val( bookmark['item']['title'] )
	$('textarea[name="description"]').val( bookmark['item']['description'] )
	
	//note(@duncanmid): set any active tags
	
	//create blank array
	let activeTags = []
	const allTags = store.get('tags')
	//loop through store tags
	
	for (var i = 0; i < allTags.length; i++) {
		
		//if tag in bookmark tags push id to blank array	
		if( bookmark['item']['tags'].indexOf( allTags[i]['text'] ) > -1 ) {
			
			activeTags.push( allTags[i]['id'] )
		}
	}
	
	$('#tags').val( activeTags )
	$('#tags').trigger( 'change' )
}



//note(@duncanmid): update function

function updateBookmark() {
	
	let query = serialize({
	
			'record_id': theId,
			'url': $('input[name="url"]').val(),
			'title': $('input[name="title"]').val(),
			'description': $('textarea[name="description"]').val()
		})
	
	const tags = $('#tags').select2('data')
	
	for (var i = 0; i < tags.length; i++) {
			
		query += '&item[tags][]=' + encodeURIComponent(tags[i]['text'])
			
	}
	
	const editUrl = "/index.php/apps/bookmarks/public/rest/v2/bookmark/"
		
	const editInit = {
		
		method: 'PUT',
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'default'
	}
	
	
	fetch(server + editUrl + theId + '?' + query, editInit).then(function(response) {
		
		if (response.ok) {
			
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				'Edit Bookmark Error',
				`An error occured whilst trying to edit the bookmark`
			)
			
			closeModal()
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
	
	getBookmark()
	
	
	//note(@duncanmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	
	//note(@duncanmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		updateBookmark()
	})
})
