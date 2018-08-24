'use strict'

const remote = require( 'electron' ).remote
const ipc = require( 'electron' ).ipcRenderer
const dialog = remote.dialog

const Store = require( 'electron-store' )
const store = new Store()

const $ = require( 'jquery' )

const urlParams = new URLSearchParams( location.search )



//note(@duncanmid): get login credentials

const 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )



//note(@duncanmid): old tag

const theTag = urlParams.get('tag')



//note(@duncanmid): serialize object

var serialize = function( obj ) {
	
	const str = []
	
	for ( let p in obj )
	
		if ( obj.hasOwnProperty(p) ) {
			
			str.push( encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]) )
		}
	
	return str.join("&")
}



//note(@duncanmid): populate form

function populateForm() {
	
	$('header').append( theTag )
	$('input[name="old_name"]').val( theTag )
	$('input[name="new_name"]').attr('placeholder', theTag).attr("pattern", '^(?!' + theTag + '$).*')
}



//note(@duncanmid): update tag

function updateTag() {
	
	const oldTag = $('input[name="new_name"]').val(),
	newTag = $('input[name="old_name"]').val()
	
	let query = serialize({
	
			'old_name': $('input[name="old_name"]').val(),
			'new_name': $('input[name="new_name"]').val()
		})
		
	const editUrl = "/index.php/apps/bookmarks/public/rest/v2/tag"
	
	const editInit = {
		
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'default'
	}
	
	fetch(server + editUrl + '?' + query, editInit).then(function(response) {
		
		if (response.ok) {
			
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				'Edit Tag Error',
				`An error occured whilst trying to edit the tag`
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
	
	populateForm()
	
	//note(@duncanmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	
	//note(@duncanmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		updateTag()
	})
})
