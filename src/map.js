import * as React from "react";
import { useGetList, useListController } from 'react-admin';

import 'maplibre-gl/dist/maplibre-gl.css';
// eslint-disable-next-line import/no-webpack-loader-syntax
import maplibregl from '!maplibre-gl'; // Next three lines are a hack from https://github.com/maplibre/maplibre-gl-js/issues/1011
import maplibreglWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker';

import {Map as MapGL, Source, Layer, NavigationControl} from 'react-map-gl';
// import SpaIcon from '@mui/icons-material/Spa';
import { parse } from 'wkt';

maplibregl.workerClass = maplibreglWorker; // part of hack above

// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
export const polygonLayer = {
    source: "observation-locations",
    type: "fill",
    paint: {
        "fill-color": ['case', ['get', 'highlighted'], '#0f0', '#000'],
        "fill-opacity": 0.2,
        // 'fill-sort-key': 'sort',
        'fill-outline-color': '#000',
    }
};

export const pointLayer = {
    source: "observation-locations",
    type: 'circle',
    filter: ["==", ["get", "type"], "Point"],
    paint: {
        'circle-radius': ['case', ['get', 'highlighted'], 10, 6],
        'circle-color': ['case', ['get', 'highlighted'], '#0f0', '#000'],
	'circle-stroke-width': ['case', ['get', 'highlighted'], 1, 0],
        'circle-opacity': 0.2,
        // 'circle-sort-key': 'foo', // This is somehow broken or I don't understand how it should work
    }
};

export function getGeography(displayType, record) {
    if (displayType === 'polygon') {
	return record.location_geography || record.sample_geography;
    } else {
	return record.location_geography_centroid || record.sample_geography_centroid;
    }
}

export const GeoMap = React.forwardRef(({viewState, setViewState, highlighted, featureCount, displayType}, ref) => {
    // const { data, isLoading  } = useListContext();

    const {
        sort, // a sort object { field, order }, e.g. { field: 'date', order: 'DESC' }
        filterValues, // a dictionary of filter values, e.g. { title: 'lorem', nationality: 'fr' }
        resource, // the resource name, deduced from the location. e.g. 'posts'
	page, // Current page
	perPage, 
    } = useListController();

    // eslint-disable-next-line
    const { data, __, isLoading, error } = useGetList(
        resource,
        {
            pagination: { page: featureCount === 'page' ? page : 1, perPage: featureCount === 'page' ? perPage : '1000' },
            sort,
            filter: filterValues
        }
    );

    if (error) { return <p>ERROR</p>; }

    let features = [];
    if (!isLoading && data) {
	features = data?.filter(r => getGeography(displayType, r)).map(r => {
            const geo = parse(getGeography(displayType, r));
            const hi = r.external_id === highlighted;
            return {
                type: "Feature",
                geometry: geo,
                properties: {
                    type: geo['type'],
                    highlighted: hi,
                    //sort: hi ? 1 : 0,
		    foo: hi ? 1 : 0,
                }
            };
        });
    }

    const featureCollection = {
        type: "FeatureCollection",
        features
    };

    return (
        <MapGL /* {...viewState} */
        /* onMove={evt => setViewState(evt.viewState)} */
               initialViewState={{
                   longitude: 6.08,
                   latitude: 49.72,
                   zoom: 8
               }}
               mapLib={maplibregl}
               style={{minHeight: "300px", minWidth: "100px"}}
               mapStyle="https://api.maptiler.com/maps/topo/style.json?key=Y9b4FjkTykQU3UX9Qx1O"
               ref={ref}>
          <NavigationControl />
          <Source id="observation-locations"
                  type="geojson"
                  data={featureCollection} >
            <Layer {...polygonLayer}/>
            <Layer {...pointLayer}/>
          </Source>
        </MapGL>
    );
});

