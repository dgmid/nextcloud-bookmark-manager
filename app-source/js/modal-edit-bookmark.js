'use strict'

const i18n 			= require( './i18n.min' )

const remote 		= require( 'electron' ).remote
const ipc 			= require( 'electron' ).ipcRenderer
const dialog 		= remote.dialog

const Store 		= require( 'electron-store' )
const store 		= new Store()
const Mousetrap 	= require( 'mousetrap' )

const $ 			= require( 'jquery' )
const jqueryI18next = require( 'jquery-i18next' )

jqueryI18next.init(i18n, $)
require('select2')($)

const fetch			= require( './fetch.min' )
const serialize		= require( './serialize.min' )
const entities		= require( './entities.min' )

const 	folders = store.get( 'folders' ),
		urlParams = new URLSearchParams( location.search ),
		theId = urlParams.get('id')



//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipcRenderer.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): set lang & localize strings

$('html').attr('lang', i18n.language)
$('header span').localize()
$('label').localize()
$('input').localize()
$('button').localize()



//note(dgmid): register kbd shortcut
Mousetrap.bind('command+.', function() {
	
	closeModal()
})



//note(dgmid): populate form

function populateForm( bookmark ) {
	
	for( let folder of folders ) {
		
		$('#folder').append( `<option value="${folder.id}">${folder.title}</option>` )
	}
	
	$('header').append( entities.encode( bookmark['item']['title'] ) )
	$('input[name="url"]').val( bookmark['item']['url'] )
	$('input[name="title"]').val( bookmark['item']['title'] )
	$('textarea[name="description"]').val( bookmark['item']['description'] )
	$('#folder').val( bookmark['item']['folders'][0] )
	
	//note(dgmid): set any active tags
	
	let activeTags = []
	const allTags = store.get('tags')
	
	for (var i = 0; i < allTags.length; i++) {
		
		if( bookmark['item']['tags'].indexOf( allTags[i]['text'] ) > -1 ) {
			
			activeTags.push( allTags[i]['id'] )
		}
	}
	
	$('#tags').val( activeTags )
	$('#tags').trigger( 'change' )
}



//note(dgmid): close modal

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
	
	
	fetch.bookmarksApi( 'single', theId, '', function( message ) {
		
		populateForm( JSON.parse( message ) )
	})
	
	
	//note(dgmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	//note(dgmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		
		let data = '?'
		
		data += serialize.serialize({
	
			'record_id': theId,
			'url': $('input[name="url"]').val(),
			'title': $('input[name="title"]').val(),
			'description': $('textarea[name="description"]').val()
		})
		
		const tags = $('#tags').select2('data')
		for (var i = 0; i < tags.length; i++) {
			data += '&tags[]=' + encodeURIComponent(tags[i]['text'])
		}
		
		let folder = $('#folder').val()
		if( folder !== '-1' ) {
			data += '&folders[]=' + encodeURIComponent(folder)
		}
		
		fetch.bookmarksApi( 'modify', theId, data, function() {
			
			ipc.send('refresh', 'refresh')
			closeModal()
		})
	})
})
