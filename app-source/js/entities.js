
module.exports.encode = function( str ) {
	
	return 	String( str )
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\"/g, '&#34;')
		.replace(/\'/g, '&#39;')
}

module.exports.decode = function( str ) {
	
	return 	String( str )
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
}
