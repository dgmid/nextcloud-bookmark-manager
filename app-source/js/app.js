'use strict'

const i18n = require( './i18n.min' )

const { ipcRenderer, shell, remote } = require( 'electron' )
const Store			= require( 'electron-store' )
const store			= new Store()
const dialog		= remote.dialog
const $				= require( 'jquery' )
const generate		= require( 'string-to-color' )
const log			= require( 'electron-log' )

const fetch			= require( './fetch.min' )
const maintable		= require( './bookmark-table.min' )
const dates			= require( './dates.min' )
const modalWindow	= require( './modal.min' )
const exp 			= require( './export.min' )
const entities 		= require( './entities.min' )

const jqueryI18next = require( 'jquery-i18next' )
jqueryI18next.init(i18n, $)

let server 		= store.get( 'loginCredentials.server' ),
	username 	= store.get( 'loginCredentials.username' ),
	password 	= store.get( 'loginCredentials.password' ),
	firstLoad 	= true,
	modal,
	total

//note(dgmid): store for bookmarks

let bookmarks	= new Store( {name: 'bookmarks'} )



//note(dgmid): log exceptions

window.onerror = function( error, url, line ) {
	
	ipcRenderer.send( 'error-in-render', {error, url, line} )
}



//note(dgmid): populate dataTable

function parseBookmarks( array ) {
	
	total = array.length
	
	let folderList	= store.get( 'folders' ),
		allTags 	= [],
		noTag 		= i18n.t('app:sidebar.filter.untagged', 'un-tagged')
	
	for ( let item of array ) {
		
		let taglist = ''
		
		//note(dgmid): remove duplicate tags
		let uniqueTags = Array.from( new Set( item.tags ) )
		
		if( uniqueTags.length < 1 ) { uniqueTags.push( noTag ) }
		
		for ( let tagitem of uniqueTags ) {
		
			let color,
				untagged
			
			if( tagitem === noTag ) {
				
				color		 = ''
				untagged	 = ' untagged'
				
			} else {
				
				color		 = generate(tagitem)
				untagged	 = ''
			}
			
			taglist += `<span class="tag${untagged}" title="${entities.encode(tagitem)}" style="background-color: ${color};">${entities.encode(tagitem)}</span> <span class="tagname">${entities.encode(tagitem)}</span>`
			
			allTags.push( tagitem )
		}
			
		let created 	= item.added,
			modified 	= item.lastmodified
		
		let theFolders = ''
		
		if( item.folders.length < 2 && item.folders[0] == -1 ) {
			
			theFolders = '⋯'
		
		} else {
			
			for( let folderItem of item.folders  ) {
				
				theFolders += '<span class="folder">'
				
				if( folderItem == -1 ) {
					
					theFolders += 'Home'
				
				} else {
				
					theFolders += folderList.find(x => x.id === folderItem).text
					
				}
				
				theFolders += '</span>'
				
			}
		}
		
		maintable.bookmarkTable.row.add( [
			
			item.id,
			' ',
			htmlEntities( item.title ),
			htmlEntities( item.description ),
			item.url,
			created,
			dates.columnDate( created ),
			modified,
			dates.columnDate( modified ),
			item.folders.join(','),
			theFolders,
			taglist
		
		]).draw( false )
	}
	
	buildFolderList( folderList )
	buildTagList( allTags.sort(), noTag )
	
	if( firstLoad === true ) {
		
		setColControls()
		
		const check = require( './version.min' )
		firstLoad = false
		check.appVersion()
	}
}



//note(dgmid): populate folder menu

function buildFolderList( folders ) {
	
	$('#folderlist').empty()
	
	folders.sort((a,b) => (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0))
	
	for( let folder of folders ) {
		
		$('#folderlist').append( `<dd><a href="#" class="filter folder" data-id="${folder.id}" data-filter="${folder.id}" data-name="${escape(folder.text)}">${folder.text}</a></dd>` )
	}
}


//note(dgmid): get list of tags with count

function buildTagList( array, noTag ) {
	
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
		
		if( tagitem.value === noTag ) {
			
			untagged =
			
			`<dd class="margin-top">
				<a href="#" class="filter untagged" data-filter="${escape(tagitem.value)}">
					<span class="filter-icon icon-untagged"></span>
					<span class="filter-name">${entities.encode(tagitem.value)}</span>
					<span class="filter-count">${tagitem.count}</span>
				</a>
			</dd>`
		
		} else {
			
			var color = generate(tagitem.value)
			
			$('#taglist').append(
			
			`<dd>
				<a href="#" class="filter tagfilter" data-id="${count}" data-filter="${entities.encode(tagitem.value)}">

						<span class="tag" title="${entities.encode(tagitem.value)}" style="background-color: ${color};">${entities.encode(tagitem.value)}</span> <span class="filter-name">${entities.encode(tagitem.value)}</span>

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
			<a href="#" class="filter all  selected" data-filter="">
				<span class="filter-icon icon-bookmarks"></span>
				<span class="filter-name">${i18n.t('app:sidebar.filter.all','All Bookmarks')}</span>
				<span class="filter-count">${total}</span>
			</a>
		</dd>` )
	
	$('#sidebar').fadeIn( 400 )
	loader( 'remove' )
}



//note(dgmid): add bookmark

ipcRenderer.on('add-bookmark', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + `/../html/add-bookmark.html?folder=${getCurrentFolder()}&tag=${getCurrentTag()}`, 480, 390, false )
})


//note(dgmid): delete bookmark

ipcRenderer.on('delete-bookmark', (event, message) => {
	
	if( message == 'delete-bookmark' ) {
		
		let row = maintable.bookmarkTable.row('.selected').data()
		
		if( typeof row === 'undefined' ) {
			
			deleteBookmark( 'delete-bookmark' )
		
		} else {
			
			let bookmark = [row[0], entities.decode(row[2])]
			deleteBookmark( bookmark )
		}
	
	} else {
	
		deleteBookmark( message )
	}

})



//note(dgmid): delete bookmarks from info panel

$('body').on('click', '.info-delete', function(e) {
	
	let id = $( this ).data( 'id' )
	
	fetch.bookmarksApi( 'single', id, '', function( message ) {
		
		let obj 		= JSON.parse( message ),
			bookmark 	= []
		
		bookmark.push( obj['item']['id'] )
		bookmark.push( obj['item']['title'] )
		
		deleteBookmark( bookmark )
	})
})



//note(dgmid): delete bookmark

function deleteBookmark( bookmark ) {
	
	if( bookmark !== 'delete-bookmark' ) {
		
		let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {	
								message: i18n.t('app:dialog.message.deletebookmark', 'Are you sure you want to delete the bookmark {{- bookmark}}?', {bookmark: bookmark[1]}),
								detail: i18n.t('app:dialog.detail.deletebookmark', 'This operation is not reversable.'),
								buttons: [i18n.t('app:dialog.button.deletebookmark', 'Delete Bookmark'), i18n.t('app:dialog.button.cancel', 'Cancel')]
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
			i18n.t('app:errorbox.title.deletebookmark', 'Delete Bookmark Error'),
			i18n.t('app:errorbox.content.deletebookmark', 'A bookmark must be selected in order to delete it')
		)
	}
}



//note(dgmid): edit bookmark

ipcRenderer.on('edit-bookmark', (event, message) => {
	
	let bookmark = false
	
	if( message == 'edit-bookmark' ) {
		
		bookmark = maintable.bookmarkTable.row('.selected').data()
		
	} else {
		
		bookmark = message
	}
	
	
	if( bookmark ) {
		
		modalWindow.openModal( 'file://' + __dirname + '/../html/edit-bookmark.html?id=' + bookmark[0], 480, 390, false )
		
	} else {
		
		dialog.showErrorBox(
			i18n.t('app:errorbox.title.editbookmark', 'Edit Bookmark Error'),
			i18n.t('app:errorbox.content.editbookmark', 'A bookmark must be selected in order to edit it')
		)
	}
})



//note(dgmid): edit bookmarks from info panel

$('body').on('click', '.info-edit', function(e) {
	
	let id = $( this ).data( 'id' )
	
	modalWindow.openModal( 'file://' + __dirname + '/../html/edit-bookmark.html?id=' + id, 480, 390, false )
})



//note(dgmid): edit tag

ipcRenderer.on('edit-tag', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + '/../html/edit-tag.html?tag=' + message, 480, 180, false )
})



//note(dgmid): delete tag

ipcRenderer.on('delete-tag', (event, message) => {
	
	let tags 	= store.get( 'tags' ),
		tag 	= tags.find(x => x.id === message).text
	
	let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {
								message: i18n.t('app:dialog.message.deletetag', 'Are you sure you want to delete the tag {{- tag}}?', {tag: tag}),
								detail: i18n.t('app:dialog.detail.deletetag', 'This operation is not reversable.'),
								buttons: [i18n.t('app:dialog.button.deletetag', 'Delete Tag'), i18n.t('app:dialog.button.cancel', 'Cancel')]
							})
	
	if( response === 0 ) {
		
		fetch.bookmarksApi( 'deletetag', '', encodeURIComponent(tag), function() {
			
			maintable.bookmarkTable.clear().draw()
			loader( 'add' )
			
			fetch.bookmarksApi( 'all', '', '', function( array ) {
				
				parseBookmarks( array )
			})
		})
	}
})



///note(dgmid): create new folder

ipcRenderer.on('new-folder', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + `/../html/add-folder.html?folder=${getCurrentFolder()}`, 480, 212, false )
})


//note(dgmid): add to and delete from folder

ipcRenderer.on('move-bookmark', (event, message) => {
	
	if( message.method === 'deletefromfolder' && message.count < 2 ) {
		
		let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {
			message: i18n.t('app:dialog.message.deletefromfolder', 'Are you sure you want to delete the current bookmark from this folder?'),
			detail: i18n.t('app:dialog.detail.deletefromfolder', 'Deleting the current bookmark from this folder will also delete the bookmark.'),
			buttons: [i18n.t('app:dialog.button.deletefromfolder', 'Delete Bookmark'), i18n.t('app:dialog.button.cancel', 'Cancel')]
		})
		
		if( response === 0 ) {
			
			moveBookmark( message.method, message.folder_id, message.bookmark_id )	
		}
	
	} else {
		
		moveBookmark( message.method, message.folder_id, message.bookmark_id )
	}
	
	function moveBookmark( method, folder_id, bookmark_id ) {
	
		fetch.bookmarksApi( message.method, message.folder_id, `/bookmarks/${message.bookmark_id}`, function() {
			
			maintable.bookmarkTable.clear().columns.adjust().responsive.recalc().draw()
				loader( 'add' )
			
			fetch.bookmarksApi( 'all', '', '', function( array ) {
				
				parseBookmarks( array )
			})
		})
	}
})


//note(dgmid): delete folder

ipcRenderer.on('delete-folder', (event, message) => {
	
	let id 		= message[0],
		title 	= message[1]
	
	let response = dialog.showMessageBoxSync(remote.getCurrentWindow(), {
								message: i18n.t('app:dialog.message.deletefolder', 'Are you sure you want to delete the folder {{- folder}}?', {folder: unescape(title)}),
								detail: i18n.t('app:dialog.detail.deletefolder', 'Deleting this folder will also delete any bookmarks it contains'),
								buttons: [i18n.t('app:dialog.button.deletefolder', 'Delete Folder'), i18n.t('app:dialog.button.cancel', 'Cancel')]
							})
	
	if( response === 0 ) {
		
		fetch.bookmarksApi( 'deletefolder', id, '', function() {
			
			maintable.bookmarkTable.clear().draw()
			loader( 'add' )
			
			fetch.bookmarksApi( 'folders', '', '', function() {
				
				fetch.bookmarksApi( 'all', '', '', function( array ) {
					
					parseBookmarks( array )
				})
			})
		})
	}
})



//note(dgmid): get info from context menu

ipcRenderer.on('info-bookmark', (event, message) => {
	
	toggleInfoPanel( $(`#row_${message}`) )
})



//note(dgmid): toggle info

function toggleInfoPanel( tr ) {
	
	let row = maintable.bookmarkTable.row( tr )
	
	if ( row.child.isShown() ) {
		
		row.child.hide()
		tr.removeClass('shown')
	
	} else {
		
		row.child( maintable.detailsTable(row.data()) ).show()
		tr.addClass('shown')
	}
} 



//note(dgmid): get current folder / get current tag

function getCurrentFolder() {
	
	let id = $('.filter.folder.selected').data( 'id' )
	if( !id ) id = -1
	return id
}



function getCurrentTag() {
	
	let id = $('#taglist .filter.selected').data( 'id' )
	if( !id ) id = ''
	return id
}



//note(dgmid): columns menu

ipcRenderer.on('toggle-column', (event, message) => {
	
	let column 	= maintable.bookmarkTable.column( message.id ),
		state 	= (message.state == false) ? true : false
		
	column.visible( state ).draw()
	$(`#${message.name}`).prop('checked', state)
	store.set( `tableColumns.${message.name}`, state )
})


//note(dgmid): log in modal

ipcRenderer.on('open-login', (event, message) => {
	
	modalWindow.openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
})



//note(dgmid): refresh bookmarks

ipcRenderer.on('refresh-bookmarks', (event, message) => {
	
	let server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )
	
	maintable.bookmarkTable.search('').columns().search('').clear().draw()
	
	if( server && username && password ) {
		
		if( !$('#loader').length ) {
			
			loader( 'add' )
			
			fetch.bookmarksApi( 'folders', '', '', function() {
				
				fetch.bookmarksApi( 'all', '', '', function( array ) {
					
					parseBookmarks( array )
				})
			})
		}
	}
})



//note(dgmid): export all bookmarks

ipcRenderer.on('export-bookmarks', (event, message) => {
	
	let exportPath	= store.get('exportPath')
	exp.exportBookmarks( exportPath )
})


//note(dgmid): close login modal

ipcRenderer.on('login-ok', (event, message) => {
	
	modalWindow.closeModal()
	loader( 'add' )
	
	fetch.bookmarksApi( 'all', '', '', function( array ) {
		
		parseBookmarks( array )
	})
})



//note(dgmid): search

ipcRenderer.on('find', (event, message) => {
	
	$('#search').focus()
})



//note(dgmid): window state

ipcRenderer.on('state', (event, message) => {
	
	if( message === 'blur' ) {
		
		$('body').addClass( 'blurred' )
		
	} else {
		
		$('body').removeClass( 'blurred' )
	}
})



//note(dgmid): info panel width

function setPanelWidth() {
	
	if( $('td[colspan]') ) {
	
		let cols = maintable.bookmarkTable.columns().visible().toArray()
		let count = cols.filter(Boolean).length
		$('td[colspan]').attr( 'colspan', count )
	}
}



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



//note(dgmid): open info panel link in default browser
	
$('body').on('click', '.details-panel a', function(event) {
	
	event.preventDefault()
	
	let link = $(this).attr( 'href' )
	shell.openExternal(link)
})



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
	maintable.bookmarkTable.search( '' ).columns(11).search( data ).columns.adjust().responsive.recalc().draw()
})


window.onkeydown = function(e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault()
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
	
	//note(dgmid): set lang
	
	$('html').attr('lang', i18n.language)
	
	//note(dgmid): translate html strings
	
	$('#folder-home .filter-name').localize()
	$('#sidebar-tags .list-title').html( i18n.t('app:sidebar.title.tags', 'Tags') )
	$('#column-list dt').html( i18n.t('app:sidebar.title.columns', 'Columns') )
	$('#description span').html( i18n.t('app:sidebar.filter.description', 'Description') )
	$('#column-list label span').localize()
	$('#add-bookmark span').html( i18n.t('app:button.new', 'Add New Bookmark') )
	$('#search').attr('placeholder', i18n.t('app:sidebar.search', 'Search'))
	
	//note(dgmid): click tag list item to filter table
	
	$('.taglist, .folderlist').on('click', '.filter', function() {
		
		let col = $(this).hasClass('folder') ? 9 : 11
		
		$('#toggle-info-panel').removeClass('opened')
		
		let data = $(this).data('filter')
		
		if( $(this).hasClass('all') ) {
			
			$('.filter').removeClass('selected')
			$(this).addClass('selected')
			
			$('#clear').hide()
			$('#search').val('')
			
			maintable.bookmarkTable.search('').columns().search('').columns.adjust().responsive.recalc().draw()
			
		} else {
			
			if(col == 9) {
				
				$('.filter.folder, .filter.all').removeClass('selected')
				$(this).addClass('selected')
				
				maintable.bookmarkTable.columns(col).search('(^|,)'+data+'(,|$)',true,false).columns.adjust().responsive.recalc().draw()
				
			} else {
				
				$('.filter.tagfilter, .filter.all, .filter.untagged').removeClass('selected')
				$(this).addClass('selected')
				
				maintable.bookmarkTable.columns(col).search(data).columns.adjust().responsive.recalc().draw()
				
			}
		}
	})
	
	
	$('#taglist').on('mousedown', '.filter', function(e) {
		
		if(e.which == 3) {
			
			let id 		= $(this).data('id'),
				data 	= $(this).data('filter')
			
			ipcRenderer.send('show-tags-menu', [id, data] )
		}
	})
	
	
	$('#folderlist').on('mousedown', '.filter', function(e) {
		
		if(e.which == 3) {
			
			let id 		= $(this).data('id'),
				data 	= $(this).data('name')
			
			ipcRenderer.send('show-folders-menu', [id, data] )
		}
	})
	
	
	//note(dgmid): toggle col visibility
	
	$('.col-toggle').on( 'click', function () {
		
		let column 	= maintable.bookmarkTable.column( $(this).attr('data-column') ),
			id 		= $(this).prop( 'id' )
		
		$('#toggle-info-panel').removeClass( 'opened' )
		
		if( $(this).prop('checked') === true ) {
			
			column.visible( true ).columns.adjust().responsive.recalc().draw()
			store.set( `tableColumns.${id}`, true )
		
		} else {
			
			column.visible( false ).columns.adjust().responsive.recalc().draw()
			store.set( `tableColumns.${id}`, false )
		}
		
		setPanelWidth()
	})
	
	
	//note(dgmid): add bookmark
	
	$( '#add-bookmark' ).click( function() {
		
		modalWindow.openModal( 'file://' + __dirname + `/../html/add-bookmark.html?folder=${getCurrentFolder()}&tag=${getCurrentTag()}`, 480, 390, false )
	})
	
	
	//note(dgmid): new folder
	
	$( '#new-folder' ).click( function() {
		
		modalWindow.openModal( 'file://' + __dirname + `/../html/add-folder.html?folder=${getCurrentFolder()}`, 480, 212, false )	
	})
	
	
	//note(dgmid): show bookmark context menu
	
	$('body #bookmarks tbody').on('mouseup', 'tr', function(event) {
		
		if( event.which === 3 ) {
			
			let data = maintable.bookmarkTable.row( this ).data()
			
			if( data ) {
			
				ipcRenderer.send('show-bookmark-menu', data )
			}
		}
	})
	
	
	//note(dgmid): show columns context menu
	
	$('body thead').on('mouseup', 'th:not(.details-control)', function(event) {
		
		if( event.which === 3 ) {
			
			ipcRenderer.send('show-columns-menu', '' )
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
				
				let data = maintable.bookmarkTable.row(cell.index().row).data()
				shell.openExternal(data[4])
			}
		}
	})
	
	
	//note(dgmid): info panel width on window resize
	
	$('#bookmarks').on('responsive-resize.dt', function() {
		
		setPanelWidth()
	})
	
	
	$('#bookmarks tbody').on('click', 'td.details-control', function() {
		
		let tr = $(this).closest('tr')
		
		toggleInfoPanel( tr )
	})
	
	
	//note(dgmid): open url on double-click
	
	$('#bookmarks tbody').on('dblclick', 'tr td:not(.details-control):not([colspan])', function() {
		
		let tr = $(this).closest('tr')
		
		let data = maintable.bookmarkTable.row(tr).data()
		shell.openExternal(data[4])
	})
	
	
	//note(dgmid): search field
	
	$('#search').keyup(function(){

		maintable.bookmarkTable.search($(this).val()).columns.adjust().responsive.recalc().draw()
	})
	
	
	//note(dgmid): toggle info panels
	
	$('#toggle-info-panel').click( function() {
		
		let toggle = $(this)
		toggle.toggleClass( 'opened' )
		
		maintable.bookmarkTable.rows( { filter : 'applied'} ).every(function() {
			
			if( toggle.hasClass( 'opened' ) ) {
				
				if(!this.child.isShown()){
					
					this.child( maintable.detailsTable(this.data()) ).show()
					$(this.node()).addClass('shown')
				}
				
			} else {
			
				if(this.child.isShown()){
					
					this.child.hide()
					$(this.node()).removeClass('shown')
				}
			}
		})
	})
	
	//note(dgmid): if missing credentials, open login window, else load bookmarks
	
	if( !server || !username || !password ) {
		
		modalWindow.openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
	
	} else {
		
		loader( 'add' )
		
		fetch.bookmarksApi( 'folders', '', '', function() {
			
			fetch.bookmarksApi( 'all', '', '', function( array ) {
				
				parseBookmarks( array )
			})
		})
	}
})
