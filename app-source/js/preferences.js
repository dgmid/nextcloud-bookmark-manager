'use strict'

const remote = require( 'electron' ).remote
const ipc = require( 'electron' ).ipcRenderer

const Store = require( 'electron-store' )
const store = new Store()

const $ = require( 'jquery' )



//note(@duncanmid): get login credentials

const 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )

if( server ) { $('input[name="server"]').val( server ) }
if( username ) { $('input[name="username"]').val( username ) }
if( password ) { $('input[name="password"]').val( password ) }



//note(@duncanmid): set prefs function

function updatePrefs() {
	
	const 	server = $('input[name="server"]').val(),
			username = $('input[name="username"]').val(),
			password = $('input[name="password"]').val()
	
	store.set('loginCredentials', {
		
		server: server,
		username: username,
		password: password
	})
	
	ipc.send('reload', 'reload')
	closeModal()
}



//note(@duncanmid): close modal

function closeModal() {
	
	const modal = remote.getCurrentWindow()
	modal.close()
}



$(document).ready(function() {	
	
	//note(@duncanmid): cancel modal
	
	$('#cancel').click( function() {
		
		const modal = remote.getCurrentWindow()
		modal.close()
	})
	
	
	//note(@duncanmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		updatePrefs()	
	})
})
