'use strict'


const {shell} = require( 'electron' ).remote
const {ipcRenderer} = require( 'electron' )

const Store = require( 'electron-store' )
const store = new Store()

const { remote } = require( 'electron' )
const dialog = remote.dialog

const $ = require( 'jquery' )
const dt = require( 'datatables.net' )( window, $ )
const keytable = require( 'datatables.net-keytable' )( window, $ )

let generate = require( 'string-to-color' )
let modal

const bookmarkTable = $('#bookmarks').DataTable({
	
	keys: {
		tabIndex: 1,
		blurable: true,
		keys: [ 	32, // space
					38, // up
					40  // down
		]
	},
	
	scrollY: 	'calc(100vh - 122px)',
	paging: 	false,
	"columnDefs":
		
		[
			{ 	className: "dt-body-right",
				"targets": [ 4, 5 ]
			},
			{
				className: "padded-left",
				"targets": [ 1 ]	
			},
			{
				className: "dt-body-right padded-right",
				"targets": [ 6 ]	
			},
			{
				"targets": [ 0 ],
				"visible": false,
				"searchable": false
			},
			{
				"targets": [ 2 ],
				"visible": store.get('tableColumns.description')
			},
			{
				"targets": [ 3 ],
				"visible": store.get('tableColumns.url')
			},
			{
				"targets": [ 4 ],
				"visible": store.get('tableColumns.created'),
				"searchable": false
			},
			{
				"targets": [ 5 ],
				"visible": store.get('tableColumns.modified'),
				"searchable": false
			}
		],
	
	"language": {
		"search": "",
		"searchPlaceholder": "search"
	}
})

var total


//note(@duncanmid): get login credentials

const 	server 		= store.get( 'loginCredentials.server' ),
		username 	= store.get( 'loginCredentials.username' ),
		password 	= store.get( 'loginCredentials.password' )


//note(@duncanmid): get bookmark json

function getBookmarks() {
	
	const getUrl = "/index.php/apps/bookmarks/public/rest/v2/bookmark?page=-1"
	
	let getInit = {
		
		method: 'GET',
		headers: {
			'Authorization': 'Basic ' + btoa( username + ':' + password ),
			'Content-Type': 'application/json'
		},
		mode: 'cors',
		cache: 'default'
	}
	
	
	fetch(server + getUrl, getInit).then(function(response) {
		
		if (response.ok) {
			
			console.log('response OK')
			return response.text()
		
		} else {
			
			dialog.showErrorBox(
				'Server connection error',
				`there was an error connecting to:\n${server}`
			)
			
			console.log( response.error() )
		}
	
	}).then(function(message) {
		
		let doc = JSON.parse(message)
		

		if (doc['status'] == 'error') {
			
			dialog.showErrorBox(
				'JSON parsing error',
				`An error occured parsing the bookmarks`
			)
			
			console.log(doc['message'])	
		
		} else {
			
			total = doc.data.length
			
			parseBookmarks( doc.data )
		}
	
	}).catch(function(error) {
		
		dialog.showErrorBox(
			'Server connection error',
			`there was an error connecting to:\n${server}`
		)
		
		console.log(error)
	})
}



//note(@duncanmid): populate dataTable

function parseBookmarks( array ) {
	
	let allTags = []
	
	for ( let item of array ) {
		
		let taglist = ''
		
		if( item.tags.length < 1 ) { item.tags.push('un-tagged') }
		
		for ( let tagitem of item.tags ) {
		
			let color
			
			if( tagitem === 'un-tagged' ) {
				
				color = 'transparent'
				
			} else {
				
				color = generate(tagitem)
			}
			
			taglist += `<span class="tag" title="${tagitem}" style="background-color: ${color};">${tagitem}</span>`
			
			allTags.push( tagitem )
		}
		
		let created = 	new Date( item.added * 1000 ),
			modified = 	new Date( item.lastmodified * 1000 )
			
		
		bookmarkTable.row.add( [
			
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
}



//note(@duncanmid): get list of tags with count

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
				<a href="#" class="filter" data-filter="${tagitem.value}">${tagitem.value}
				<span class="tag-count">${tagitem.count}</span></a>
			</dd>`
		
		} else {
			
			var color = generate(tagitem.value)
			
			$('#taglist').append(
			
			`<dd>
				<a href="#" class="filter" data-filter="${tagitem.value}"><span class="tag" title="${tagitem.value}" style="background-color: ${color};">${tagitem.value}</span> ${tagitem.value}
				<span class="tag-count">${tagitem.count}</span></a>
			</dd>`
			)
			
			results.push( { "id": count , "text": tagitem.value } )
			count++
		}
	}
	
	
	store.set('tags', results )
	
	
	$('#taglist-extras').append(
		
		`${untagged}
		<dd>
			<a href="#" class="filter selected" data-filter="">all bookmarks <span class="tag-count">${total}</span></a>
		</dd>`
	)
}



//note(@duncanmid): delete bookmark

ipcRenderer.on('delete-bookmark', (event, message) => {
	
	let bookmark = false
	
	if( message == 'delete-bookmark' ) {
		
		bookmark = bookmarkTable.row('.selected').data()
	
	} else {
	
		bookmark = message
	}
	
	
	if( bookmark ) {
	
		let response = dialog.showMessageBox({	
							message: `Are you sure you want to delete the bookmark ${bookmark[1]}?`,
							detail: 'This operation is not reversable.',
							buttons: ['Delete Bookmark','Cancel']
						})
		
		if( response === 0 ) {
		
			const deleteUrl = "/index.php/apps/bookmarks/public/rest/v2/bookmark/"
			
			let deleteInit = {
				
				method: 'DELETE',
				headers: {
					'Authorization': 'Basic ' + btoa( username + ':' + password ),
					'Content-Type': 'application/json'
				},
				mode: 'cors',
				cache: 'default'
			}
			
			fetch(server + deleteUrl + bookmark[0], deleteInit).then(function(response) {
				
				if (response.ok) {
					
					return response.text()
				
				} else {
					
					dialog.showErrorBox(
						'Delete Bookmark Error',
						`An error occured whilst trying to delete the bookmark: ${bookmark[1]}`
					)
					
					return response.text()
				}
			
			}).then(function(message) {
				
				bookmarkTable.clear().draw()
				getBookmarks()
			})
		}
	
	} else {
		
		dialog.showErrorBox(
			'Delete Bookmark Error',
			'An entry must be selected in order to delete'
		)
	}
})



//note(@duncanmid): edit bookmark

ipcRenderer.on('edit-bookmark', (event, message) => {
	
	let bookmark = false
	
	if( message == 'edit-bookmark' ) {
		
		bookmark = bookmarkTable.row('.selected').data()
	
	} else {
		
		bookmark = message
	}
	
	
	if( bookmark ) {
		
		openModal( 'file://' + __dirname + '/../html/edit-bookmark.html?id=' + bookmark[0], 480, 340, true )
		
	} else {
		
		dialog.showErrorBox(
			'Edit Bookmark Error',
			'An entry must be selected in order to edit'
		)
	}
})



//note(@duncanmid): edit tag

ipcRenderer.on('edit-tag', (event, message) => {
	
	openModal( 'file://' + __dirname + '/../html/edit-tag.html?tag=' + message, 480, 180, true )
})



//note(@duncanmid): delete tag

ipcRenderer.on('delete-tag', (event, message) => {
	
	let response = dialog.showMessageBox({	
							message: `Are you sure you want to delete the tag ${message}?`,
							detail: 'This operation is not reversable.',
							buttons: ['Delete Tag','Cancel']
						})
	
	if( response === 0 ) {
		
		const deleteUrl = "/index.php/apps/bookmarks/public/rest/v2/"
		
		let deleteInit = {
			
			method: 'DELETE',
			headers: {
				'Authorization': 'Basic ' + btoa( username + ':' + password ),
				'Content-Type': 'application/json'
			},
			mode: 'cors',
			cache: 'default'
		}
		
		console.log(server + deleteUrl + 'tag?old_name=' + encodeURIComponent(message))
		
		fetch(server + deleteUrl + 'tag?old_name=' + encodeURIComponent(message), deleteInit).then(function(response) {
			
			if (response.ok) {
				
				return response.text()
			
			} else {
				
				console.log(response.text())
				
				dialog.showErrorBox(
					'Delete Tag Error',
					`An error occured whilst trying to delete the tag: ${message}`
				)
				
				return response.text()
			}
		
		}).then(function(message) {
			
			bookmarkTable.clear().draw()
			getBookmarks()
		})
	}
})



//note(@duncanmid): log in modal

ipcRenderer.on('open-preferences', (event, message) => {
	
	openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
})



//note(@duncanmid): refresh bookmarks

ipcRenderer.on('refresh-bookmarks', (event, message) => {
	
	bookmarkTable.clear().draw()
	getBookmarks()
})


//note(@duncanmid): add bookmark

ipcRenderer.on('add-bookmark', (event, message) => {
	
	openModal( 'file://' + __dirname + '/../html/add-bookmark.html', 480, 340, true )
})


//note(@duncanmid): close login modal

ipcRenderer.on('close-login-modal', (event, message) => {
	
	modal.close()
})


//note(@duncanmid): modal

function openModal( url, width, height, resize ) {
	
	modal = new remote.BrowserWindow({
		
			parent: remote.getCurrentWindow(),
			modal: true,
			width: width,
			minWidth: width,
			maxWidth: width,
			height: height,
			minHeight: height,
			resizable: resize,
			show: false,
			backgroundColor: '#ECECEC'
		})
		
	modal.loadURL( url )
	
	modal.once('ready-to-show', () => {
		
		modal.show()
	})
}



//note(@duncanmid): set column checkboxes

function setColControls() {
	
	let cols = store.get('tableColumns')
	
	for (let col in cols) {
		
		$(`#${col}`).prop('checked', cols[col])
		
	}
}



//note(@duncanmid): htmlentities

function htmlEntities( str ) {
    
    return 	String(str)
    		.replace(/</g, '&lt;')
    		.replace(/>/g, '&gt;')
}


$(document).ready(function() {
	
	getBookmarks()
	setColControls()
	
	
	//note(@duncanmid): click tag list item to filter table
	
	$('.taglist').on('click', '.filter', function() {
		
		$('.filter').removeClass('selected')
		$(this).addClass('selected')
		
		let data = $(this).data('filter')
		bookmarkTable.columns(6).search(data).draw()
	
	})
	
	
	$('#taglist').on('mousedown', '.filter', function(e) {
		
		if(e.which == 3) {
			
			let data = $(this).data('filter')
			ipcRenderer.send('show-tags-menu', data )
		}
	})
	
	
	//note(@duncanmid): toggle col visibility
	
	$('.col-toggle').on( 'click', function () {
		
		let column 	= bookmarkTable.column( $(this).attr('data-column') ),
			id 		= $(this).prop( 'id' )
		
		if( $(this).prop('checked') === true ) {
			
			column.visible( true )
			store.set( `tableColumns.${id}`, true )
		
		} else {
			
			column.visible( false )
			store.set( `tableColumns.${id}`, false )
		}
	})
	
	
	//note(@duncanmid): add bookmark
	
	$( '#add-bookmark' ).click( function() {
		
		openModal( 'file://' + __dirname + '/../html/add-bookmark.html', 480, 340, true )
	})
	
	
	//note(@duncanmid): show context menu
	
	$('body #bookmarks tbody').on('mouseup', 'tr', function(event) {
		
		if( event.which === 3 ) {
			
			let data = bookmarkTable.row( this ).data()
			
			if( data ) {
			
				ipcRenderer.send('show-bookmark-menu', data )
			}
		}
	})
	
	
	//note(@duncanmid): highlight row
	
	$('#bookmarks').on('key-focus.dt', function(e, datatable, cell) {
	
		$(bookmarkTable.row(cell.index().row).node()).addClass('selected')
	})
	
	
	//note(@duncanmid): remove hilight
	
	$('#bookmarks').on('key-blur.dt', function(e, datatable, cell) {
	
		$(bookmarkTable.row(cell.index().row).node()).removeClass('selected')
	})
	
	
	//note(@duncanmid): open url on keepress
	
	$('#bookmarks').on('key.dt', function(e, datatable, key, cell, originalEvent) {
		
		// spacebar
		if( key === 32 ) {

			if( !$('#add-bookmark, .col-toggle').is(":focus") ) {
				
				const data = bookmarkTable.row(cell.index().row).data()
				shell.openExternal(data[3])
			}
		}
	})
	
	//note(@duncanmid): if missing credentials, open login window
	
	if( !server || !username || !password ) {
		
		openModal( 'file://' + __dirname + '/../html/login.html', 480, 180, false )
	}
})
