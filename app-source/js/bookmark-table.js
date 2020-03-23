'use strict'

const i18n		= require( './i18n.min' )

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
	columns:
	[
		{title: 'ID'},
		{title: i18n.t('bookmarktable:header.title', 'Title')},
		{title: i18n.t('bookmarktable:header.description', 'Description')},
		{title: i18n.t('bookmarktable:header.url', 'Url')},
		{title: 'unix added'},
		{title: i18n.t('bookmarktable:header.created', 'Created')},
		{title: 'unix modified'},
		{title: i18n.t('bookmarktable:header.modified', 'Modified')},
		{title: i18n.t('bookmarktable:header.tags', 'Tags')}
	],
	columnDefs:
		[
			{
				targets: [ 0 ],
				visible: false,
				searchable: false
			},
			{
				className: 'padded-left',
				targets: [ 1 ],
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
				visible: false
			},
			{
				targets: [ 5 ],
				visible: store.get('tableColumns.created'),
				searchable: false,
				width: '100px',
				iDataSort: 4
			},
			{
				targets: [ 6 ],
				visible: false
			},
			{
				targets: [ 7 ],
				visible: store.get('tableColumns.modified'),
				searchable: false,
				width: '100px',
				iDataSort: 6
			},
			{ 	className: 'date-column',
				targets: [ 5, 7 ]
			},
			{
				className: 'tags-column dt-body-right padded-right',
				targets: [ 8 ],
				width: '60px'
			}
		],
	
	language: {
		emptyTable: ' ',
		zeroRecords: i18n.t('bookmarktable:footer.zero', 'No matching Bookmarks were found'),
		info: i18n.t('bookmarktable:footer.info', 'Showing _TOTAL_ Bookmarks'),
		infoEmpty: i18n.t('bookmarktable:footer.empty', 'Showing 0 to 0 of 0 Bookmarks'),
		infoFiltered: i18n.t('bookmarktable:footer.filtered', '(filtered from _MAX_ Bookmarks)')
	}
})
