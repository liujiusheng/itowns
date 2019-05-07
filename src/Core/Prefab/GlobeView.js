import * as THREE from 'three';

import View, { VIEW_EVENTS } from 'Core/View';
import { MAIN_LOOP_EVENTS } from 'Core/MainLoop';
import { COLOR_LAYERS_ORDER_CHANGED } from 'Renderer/ColorLayersOrdering';
import GlobeControls from 'Controls/GlobeControls';

import GlobeLayer from 'Core/Prefab/Globe/GlobeLayer';
import Atmosphere from 'Core/Prefab/Globe/Atmosphere';

import Coordinates from 'Core/Geographic/Coordinates';
import { ellipsoidSizes } from 'Core/Math/Ellipsoid';

/**
 * 地图初始化成功事件
 * @event GlobeView#initialized
 * @property target {view} dispatched on view
 * @property type {string} initialized
 */
/**
 * 图层添加事件
 * @event GlobeView#layer-added
 * @property layerId {string} the id of the layer
 * @property target {view} dispatched on view
 * @property type {string} layers-added
 */
/**
 * 图层移除事件
 * @event GlobeView#layer-removed
 * @property layerId {string} the id of the layer
 * @property target {view} dispatched on view
 * @property type {string} layers-added
 */
/**
 * 图层顺序改变
 * @event GlobeView#layers-order-changed
 * @property new {object}
 * @property new.sequence {array}
 * @property new.sequence.0 {number} the new layer at position 0
 * @property new.sequence.1 {number} the new layer at position 1
 * @property new.sequence.2 {number} the new layer at position 2
 * @property previous {object}
 * @property previous.sequence {array}
 * @property previous.sequence.0 {number} the previous layer at position 0
 * @property previous.sequence.1 {number} the previous layer at position 1
 * @property previous.sequence.2 {number} the previous layer at position 2
 * @property target {view} dispatched on view
 * @property type {string} layers-order-changed
 */


/**
 * 球面视图的事件
 * @property GLOBE_INITIALIZED {string} emit one time when globe is initialized
 * @property LAYER_ADDED {string} emit when layer id added in viewer
 * @property LAYER_REMOVED {string} emit when layer id removed in viewer
 * @property COLOR_LAYERS_ORDER_CHANGED {string} emit when  color layers order change
 */

export const GLOBE_VIEW_EVENTS = {
    GLOBE_INITIALIZED: 'initialized',
    LAYER_ADDED: 'layer-added',
    LAYER_REMOVED: 'layer-removed',
    COLOR_LAYERS_ORDER_CHANGED,
};

export function createGlobeLayer(id, options = {}) {
    console.warn('createGlobeLayer is deprecated, use the GlobeLayer class instead.');
    return new GlobeLayer(id, options.object3d, options);
}

/**
 * 创建球面视图
 *
 * @constructor
 *
 * @example
 * var viewerDiv = document.getElementById('viewerDiv');
 * var position = new itowns.Coordinates('WGS84', 2.35, 48.8, 25e6);
 * var view = new itowns.GlobeView(viewerDiv, position);
 *
 * @example
 * var viewerDiv = document.getElementById('viewerDiv');
 * var position = { longitude: 2.35, latitude: 48.8, altitude: 25e6 };
 * var view = new itowns.GlobeView(viewerDiv, position);
 *
 * @param {HTMLDivElement} viewerDiv - 用于渲染地球的html节点
 * in the DOM.
 * @param {object|Coordinates} coordCarto - 一个包含经度（longitude）、纬度（latitude）、高度（altitude）的对象，用于定位相机的位置
 * @param {object=} options - See options of {@link View}.
 */
function GlobeView(viewerDiv, coordCarto, options = {}) {
    THREE.Object3D.DefaultUp.set(0, 0, 1);
    // Setup View
    View.call(this, 'EPSG:4978', viewerDiv, options);

    // Configure camera
    let positionCamera;
    if (coordCarto instanceof Coordinates) {
        positionCamera = coordCarto.as('EPSG:4326');
    } else {
        positionCamera = new Coordinates('EPSG:4326',
            coordCarto.longitude,
            coordCarto.latitude,
            coordCarto.altitude);
    }

    this.camera.camera3D.near = Math.max(15.0, 0.000002352 * ellipsoidSizes.x);
    this.camera.camera3D.far = ellipsoidSizes.x * 10;

    const tileLayer = new GlobeLayer('globe', options.object3d, options);

    const sun = new THREE.DirectionalLight();
    sun.position.set(-0.5, 0, 1);
    sun.updateMatrixWorld(true);
    tileLayer.object3d.add(sun);

    this.addLayer(tileLayer);
    // Configure controls
    const positionTargetCamera = positionCamera.clone();
    positionTargetCamera.setAltitude(0);

    if (options.noControls) {
        this.camera.setPosition(positionCamera);
        this.camera.camera3D.lookAt(positionTargetCamera.as('EPSG:4978').xyz());
    } else {
        this.controls = new GlobeControls(this, positionTargetCamera, positionCamera.altitude(), ellipsoidSizes.x);
        this.controls.handleCollision = typeof (options.handleCollision) !== 'undefined' ? options.handleCollision : true;
    }

    this._fullSizeDepthBuffer = null;

    this.addFrameRequester(MAIN_LOOP_EVENTS.BEFORE_RENDER, () => {
        if (this._fullSizeDepthBuffer != null) {
            // clean depth buffer
            this._fullSizeDepthBuffer = null;
        }
    });

    this.tileLayer = tileLayer;

    this.addLayer(new Atmosphere());

    const fn = () => {
        this.removeEventListener(VIEW_EVENTS.LAYERS_INITIALIZED, fn);
        this.dispatchEvent({ type: GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED });
    };

    // GlobeView needs this.camera.resize to set perpsective matrix camera
    this.camera.resize(viewerDiv.clientWidth, viewerDiv.clientHeight);

    this.addEventListener(VIEW_EVENTS.LAYERS_INITIALIZED, fn);
}

GlobeView.prototype = Object.create(View.prototype);
GlobeView.prototype.constructor = GlobeView;

/**
 * 添加图层
 * @example
 * view.addLayer(layer)
 * @param {object} layer 图层对象
 * @return {layerPromise}
 */
GlobeView.prototype.addLayer = function addLayer(layer) {
    if (!layer) {
        return new Promise((resolve, reject) => reject(new Error('layer is undefined')));
    }
    if (layer.isColorLayer) {
        const colorLayerCount = this.getLayers(l => l.isColorLayer).length;
        layer.sequence = colorLayerCount;
    } else if (layer.isElevationLayer) {
        if (layer.source.isWMTSSource && layer.source.tileMatrixSet !== 'WGS84G') {
            throw new Error('Only WGS84G tileMatrixSet is currently supported for WMTS elevation layers');
        }
    }
    const layerId = layer.id;
    const layerPromise = View.prototype.addLayer.call(this, layer, this.tileLayer);

    this.dispatchEvent({
        type: GLOBE_VIEW_EVENTS.LAYER_ADDED,
        layerId,
    });

    return layerPromise;
};

/**
 * 移除图层 This removes layers inserted with attach().
 * @example
 * view.removeLayer('layerId');
 * @param      {string}   layerId      图层id
 * @return     {boolean}
 */
GlobeView.prototype.removeLayer = function removeLayer(layerId) {
    if (View.prototype.removeLayer.call(this, layerId)) {
        this.dispatchEvent({
            type: GLOBE_VIEW_EVENTS.LAYER_REMOVED,
            layerId,
        });
        return true;
    }
};

export default GlobeView;
