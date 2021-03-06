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

let folders			= store.get( 'folders' ).reverse(),
	tagsList 		= store.get('tags'),
	urlParams 		= new URLSearchParams( location.search ),
	currentFolder 	= urlParams.get('folder'),
	currentTag 		= urlParams.get('tag'),
	newUrl 			= urlParams.get('url'),
	newTitle 		= urlParams.get('title')

folders.unshift({
	"id": -1,
	"text": i18n.t( 'addbookmark:select.option.home', 'Home' )
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
$('option').localize()
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
	
	if( newUrl ) $('#url').val( newUrl )
	if( newTitle !== null ) $('#title').val( newTitle )
	
	for( let folder of folders ) {
		
		let selected = ''
		
		if( folder.id == currentFolder ) selected = ' selected';
		
		$('#folders').append( `<option value="${folder.id}"${selected}>${folder.text}</option>` )
	}
	
	$('#folders').select2({
		
		theme: "custom",
		width: '320px',
		language: {
			noResults:function() { return i18n.t( 'addbookmark:select.noresults', 'No results found' ) }
		}
	})
	
	$('#tags').select2({
		
		theme: "custom",
		width: '320px',
		tags: true,
		tokenSeparators: [',',';'],
		data: store.get('tags')
	})
		
	if( currentTag ) {
		
		let tagArray = []
		tagArray.push( currentTag )
		
		$('#tags').val( tagArray )
		$('#tags').trigger( 'change' )
	}
	
	
	//note(dgmid): cancel modal
	
	$('#cancel').click( function() {
		
		closeModal()
	})
	
	
	//note(dgmid): update data
	
	$('#modal-form').submit( function( e ) {
		
		e.preventDefault()
		
		let data = serialize.serialize({
			
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
		
		fetch.bookmarksApi( 'add', '', data, function( message ) {
			
			let returnedBookmark = JSON.parse( message )
			ipc.send('update-favicon', returnedBookmark['item'] )
			
			ipc.send('refresh', 'refresh')
			closeModal()
		})
	})
})
