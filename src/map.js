import * as React from "react";
import { Stack, ToggleButtonGroup, ToggleButton } from '@mui/material';

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
        //'circle-sort-key': 'sort', // This is somehow broken or I don't understand how it should work
    }
};

export function getGeography(displayType, record) {
    if (displayType === 'polygon') {
	return record.geography;
    } else {
	return record.geography;
    }
}

export const MapOptions = ({onFeatureCountChange, featureCount,
			    onDisplayTypeChange, displayType}) => {
    return (
	<Stack spacing={2}>
	    <ToggleButtonGroup value={featureCount}
			       onChange={(e, value) => onFeatureCountChange(value)}
			       orientation="vertical"
			       size="small" exclusive>
		<ToggleButton value="page" key="page">Pag</ToggleButton>
		<ToggleButton value="1000" key="1000">1k</ToggleButton>
	    </ToggleButtonGroup>
	    <ToggleButtonGroup value={displayType}
			       onChange={(e, value) => onDisplayTypeChange(value)}
			       orientation="vertical"
			       size="small" exclusive>
		<ToggleButton value="centroid" key="centroid">Cent</ToggleButton>
		<ToggleButton value="polygon" key="polygon">Poly</ToggleButton>
	    </ToggleButtonGroup>
	</Stack>
    );
}

export const GeoMap = React.forwardRef(({viewState, setViewState,
					 highlighted,
					 featureCount, displayType,
					 data, isLoading, error}, ref) => {
    if (error) { return <p>ERROR</p>; }

    let features = [];
    if (!isLoading && data) {
	features = data?.filter(r => getGeography(displayType, r)).map(r => {
            const geo = parse(getGeography(displayType, r));
            const hi = r.internal_id === highlighted;
            return {
                type: "Feature",
                geometry: geo,
                properties: {
                    type: geo['type'],
                    highlighted: hi,
                    sort: hi ? 1 : 0,
                }
            };
        });
    }

    const featureCollection = {
        type: "FeatureCollection",
        features
    };

    return (
        <MapGL //{...viewState}
               // onMove={evt => setViewState(evt.viewState)}
               initialViewState={{
                   longitude: 6.08,
                   latitude: 49.72,
                   zoom: 8
               }}
               mapLib={maplibregl}
               style={{height: 320}}
               mapStyle="https://api.maptiler.com/maps/topo/style.json?key=Y9b4FjkTykQU3UX9Qx1O"
               ref={ref} >
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

