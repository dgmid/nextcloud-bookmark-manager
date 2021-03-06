'use strict'

const {
	app,
	BrowserWindow,
	Notification

} = require( 'electron' )

const path 			= require( 'path' )
const fs 			= require( 'fs-extra' )
const nativeImage 	= require( 'electron' ).nativeImage
const axios 		= require( 'axios' ).default
const Store			= require( 'electron-store' )
const store 		= new Store()
const log  			= require( 'electron-log' )

const dir 			= store.get( 'dirPath' )



module.exports.regenerate = function ( winId ) {
	
	const i18n = require( './i18n.min' )
	
	log.info( `regenerating favicons` )
	
	notify( app.name, i18n.t('favicons:regenerating', 'Regenerating all favicons') )
	store.set( 'defaultIcons', [] )
	
	fs.remove( `${dir}/favicons/`, err => {
		
		if ( err ) return console.error( err )
		
		log.info( `deleted cached favicons` )
		module.exports.generate( winId, false, true )
	})
}



function notify( title, body ) {
	
	const note ={
		title: title,
		body: body
	}
	
	new Notification( note ).show()
}



module.exports.generate = function (  winId, singleBookmark, notify ) {
	
	let win 			= BrowserWindow.fromId( winId ),
		bookmarks 		= new Store( {name: 'bookmarks'} ),
		bookmarkData 	= bookmarks.get( 'data' ),
		defaultArray	= store.get( 'defaultIcons' ),
		faviconCount 	= 0,
		faviconArray	= []
	
	if( singleBookmark ) {
		
		faviconArray.push( singleBookmark )
		
	} else {
	
		for( let  bookmark of bookmarkData ) {
			
			if( !defaultArray.includes( bookmark.id ) &&
				!fs.pathExistsSync( `${dir}/favicons/${bookmark.id}.png`
			) ) {
				
				faviconArray.push( bookmark )
			}
		}
	}
	
	let arrayLength = faviconArray.length
	
	if( arrayLength < 1 ) {
		
		log.info( `No favicons to generate` )
		log.info( `Default favicons are: ${defaultArray}` )
		win.webContents.send( 'load-tray-menu' )
	}
	
	for( let i = 0; i < arrayLength; i++ ) {
		
		let bookmarkUrl = new URL( faviconArray[i].url ),
			domain 		= bookmarkUrl.hostname,
			iconurl 	= `https://api.faviconkit.com/${domain}/32`,
			file 		= `${dir}/favicons/${faviconArray[i].id}.png`,
			file2x		= `${dir}/favicons/${faviconArray[i].id}@2x.png`
		
		axios.get(iconurl,  { responseType: 'arraybuffer' })
		.then( function( response ) {
			
			const buffer = Buffer.from(response.data, "utf-8")
			
			if(
				response.headers['content-type'].includes('png') ||
				response.headers['content-type'].includes('jpeg') ||
				response.headers['content-type'].includes('x-icon')
			) {
				
				let imgpng = nativeImage.createFromBuffer(buffer, {
						
						scaleFactor: 1.0
					}).resize({
						width: 16,
						height: 16,
						quality: 'best'
					}).toPNG()
				
				let imgpng2x = nativeImage.createFromBuffer(buffer, {
						
						scaleFactor: 1.0
					}).resize({
						width: 32,
						height: 32,
						quality: 'best'
					}).toPNG()
				
				fs.outputFileSync(file, imgpng, err => {
					
					if(err) log.info(err)
				})
				
				fs.outputFileSync(file2x, imgpng2x, err => {
					
					if(err) log.info(err)
				})
				
				log.info( `favicon: ${faviconArray[i].id} - generated` )
				
				faviconCount++
				if( faviconCount === arrayLength ) {
					
					generatedFavicons( win, faviconCount, defaultArray, notify )
				}
				
			} else {
				
				faviconFallback( bookmarkData[i].id, bookmarkUrl, file, file2x, function( theDefault ) {
					
					log.info( `favicon: ${faviconArray[i].id} -  generated` )
					
					if( !defaultArray.includes( theDefault ) ) {
						
						defaultArray.push( theDefault )
					}
					
					faviconCount++
					if( faviconCount === arrayLength ) {
						
						generatedFavicons( win, faviconCount, defaultArray, notify )
					}
				})
			}
		})
		.catch( function( err ) {
			
			log.info( `favicon error: ${faviconArray[i].id}: ${err.message}` )
			
			faviconFallback( bookmarkData[i].id, bookmarkUrl, file, file2x, function( theDefault ) {
				
				log.info( `favicon: ${faviconArray[i].id} -  generated` )
				
					if( !defaultArray.includes( theDefault ) ) {
						
						defaultArray.push( theDefault )
					}
				
				faviconCount++
				if( faviconCount === arrayLength ) {
					
					generatedFavicons( win, faviconCount, defaultArray, notify )
				}
			})
		})
	}
}



module.exports.get = function ( id ) {
	
	if( fs.pathExistsSync( `${dir}/favicons/${id}.png` ) ) {
		
		return `${dir}/favicons/${id}.png`
		
	} else {
		
		return path.join(__dirname, '../assets/png/faviconTemplate.png') 
	}
}



module.exports.exists = function ( id ) {
	
	return ( fs.pathExistsSync( `${dir}/favicons/${id}.png` ) ) ? true : false
}



function faviconFallback( id, url, file, file2x, callback ) {
	
	let iconurl = 'https://www.google.com/s2/favicons?sz=32&domain_url=' + url,
	theDefault = null

	axios.get(iconurl,  { responseType: 'arraybuffer' })
	.then( function( response ) {
		
		const buffer = Buffer.from(response.data, "utf-8")
		
		let imgpng = nativeImage.createFromBuffer(buffer, {
				
				scaleFactor: 1.0
			}).resize({
				width: 16,
				height: 16,
				quality: 'best'
			}).toPNG()
		
		let imgpng2x = nativeImage.createFromBuffer(buffer, {
				
				scaleFactor: 1.0
			}).resize({
				width: 32,
				height: 32,
				quality: 'best'
			}).toPNG()
		
		let b64enc = Buffer.from(imgpng, 'binary').toString('base64')
		
		if( isNotDefaultIcon( b64enc ) ) {
			
			fs.outputFileSync(file, imgpng, err => {
				
				if (err) log.info(err)
			})
			
			fs.outputFileSync(file2x, imgpng2x, err => {
				
				if (err) log.info(err)
			})
		
		} else {
			
			theDefault = id
		}
		
		callback( theDefault )
	})
	.catch( function( err ) {
		
		log.info( `fallback favicon error: ${id}: ${err.message}` )
	})
}



function generatedFavicons( win, count, defaults, notification ) {
	
	const i18n = require( './i18n.min' )
	
	log.info( `Generated ${count} favicons` )
	store.set( 'defaultIcons', defaults )
	if( notification ) notify( app.name, i18n.t('favicons:regenerated', 'Favicons regenerated') )
	
	log.info('load tray menu')
	win.webContents.send( 'load-tray-menu' )
}



function isNotDefaultIcon( b64 ) {
	
	return ( b64 === 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACs0lEQVQ4jaWTzU8bBxDFf7V31/baXn+sP2oDduxaCZFKqiKDEDSHKKLKiRs55JCPQ070zyGHinsrxbk0kXpBqsTBKQUbqa1AUCgFk0C8trv2YrNm1y69gJWoveWdZqR5b97MaOAj8clVMD//3FO1apGZfHbCtnoLetPMt4yuD0Dxu9uhoKckuYRnxdL+elyK1guF++ZAYH7+uadt68nc9fjTdud8LpdRY6lsWLXsPpLoJJNSWV7ebhxUdE3xSy/3/qgt+cTQcaFw3xQAqlYt8sWNoadnZu/B57cSI5m0ileWGB8bpnNmkU4qZFMR9fftY/W778u+XC7Kr7snz4AjB8BMPjthtLtzTx5NjGTSKgCW3Wd143Awa0yVEUUnjx9OjrQ653Mz+ewEgAPAOu8tXBsJxaa+TA0Itt3HtvuEAjIAHbNHs2USCnhIDYVi3a69MBDQm2Z+dnZU7Zi9DzZ896vrKF4BAK9H4MZnMfYrf3Pv3k1V1808gADQMkxfPKKgeAW8ssRwIshwIjggAzgdUK2fAhCPKBiG6Rs4APDKEgBT49d4c9LEsj90cwVRdAJwcZkLV3fer9SVRDSF4hX4+naOYrnCzmVRNhUhEZW5M5Wh3uyy86eG4ne3Bw7CIbm0vLzdeL/T2GgSrd5Gq7dZ3Thg7bdjACJBN69ebTbCQbk0EBBFYfGgomvFcuV/bQO8PWnS/weK5QrH1ZbmcouLAE4AR2C6k04GAz//cpiOfqoEUskALsmBKIpol4sbG02ys6/x7dLro6Df9aK0efTD4c6PhhNg8tZj+12tsZtIKNLr1QO1tHHkcPtccrN1xolmYJx2WVnZa/y0snsY9Lte7O3VlsKSWt3aKvT+80zT49n8uWV/o+tm3jjt+i4uLlD87rYaltdlt7C4VvqrHHjvmT4a/wJLYRPRy3Z+JAAAAABJRU5ErkJggg==' ) ? false : true
}
