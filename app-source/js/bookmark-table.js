'use strict'

const i18n		= require( './i18n.min' )

const fs 		= require( 'fs-extra' )
const path 		= require('path')
const Store		= require( 'electron-store' )
const store		= new Store()
const $			= require( 'jquery' )
const dt		= require( 'datatables.net' )( window, $ )
const keytable	= require( 'datatables.net-keytable' )( window, $ )

require( 'datatables.net-responsive' )( window, $ )



$.fn.dataTable.render.ellipsis = function ( cutoff, wordbreak, escapeHtml ) {
	
	var esc = function ( t ) {
		return t
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' )
	}

	return function ( d, type, row ) {
	
		if ( type !== 'display' ) {
			
			return d
		}
	
		if ( typeof d !== 'number' && typeof d !== 'string' ) {
			
			return d
		}
	
		d = d.toString()
	
		if ( d.length <= cutoff ) {
			
			return d
		}
	
		var shortened = d.substr(0, cutoff-1)
	
		if ( wordbreak ) {
			
			shortened = shortened.replace(/\s([^\s]*)$/, '')
		}
	
		if ( escapeHtml ) {
			
			shortened = esc( shortened )
		}
	
		return '<span class="ellipsis" title="'+esc(d)+'">'+shortened+'&#8230;</span>'
	}
}



module.exports.bookmarkTable = $('#bookmarks').DataTable({
	
	responsive: true,
	responsive: {
		details: false
	},
	keys: {
		tabIndex: 1,
		blurable: true,
		keys: [ 	32, // space
					38, // up
					40  // down
		]
	},
	scrollY: 	'calc(100vh - 59px)', // window height - header - footer
	paging: 	false,
	dom: 'ltipr', // hide default search field
	rowId:
		function(column) {
			return 'row_' + column[0] // create unique row id form json ids
		},
	'order': [[ 5, 'desc' ]],
	columnDefs:
		[
			{
				title: 'ID',
				targets: [ 0 ],
				visible: false,
				searchable: false
			},
			{
				title: `<button id="toggle-info-panel" title="${i18n.t('bookmarktable:header.details', 'Details')}"></button>`,
				responsivePriority: 1,
				targets: [ 1 ],
				className: 'details-control',
				orderable: false,
				data: null,
				defaultContent: '',
				width: '35px'
			},
			{
				title: i18n.t('bookmarktable:header.title', 'Title'),
				render: $.fn.dataTable.render.ellipsis( 45, true, true ),
				responsivePriority: 1,
				targets: [ 2 ],
				width: '99%'
			},
			{
				title: i18n.t('bookmarktable:header.description', 'Description'),
				render: $.fn.dataTable.render.ellipsis( 45, true, true ),
				responsivePriority: 10000,
				targets: [ 3 ],
				visible: store.get('tableColumns.description')
			},
			{
				title: i18n.t('bookmarktable:header.url', 'Url'),
				render: $.fn.dataTable.render.ellipsis( 45, true, true ),
				responsivePriority: 10001,
				targets: [ 4 ],
				visible: store.get('tableColumns.url')
			},
			{
				title: 'unix added',
				targets: [ 5 ],
				visible: false
			},
			{
				title: i18n.t('bookmarktable:header.created', 'Created'),
				responsivePriority: 10003,
				targets: [ 6 ],
				visible: store.get('tableColumns.created'),
				searchable: false,
				iDataSort: 5
			},
			{
				title: 'unix modified',
				targets: [ 7 ],
				visible: false
			},
			{
				title: i18n.t('bookmarktable:header.modified', 'Modified'),
				responsivePriority: 10002,
				targets: [ 8 ],
				visible: store.get('tableColumns.modified'),
				searchable: false,
				iDataSort: 7
			},
			{
				targets: [ 6, 8 ],
				className: 'date-column',
				width: '135px'
			},
			{
				title: 'folder id',
				targets: [ 9 ],
				visible: false
			},
			{
				title: i18n.t('bookmarktable:header.folders', 'Folders'),
				className: 'folders-column',
				responsivePriority: 10004,
				targets: [ 10 ],
				visible: store.get('tableColumns.folders'),
			},
			{
				title: i18n.t('bookmarktable:header.tags', 'Tags'),
				className: 'tags-column padded-right',
				responsivePriority: 2,
				targets: [ 11 ],
				visible: store.get('tableColumns.tags'),
				width: '50px',
			}
		],
	
	language: {
		emptyTable: i18n.t('bookmarktable:footer.nodata', 'No data available'),
		zeroRecords: i18n.t('bookmarktable:footer.zero', '<span class="text">No matching Bookmarks were found</span>'),
		info: i18n.t('bookmarktable:footer.info', '<span class="text">Showing </span><b>_TOTAL_</b><span class="text"> Bookmarks</span>'),
		infoEmpty: i18n.t('bookmarktable:footer.empty', 'Showing <b>0</b><span class="text"> to 0 of 0 Bookmarks</span>'),
		infoFiltered: i18n.t('bookmarktable:footer.filtered', '<span class="filtered">(filtered from _MAX_ Bookmarks)</span>')
	}
})



module.exports.detailsTable = function( data ) {
	
	let desc = ( data[3] == '' ? '⋯' : data[3] )
	
	return `<div class="details-panel">
	<div class="inner">
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.url', 'Url')}:</div>
			<div class="value nowrap"><a id="url_${data[0]}" href="${data[4]}" title="${data[2]}"><img class="favicon" src="${getFavicon(data[0])}" width="16" height="16">&nbsp;${data[4]}</a></div>
		</div>
		
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.title', 'Title')}:</div>
			<div class="value wrap">${data[2]}</div>
		</div>
		
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.description', 'Description')}:</div>
			<div class="value wrap">${desc}</div>
		</div>
		
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.created', 'Created')}:</div>
			<div class="value">${data[6]}</div>
		</div>
		
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.modified', 'Modified')}:</div>
			<div class="value">${data[8]}</div>
		</div>
		
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.folders', 'Folders')}:</div>
			<div class="value">${data[10]}</div>
		</div>
		
		<div class="row">
			<div class="label">${i18n.t('bookmarktable:header.tags', 'Tags')}:</div>
			<div class="value">${data[11]}</div>
		</div>
		
		<div class="buttons">
			<button class="info-edit ui-button small" data-id="${data[0]}">${i18n.t('menu:bookmarks.edit', 'Edit Bookmark…')}</button>
			<button class="info-delete ui-button small" data-id="${data[0]}">${i18n.t('menu:bookmarks.delete', 'Delete Bookmark…')}</button>
		</div>
	</div>
</div>`
}



function getFavicon( id ) {
	
	let dir = store.get( 'dirPath' ),
		res = ( matchMedia( '(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)' ).matches ? '@2x' : '' )
	
	if( fs.pathExistsSync( `${dir}/favicons/${id}${res}.png` ) ) {
		
		return `${dir}/favicons/${id}${res}.png`
		
	} else {
		
		let theme = ( $('html').attr('data-theme') === 'dark' ) ? 'dark-'  : ''
		
		return path.join(__dirname, `../assets/png/${theme}iconTemplate${res}.png`) 
	}
}
