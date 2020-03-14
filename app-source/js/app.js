'use strict'

const { ipcRenderer, shell, remote } = require( 'electron' )
const Store			= require( 'electron-store' )
const store			= new Store()
const dialog		= remote.dialog
const $				= require( 'jquery' )
const generate		= require( 'string-to-color' )
const log			= require( 'electron-log' )

const fetch			= require( './fetch.min' )
const maintable		= require( './bookmark-table.min' )
const modalWindow	= require( './modal.min' )


let server 		= store.get( 'loginCredentials.server' ),
	username 	= store.get( 'loginCredentials.username' ),
	password 	= store.get( 'loginCredentials.password' ),
	firstLoad 	= true,
	modal,
	total

//xxx(dgmid): test
let bookmarkFile = new Store({
	name: 'bookmarks',
	defaults: {
		data: null
	}
})



//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipcRenderer.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): populate dataTable

function parseBookmarks( array ) {
	
	total = array.length
	
	let allTags = []
	
	for ( let item of array ) {
		
		let taglist = ''
		
		if( item.tags.length < 1 ) { item.tags.push('un-tagged') }
		
		for ( let tagitem of item.tags ) {
		
			let color,
				untagged
			
			if( tagitem === 'un-tagged' ) {
				
				color		 = ''
				untagged	 = ' untagged'
				
			} else {
				
				color		 = generate(tagitem)
				untagged	 = ''
			}
			
			taglist += `<span class="tag${untagged}" title="${tagitem}" style="background-color: ${color};">${tagitem}</span>`
			
			allTags.push( tagitem )
		}
		
		let created = 	new Date( item.added * 1000 ),
			modified = 	new Date( item.lastmodified * 1000 )
			
		
		maintable.bookmarkTable.row.add( [
			
			item.id,
			htmlEntities( item.title ),
			htmlEntities( item.description ),
			item.url,
			created.toLocaleDateString(),
			modified.toLocaleDateString(),
			taglist
		
		]).draw( false )
	}
	
	buildTagList( allTags.sort() )
	
	if( firstLoad === true ) {
		
		setColControls()	
		
		const check = require( './version.min' )
		firstLoad = false
		check.appVersion()
	}
}



//note(dgmid): get list of tags with count

function buildTagList( array ) {
	
	//clear the taglists first
	$('.taglist').html( '' )
	
	let compressed = [],
	copy = array.slice(0)
	
	for (var i = 0; i < array.length; i++) {
	
		var myCount = 0
		
		for (var w = 0; w < copy.length; w++) {
			
			if (array[i] == copy[w]) {
				
				myCount++
				delete copy[w]
			}
		}
		
		if (myCount > 0) {
			
			var a = new Object()
			a.value = array[i]
			a.count = myCount
			compressed.push(a)
		}
	}
	
	
	let results = [],
	untagged = '',
	count = 1
	
	for ( let tagitem of compressed ) {
		
		if( tagitem.value === 'un-tagged' ) {
			
			untagged =
			
			`<dd class="margin-top">
				<a href="#" class="filter" data-filter="${tagitem.value}">
					<span class="filter-icon icon-untagged"></span>
					<span class="filter-name">${tagitem.value}</span>
					<span class="filter-count">${tagitem.count}</span>
				</a>
			</dd>`
		
		} else {
			
			var color = generate(tagitem.value)
			
			$('#taglist').append(
			
			`<dd>
				<a href="#" class="filter" data-filter="${tagitem.value}"><span class="tag" title="${tagitem.value}" style="background-color: ${color};">${tagitem.value}</span> <span class="filter-name">${tagitem.value}</span>
				<span class="filter-count">${tagitem.count}</span></a>
			</dd>`
			)
			
			results.push( { "id": count , "text": tagitem.value } )
			count++
		}
	}
	
	
	store.set('tags', results )
	
	
	$('#taglist-extras').append( `${untagged}` )
	$('#filter-all').append(
		 `<dd>
			<a href="#" class="filter selected" data-filter="">
				<span class="filter-icon icon-home"></span>
				<span class="filter-name">All Bookmarks</span>
				<span class="filter-count">${total}</span>
			</a>
		</dd>` )
	
	$('#sidebar').fadeIn( 400 )
	loader( 'remove' )
}



//note(dgmid): add bookmark

ipcRenderer.on('add-bookmark', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + '/../html/add-bookmark.html', 480, 340, true )	
})


//note(dgmid): delete bookmark

ipcRenderer.on('delete-bookmark', (event, message) => {
	
	let bookmark = false
	
	if( message == 'delete-bookmark' ) {
		
		bookmark = maintable.bookmarkTable.row('.selected').data()
	
	} else {
	
		bookmark = message
	}
	
	if( bookmark ) {
		
		let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {	
								message: `Are you sure you want to delete the bookmark ${bookmark[1]}?`,
								detail: `This operation is not reversable.`,
								buttons: ['Delete Bookmark','Cancel']
							})
			
		if( response === 0 ) {
			
			fetch.bookmarksApi('delete', bookmark[0], '', function() {
				
				maintable.bookmarkTable.clear().draw()
				
				loader( 'add' )
				
				fetch.bookmarksApi('all', '', '', function( array ){
					
					parseBookmarks( array )
				})
			})
		}
	
	} else {
	
		dialog.showErrorBox(
			`Delete Bookmark Error`,
			`An entry must be selected in order to delete`
		)
	}
})



//note(dgmid): edit bookmark

ipcRenderer.on('edit-bookmark', (event, message) => {
	
	let bookmark = false
	
	if( message == 'edit-bookmark' ) {
		
		bookmark = maintable.bookmarkTable.row('.selected').data()
		
	} else {
		
		bookmark = message
	}
	
	
	if( bookmark ) {
		
		modalWindow.openModal( 'file://' + __dirname + '/../html/edit-bookmark.html?id=' + bookmark[0], 480, 340, true )
		
	} else {
		
		dialog.showErrorBox(
			'Edit Bookmark Error',
			'An entry must be selected in order to edit'
		)
	}
})



//note(dgmid): edit tag

ipcRenderer.on('edit-tag', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + '/../html/edit-tag.html?tag=' + message, 480, 180, false )
})



//note(dgmid): delete tag

ipcRenderer.on('delete-tag', (event, message) => {
	
	log.info(message)
	
	let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {	
								message: `Are you sure you want to delete the tag ${message}?`,
								detail: `This operation is not reversable.`,
								buttons: ['Delete Tag','Cancel']
							})
	
	if( response === 0 ) {
		
		fetch.bookmarksApi( 'deletetag', '', message, function() {
			
			maintable.bookmarkTable.clear().draw()
			loader( 'add' )
			
			fetch.bookmarksApi( 'all', '', '', function( array ) {
				
				parseBookmarks( array )
			})
		})
	}
})



//note(dgmid): log in modal

ipcRenderer.on('open-login', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
})



//note(dgmid): refresh bookmarks

ipcRenderer.on('refresh-bookmarks', (event, message) => {
	
	if( !$('#loader').length ) {
	
		maintable.bookmarkTable.clear().draw()
		
		loader( 'add' )
		
		fetch.bookmarksApi( 'all', '', '', function( array ) {
			
			parseBookmarks( array )
		})
	}
})



//note(dgmid): close login modal

ipcRenderer.on('close-login-modal', (event, message) => {
	
	modal.close()
})



//note(dgmid): search

ipcRenderer.on('find', (event, message) => {
	
	$('#search').focus()
})



//note(dgmid): reload

ipcRenderer.on('reload', (event, message) => {
	
	loader( 'add' )
	
	maintable.bookmarkTable.clear().draw()
	
	fetch.bookmarksApi( 'all', '', '', function( array ) {
		
		parseBookmarks( array )
	})
})


//note(dgmid): set column checkboxes

function setColControls() {
	
	let cols = store.get('tableColumns')
	
	for (let col in cols) {
		
		$(`#${col}`).prop('checked', cols[col])
		
	}
}



//note(dgmid): htmlentities

function htmlEntities( str ) {
	
	return 	String(str)
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
}



//note(dgmid): open update link in default browser

$('body').on('click', '#update', (event) => {
	
	event.preventDefault()
	
	let link = $('#update').attr( 'data-url' )
	
	shell.openExternal(link)
})



//note(dgmid): search

$('#search').bind( 'keyup', function() {
	
	let str = $(this).val(),
		state = ( str.length > 0 ) ? $('#clear').show() : $('#clear').hide()
})


$('#clear').click(function() {
	
	let data = $('.taglist .filter.selected').data('filter')
	
	$(this).hide()
	$('#search').val('')
	maintable.bookmarkTable.search( '' ).columns(6).search( data ).draw()
})


window.onkeydown = function(e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
};



//note(dgmid): loader

function loader( string  ) {
	
	if( string === 'add'  ) {
		
		$('main #loader').remove()
		$('main').append('<div id="loader"></div>')
	
	} else {
		
		$('#loader').fadeOut(400, function() { $(this).remove() } )
	}
}



$(document).ready(function() {
	
	loader( 'add' )
	
	fetch.bookmarksApi( 'all', '', '', function( array ) {
		
		parseBookmarks( array )
	})
	
	
	//note(dgmid): click tag list item to filter table
	
	$('.taglist').on('click', '.filter', function() {
		
		$('.filter').removeClass('selected')
		$(this).addClass('selected')
		
		let data = $(this).data('filter')
		maintable.bookmarkTable.columns(6).search(data).draw()
	})
	
	
	$('#taglist').on('mousedown', '.filter', function(e) {
		
		if(e.which == 3) {
			
			let data = $(this).data('filter')
			ipcRenderer.send('show-tags-menu', data )
		}
	})
	
	
	//note(dgmid): toggle col visibility
	
	$('.col-toggle').on( 'click', function () {
		
		let column 	= maintable.bookmarkTable.column( $(this).attr('data-column') ),
			id 		= $(this).prop( 'id' )
		
		if( $(this).prop('checked') === true ) {
			
			column.visible( true )
			store.set( `tableColumns.${id}`, true )
		
		} else {
			
			column.visible( false )
			store.set( `tableColumns.${id}`, false )
		}
	})
	
	
	//note(dgmid): add bookmark
	
	$( '#add-bookmark' ).click( function() {
		
		modalWindow.openModal( 'file://' + __dirname + '/../html/add-bookmark.html', 480, 340, true )
	})
	
	
	//note(dgmid): show context menu
	
	$('body #bookmarks tbody').on('mouseup', 'tr', function(event) {
		
		if( event.which === 3 ) {
			
			let data = maintable.bookmarkTable.row( this ).data()
			
			if( data ) {
			
				ipcRenderer.send('show-bookmark-menu', data )
			}
		}
	})
	
	
	//note(dgmid): highlight row
	
	$('#bookmarks').on('key-focus.dt', function(e, datatable, cell) {
	
		$(maintable.bookmarkTable.row(cell.index().row).node()).addClass('selected')
	})
	
	
	//note(dgmid): remove hilight
	
	$('#bookmarks').on('key-blur.dt', function(e, datatable, cell) {
	
		$(maintable.bookmarkTable.row(cell.index().row).node()).removeClass('selected')
	})
	
	
	//note(dgmid): open url on keepress
	
	$('#bookmarks').on('key.dt', function(e, datatable, key, cell, originalEvent) {
		
		// spacebar
		if( key === 32 ) {
			
			if( !$('#add-bookmark, .col-toggle').is(":focus") ) {
				
				const data = maintable.bookmarkTable.row(cell.index().row).data()
				shell.openExternal(data[3])
			}
		}
	})
	
	
	//note(dgmid): search field
	
	$('#search').keyup(function(){

		maintable.bookmarkTable.search($(this).val()).draw()
	})
	
	
	//note(dgmid): if missing credentials, open login window
	
	if( !server || !username || !password ) {
		
		modalWindow.openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
	}
})
