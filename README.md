![iTowns](https://raw.githubusercontent.com/iTowns/itowns.github.io/master/images/itowns_logo_300x134.png)
# iTowns

[![Coverage Status](https://coveralls.io/repos/github/iTowns/itowns/badge.svg?branch=master)](https://coveralls.io/github/iTowns/itowns?branch=master)
[![Build Status](https://travis-ci.com/iTowns/itowns.svg?branch=master)](https://travis-ci.com/iTowns/itowns)

## 这是什么？

iTowns is a [Three.js](https://threejs.org/)-based framework written in
Javascript/WebGL for visualizing 3D geospatial data.

It can connect to WMS/WMTS/TMS servers including elevation data and load many
different data formats (3dTiles, GeoJSON, Vector Tiles, GPX and much more). A
complete list of features and supported data formats is [available on the
wiki](https://github.com/iTowns/itowns/wiki/Supported-Features).

![iTowns screenshot](https://raw.githubusercontent.com/iTowns/itowns.github.io/master/images/itownsReleaseXS.jpg)

## 文档和示例

The official documentation is [available
here](http://www.itowns-project.org/itowns/docs/). It contains tutorials to help
you start using iTowns, and an API reference. You can find more informations on
its contribution [here](docs/README.md).

Official examples can be [viewed
here](http://www.itowns-project.org/itowns/examples/). Some examples available:

* [Globe with WFS data](http://www.itowns-project.org/itowns/examples/globe_wfs_extruded.html)
* [Plane mode with Vector Tiles](http://www.itowns-project.org/itowns/examples/planar_vector_tiles.html)
* [3D effect using scene postprocessing](http://www.itowns-project.org/itowns/examples/stereo.html)
* [Globe with split rendering](http://www.itowns-project.org/itowns/examples/split.html)

[![iTowns examples](http://www.itowns-project.org/images/montage.jpg)](http://www.itowns-project.org/itowns/examples/index.html)

## 怎样使用

可以通过npm安装，也可以文件的形式单独引入

```bash
npm install --save itowns
```

或者单独引入

```html
<script src="node_modules/itowns/dist/itowns.js"></script>
```


## 还需要搞明白的问题

怎样获取鼠标点击位置的xyz？

在view.controls上添加itowns.CONTROL_EVENTS.RANGE_CHANGED事件，
在事件回调函数内使用view.controls.getZoom()方法获取