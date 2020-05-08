# Nextcloud Bookmark Manager

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT) ![GitHub package.json version](https://img.shields.io/github/package-json/v/dgmid/nextcloud-bookmark-manager) [![GitHub release (latest by date)](https://img.shields.io/github/v/release/dgmid/nextcloud-bookmark-manager?label=latest%20release&logo=github)](https://github.com/dgmid/nextcloud-bookmark-manager/releases/latest) ![GitHub All Releases](https://img.shields.io/github/downloads/dgmid/nextcloud-bookmark-manager/total)

A Mac App for accessing and managing Nextcloud bookmarks.

![ncbm-2 0 3-light](https://user-images.githubusercontent.com/1267580/81381652-55e69a80-910d-11ea-9c6a-8247512325a0.png)
<small>*dark mode*</small>

![ncbm-2 0 3-dark](https://user-images.githubusercontent.com/1267580/81381733-77e01d00-910d-11ea-8385-3783ba81b0bf.png)
<small>*light mode*</small>

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

## i18n
Translations for this app are by:

| language | translator |
| --- | --- |
| EN | [dgmid](https://github.com/dgmid) |
| IT | [dgmid](https://github.com/dgmid) |
