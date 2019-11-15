import Promise from 'utils/promise';

import { replace } from 'utils/query';
import { MapboxLayer } from '@deck.gl/mapbox';
// import { BitmapLayer } from '@deck.gl/layers';

import TileLayer from './custom-layers/tile-layer';
import BitmapLayer from './custom-layers/bitmap-layer';

const VideoLayer = layerModel => {
  const { layerConfig, params, sqlParams, id } = layerModel;

  const layerConfigParsed =
    layerConfig.parse === false
      ? layerConfig
      : JSON.parse(replace(JSON.stringify(layerConfig), params, sqlParams));

  const { body } = layerConfigParsed || {};
  const { minzoom, maxzoom } = body || {};

  const layer = {
    id,
    type: 'custom',
    layers: [
      {
        id: `${id}-video-bg`,
        type: 'background',
        paint: {
          'background-color': 'transparent'
        },
        ...(maxzoom && {
          maxzoom
        }),
        ...(minzoom && {
          minzoom
        })
      },
      new MapboxLayer({
        id: `${id}-video`,
        type: TileLayer,
        renderSubLayers: ({ id: subLayerId, data, tile, visible, zoom }) => {
          const url =
            'https://storage.googleapis.com/skydipper_materials/movie-tiles/MODIS/{z}/{x}/{y}.mp4';
          const urlParsed = url
            .replace('{z}', tile.z)
            .replace('{x}', tile.x)
            .replace('{y}', tile.y);

          const video = document.createElement('video');
          video.src = urlParsed;
          video.crossOrigin = 'anonymous';
          video.autoplay = true;
          video.loop = true;

          // video.oncanplay = () => {
          //   video.play();
          // };

          return new BitmapLayer({
            id: subLayerId,
            data,
            image: video,
            bounds: tile.bbox,
            visible,
            zoom
          });
        },
        minZoom: minzoom,
        maxZoom: maxzoom,
        opacity: layerModel.opacity
      })
    ]
  };

  return new Promise((resolve, reject) => {
    if (layer) {
      resolve(layer);
    } else {
      reject(new Error('error in layer config'));
    }
  });
};

export default VideoLayer;
