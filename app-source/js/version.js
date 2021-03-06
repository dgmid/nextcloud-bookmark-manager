'use strict'

const i18n 				= require( './i18n.min' )

const version 			= require('electron').remote.app.getVersion()
const compareVersions	= require('compare-versions')
const $					= require( 'jquery' )
const log				= require( 'electron-log' )


module.exports = {
	
	appVersion: function() {
	
		$.getJSON( 'https://api.github.com/repos/dgmid/nextcloud-bookmark-manager/releases/latest', function( release ) {
			
			let latest = release.name
			
			log.info( `this version: ${version}` )
			log.info( `latest version: ${latest}` )
			
			if( compareVersions.compare( version, latest, '<' ) ) {
				
				module.exports.displayVersion( `<button id="update" class="fadein" type="button" tabindex="-1" data-url="https://github.com/dgmid/nextcloud-bookmark-manager/releases/latest"><span id="update-version">${latest}</span> <span id="update-label">${i18n.t('version:update', 'Update Available')}</span> &rarr;</button>` )
			}
			
			if( compareVersions.compare( version, latest, '>' ) ) {
					
				if( version.includes('-a') ) {
					
					module.exports.displayVersion( `<span id="dev" class="α fadein">DEV: v${version}</span>` )
					
				} else if ( version.includes('-b') ) {
					
					module.exports.displayVersion( `<span id="dev" class="β fadein">DEV: v${version}</span>` )
					
				} else {
					
					module.exports.displayVersion( `<span id="dev" class="fadein">DEV: v${version}</span>` )
				}
			}
		})
		.done( function() {
			
			log.info( `check release succeeded` )
		})
		.fail( function( jqXHR, textStatus, errorThrown ) {
			
			log.error( `check release failed ${textStatus}` )
		})
		.always( function() {
			
			log.info( `check release ended` )
		})
	},
	
	displayVersion: function( details ) {
		
		$('footer').append( details )
		$('.fadein').fadeIn( 'slow' )
	}
}
