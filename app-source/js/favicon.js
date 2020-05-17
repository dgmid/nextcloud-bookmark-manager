'use strict'

const {app} 		= require( 'electron' )
const path 			= require('path')
const fs 			= require( 'fs-extra' )
const nativeImage 	= require( 'electron' ).nativeImage
const request 		= require( 'request' ).defaults({ encoding: null })
const log  			= require( 'electron-log' )

const dir 			= app.getPath( 'appData' ) + '/' + app.name



module.exports.generate = function ( id, url ) {
	
	if( !fs.pathExistsSync( `${dir}/favicons/${id}.png` ) ) {
		
		let bookmarkUrl = new URL( url ),
			domain 		= bookmarkUrl.hostname,
			iconurl 	= `https://api.faviconkit.com/${domain}/32`,
			file 		= `${dir}/favicons/${id}.png`,
			file2x		= `${dir}/favicons/${id}@2x.png`
		
		request( iconurl, (err, resp, buffer) => {
		
			if(
				resp.headers['content-type'].includes('png') ||
				resp.headers['content-type'].includes('jpeg') ||
				resp.headers['content-type'].includes('x-icon')
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
				
				fs.outputFile(file, imgpng, err => {
					
					if(err) log.info(err)
				})
				
				fs.outputFile(file2x, imgpng2x, err => {
					
					if(err) log.info(err)
				})
			
			} else {
				
				let iconurl = 'https://www.google.com/s2/favicons?sz=32&domain_url=' + bookmarkUrl
				
				request( iconurl, (err, resp, buffer) => {
					
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
		
		
					let b64enc = btoa(String.fromCharCode.apply(null, imgpng))
					
					if( isNotDefaultIcon( b64enc ) ) {
						
						fs.outputFile(file, imgpng, err => {
							
							if (err) log.info(err)
						})
						
						fs.outputFile(file2x, imgpng2x, err => {
							
							if (err) log.info(err)
						})
					
					}
				})
			}
		})
	}
}



module.exports.exists = function ( id ) {
	
	if( fs.pathExistsSync( `${dir}/favicons/${id}.png` ) ) {
		
		return `${dir}/favicons/${id}.png`
		
	} else {
		
		return path.join(__dirname, '../assets/png/iconTemplate.png') 
	}
}



function isNotDefaultIcon( b64 ) {
	
	return ( b64 === 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACs0lEQVQ4jaWTzU8bBxDFf7V31/baXn+sP2oDduxaCZFKqiKDEDSHKKLKiRs55JCPQ070zyGHinsrxbk0kXpBqsTBKQUbqa1AUCgFk0C8trv2YrNm1y69gJWoveWdZqR5b97MaOAj8clVMD//3FO1apGZfHbCtnoLetPMt4yuD0Dxu9uhoKckuYRnxdL+elyK1guF++ZAYH7+uadt68nc9fjTdud8LpdRY6lsWLXsPpLoJJNSWV7ebhxUdE3xSy/3/qgt+cTQcaFw3xQAqlYt8sWNoadnZu/B57cSI5m0ileWGB8bpnNmkU4qZFMR9fftY/W778u+XC7Kr7snz4AjB8BMPjthtLtzTx5NjGTSKgCW3Wd143Awa0yVEUUnjx9OjrQ653Mz+ewEgAPAOu8tXBsJxaa+TA0Itt3HtvuEAjIAHbNHs2USCnhIDYVi3a69MBDQm2Z+dnZU7Zi9DzZ896vrKF4BAK9H4MZnMfYrf3Pv3k1V1808gADQMkxfPKKgeAW8ssRwIshwIjggAzgdUK2fAhCPKBiG6Rs4APDKEgBT49d4c9LEsj90cwVRdAJwcZkLV3fer9SVRDSF4hX4+naOYrnCzmVRNhUhEZW5M5Wh3uyy86eG4ne3Bw7CIbm0vLzdeL/T2GgSrd5Gq7dZ3Thg7bdjACJBN69ebTbCQbk0EBBFYfGgomvFcuV/bQO8PWnS/weK5QrH1ZbmcouLAE4AR2C6k04GAz//cpiOfqoEUskALsmBKIpol4sbG02ys6/x7dLro6Df9aK0efTD4c6PhhNg8tZj+12tsZtIKNLr1QO1tHHkcPtccrN1xolmYJx2WVnZa/y0snsY9Lte7O3VlsKSWt3aKvT+80zT49n8uWV/o+tm3jjt+i4uLlD87rYaltdlt7C4VvqrHHjvmT4a/wJLYRPRy3Z+JAAAAABJRU5ErkJggg==' ) ? false : true
}
