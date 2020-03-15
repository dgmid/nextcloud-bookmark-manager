'use strict'

const Store		= require( 'electron-store' )
const store		= new Store()
const $			= require( 'jquery' )
const dt		= require( 'datatables.net' )( window, $ )
const keytable	= require( 'datatables.net-keytable' )( window, $ )



$.fn.dataTable.render.ellipsis = function ( cutoff, wordbreak, escapeHtml ) {
	var esc = function ( t ) {
		return t
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
	};

	return function ( d, type, row ) {
		// Order, search and type get the original data
		if ( type !== 'display' ) {
			return d
		}

		if ( typeof d !== 'number' && typeof d !== 'string' ) {
			return d
		}

		d = d.toString(); // cast numbers

		if ( d.length <= cutoff ) {
			return d
		}

		var shortened = d.substr(0, cutoff-1)

		// Find the last white space character in the string
		if ( wordbreak ) {
			shortened = shortened.replace(/\s([^\s]*)$/, '')
		}

		// Protect against uncontrolled HTML input
		if ( escapeHtml ) {
			shortened = esc( shortened )
		}

		return '<span class="ellipsis" title="'+esc(d)+'">'+shortened+'&#8230;</span>'
	}
}



module.exports.bookmarkTable = $('#bookmarks').DataTable({
	
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
	columnDefs:
		[
			{
				targets: [ 0 ],
				visible: false,
				searchable: false
			},
			{
				className: 'padded-left',
				targets: [ 1 ]
			},
			{
				targets: [ 2 ],
				visible: store.get('tableColumns.description')
			},
			{
				targets: [ 3 ],
				visible: store.get('tableColumns.url'),
				render: $.fn.dataTable.render.ellipsis( 50 )
			},
			{
				targets: [ 4 ],
				visible: store.get('tableColumns.created'),
				searchable: false
			},
			{ 	className: 'dt-body-right',
				targets: [ 4, 5 ]
			},
			{
				targets: [ 5 ],
				visible: store.get('tableColumns.modified'),
				searchable: false
			},
			{
				className: 'dt-body-right padded-right',
				targets: [ 6 ]	
			}
		],
	
	language: {
		emptyTable: ' ',
		zeroRecords: 'No matching Bookmarks were found',
		info: 'Showing _TOTAL_ Bookmarks',
		infoEmpty: 'Showing 0 to 0 of 0 Bookmarks',
		infoFiltered: '(filtered from _MAX_ Bookmarks)'
	}
})
