'use strict'

const i18n 			= require( './i18n.min' )

const remote 		= require( 'electron' ).remote
const ipc 			= require( 'electron' ).ipcRenderer

const Store 		= require( 'electron-store' )
const store 		= new Store()
const Mousetrap 	= require( 'mousetrap' )

const $ 			= require( 'jquery' )
const jqueryI18next = require( 'jquery-i18next' )

jqueryI18next.init(i18n, $)
const log			= require( 'electron-log' )
const fetch			= require( './fetch.min' )
const serialize		= require( './serialize.min' )

let folders 		= store.get( 'folders' ).reverse(),
	urlParams 		= new URLSearchParams( location.search ),
	currentFolder 	= urlParams.get('folder')

folders.unshift({
	"id": -1,
	"text": i18n.t( 'addfolder:select.option.home', 'Home' )
})



//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipc.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): set lang & localize strings

$('html').attr('lang', i18n.language)
$('header').localize()
$('label').localize()
$('input').localize()
$('button').localize()


//note(dgmid): register kbd shortcut

Mousetrap.bind('command+.', function() {
	
	closeModal()
})


//note(dgmid): close modal

function closeModal() {
	
	const modal = remote.getCurrentWindow()
	modal.close()
}



$(document).ready(function() {
	
	for( let folder of folders ) {
		
		let selected = ''
		
		if( folder.id == currentFolder ) selected = ' selected';
		
		$('#parent_folder').append( `<option value="${folder.id}"${selected}>${folder.text}</option>` )
	}
	
	
	//note(dgmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	//note(dgmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		
		let data = serialize.serialize({
			
			'title': $('input[name="title"]').val(),
			'parent_folder': $('select[name="parent_folder"]').val()
		})
		
		fetch.bookmarksApi( 'addfolder', '', data, function() {
			
			ipc.send('refresh', 'refresh')
			closeModal()
		})
	})
})
