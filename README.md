# ![icon](https://user-images.githubusercontent.com/1267580/41953184-826301cc-79d4-11e8-8dd2-5d31a3701517.png) Nextcloud Bookmark Manager

A Mac App for accessing and managing Nextcloud bookmarks.

![nextcloud-bookmark-manager](https://user-images.githubusercontent.com/1267580/41953185-82ead2c8-79d4-11e8-85c8-f10a1c795fd3.png)

## Requirements

[node.js / npm](https://www.npmjs.com/get-npm)

To modify a/o build this project you will need to install electron and electron packager

```shell
npm install electron -g --save-exact
npm install electron-packager -g
```

## Usage

`cd` to the project directory and run:
```shell
npm install
```

To modify the `html` / `css` / `js` run:
```shell
gulp watch
```

To test the app run:
```shell
electron .
```

To update all files prior to packaging run:
```shell
gulp build
```

To package the final app run:
```shell
npm run package
```
The packaged app will be written to `build/Nextcloud Bookmark Manager-darwin-x64/` in the project directory.

**Note**: packaging the app runs `npm prune -production` and so you will need to run `npm install` again before making any further modifications.

## License

**MDG Font Manager** is released under the MIT Licence
