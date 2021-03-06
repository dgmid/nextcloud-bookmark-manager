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

let folders 		= store.get( 'folders' ).reverse(),
	urlParams 		= new URLSearchParams( location.search ),
	theId 			= urlParams.get('id')

folders.unshift({
	"id": -1,
	"text": i18n.t( 'editbookmark:select.option.home', 'Home' )
})



//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipcRenderer.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): set lang & localize strings

$('html').attr('lang', i18n.language)
$('header span').localize()
$('label').localize()
$('input').localize()
$('option').localize()
$('button').localize()



//note(dgmid): register kbd shortcut
Mousetrap.bind('command+.', function() {
	
	closeModal()
})



//note(dgmid): populate form

function populateForm( bookmark ) {
	
	if( bookmark['item']['folders'].includes( -1 ) ) {
		
		$('#folders').val( '-1' )
	}
	
	for( let folder of folders ) {
		
		let selected = ''
		if( bookmark['item']['folders'].includes( folder.id ) ) {
			
			selected = ' selected'
		}
		$('#folders').append( `<option value="${folder.id}"${selected}>${folder.text}</option>` )
	}
	
	$('header').append( entities.encode( bookmark['item']['title'] ) )
	$('input[name="url"]').val( bookmark['item']['url'] )
	$('input[name="title"]').val( bookmark['item']['title'] )
	$('textarea[name="description"]').val( bookmark['item']['description'] )
	
	
	//note(dgmid): set any active tags
	
	let activeTags = []
	const allTags = store.get('tags')
	
	for (let singleTag of  allTags) {
		
		if( bookmark['item']['tags'].indexOf( singleTag['text'] ) > -1 ) {
			
			activeTags.push( singleTag['id'] )
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
	
	$('#folders').select2({
		theme: "custom",
		width: '320px',
		language: {
			noResults:function() { return i18n.t( 'editbookmark:select.noresults', 'No results found' ) }
		}
	})
	
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
		
		let selectedTags = $('#tags').select2('data')
		
		for (let tag of selectedTags) {
			
			data += '&tags[]=' + encodeURIComponent(tag['text'])
		}
		
		let selectedFolders = $('#folders').select2('data')
		
		for(let folder of selectedFolders) {
			
			data += '&folders[]=' + encodeURIComponent(folder['id'])
		}
		
		fetch.bookmarksApi( 'modify', theId, data, function() {
			
			ipc.send('refresh', 'refresh')
			closeModal()
		})
	})
})
