# Nextcloud Bookmark Manager

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT) [![GitHub release (latest by date)](https://img.shields.io/github/v/release/dgmid/nextcloud-bookmark-manager?label=latest%20release&logo=github)](https://github.com/dgmid/nextcloud-bookmark-manager/releases/latest) ![GitHub All Releases](https://img.shields.io/github/downloads/dgmid/nextcloud-bookmark-manager/total)

A Mac App for accessing and managing Nextcloud bookmarks.

![nextcloud-bookmark-manager](https://user-images.githubusercontent.com/1267580/76684687-49aef700-660e-11ea-9d79-95791af8275d.png)

## Requirements

[node.js / npm](https://www.npmjs.com/get-npm)
A server running [Nextcloud](https://nextcloud.com/) with the [Bookmarks](https://github.com/nextcloud/bookmarks) app installed

To build this project you will need to install **electron packager** and **asar**

```shell
npm install -g electron-packager
npm install -g asar
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
npm start
```

To package the final app run:
```shell
npm run package
```
The packaged app will be written to `build/Nextcloud Bookmark Manager-darwin-x64/` in the project directory.
