import * as React from "react";
import { Datagrid, DateField, List, TextField,
         TextInput, DateInput, AutocompleteArrayInput,
         useListController, useGetList,
         Loading } from 'react-admin';
import { Pagination } from 'react-admin';
import { mkReferenceInput } from './filters.js';

import 'maplibre-gl/dist/maplibre-gl.css';
// eslint-disable-next-line import/no-webpack-loader-syntax
import maplibregl from '!maplibre-gl'; // Next three lines are a hack from https://github.com/maplibre/maplibre-gl-js/issues/1011
import maplibreglWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker';


import {Map as MapGL, Source, Layer, NavigationControl} from 'react-map-gl';
// import SpaIcon from '@mui/icons-material/Spa';
import { parse } from 'wkt';
import { Stack, Autocomplete, TextField as MuiTextField,
         FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

maplibregl.workerClass = maplibreglWorker; // part of hack above

const filters = [
    <TextInput label="External id" alwaysOn source="external_id"/>,
    <DateInput label="Sampled after" alwaysOn source="sampled_at_start@gte"/>,
    <DateInput label="Sampled before" alwaysOn source="sampled_at_start@lte"/>,
    <TextInput label="Determiner name" source="determiner_name@ilike" />,
    <TextInput label="Taxon ListItemKey" source="taxon_list_item_key@eq" alwaysOn />,
    <TextInput label="Taxon Name" source="taxon_name@ilike" alwaysOn />,
    mkReferenceInput('Species', 'spp'),
    mkReferenceInput('Genus', 'gen'),
    mkReferenceInput('Family', 'fam'),
    mkReferenceInput('Order', 'ord'),
    mkReferenceInput('Class', 'cla'),
    mkReferenceInput('Phylum', 'phyl'),
    mkReferenceInput('Kingdom', 'kng'),
    <AutocompleteArrayInput label="Data source" source="source" choices={[
        { id: 'LUXNAT', name: 'Luxnat' },
        { id: 'INAT', name: 'iNaturalist' },
        { id: 'DATA', name: 'data.mnhn.lu' },
        { id: 'CAL', name: 'Centrale ornithologique' },
    ]} />
];


const ObservationPagination = () => <Pagination rowsPerPageOptions={[10, 20, 50, 100, 1000]} />;


// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
export const polygonLayer = {
    source: "observation-locations",
    type: "fill",
    paint: {
        "fill-color": ['case', ['get', 'highlighted'], '#0f0', '#000'],
        "fill-opacity": 0.4,
        // 'fill-sort-key': 'sort',
        'fill-outline-color': '#000',
    }
};

export const pointLayer = {
    source: "observation-locations",
    type: 'circle',
    filter: ["==", ["get", "type"], "Point"],
    paint: {
        'circle-radius': ['case', ['get', 'highlighted'], 4, 4],
        'circle-color': ['case', ['get', 'highlighted'], '#0f0', '#000'],
	'circle-stroke-width': ['case', ['get', 'highlighted'], 1, 0],
        'circle-opacity': 0.4,
        // 'circle-sort-key': 'sort',
    }
};

function getGeography(displayType, record) {
    if (displayType === 'polygon') {
	return record.location_geography || record.sample_geography;
    } else {
	return record.location_geography_centroid || record.sample_geography_centroid;
    }
}

const GeoMap = React.forwardRef(({viewState, setViewState, highlighted, featureCount, displayType}, ref) => {
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

    if (isLoading  || !data) { return <Loading />; }
    if (error) { return <p>ERROR</p>; }

    const featureCollection = {
        type: "FeatureCollection",
        features: data.filter(r => getGeography(displayType, r)).map(r => {
//            console.log(r.external_id, r.location_geography, r.sample_geography);
            const geo = parse(getGeography(displayType, r));
            const hi = r.external_id === highlighted;
            return {
                type: "Feature",
                geometry: geo,
                properties: {
                    type: geo['type'],
                    highlighted: hi,
                    sort: hi ? 1 : 0,
                }
            };
        })
    };

    //console.log(featureCollection);

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

const Image = ({url}) => {
    if (url) {
    return (
        <div>
          {/* eslint-disable-next-line */}
          <img src={url} />
        </div>
    );
    } else {
        return <div>No image</div>;
    }
};

function isUrl(s) {
    return s.substring(0, 4) === 'http';
}


function getOptions() {
    return [
	{label: "foo"},
	{label: "bar"}
    ];
}
const TaxonFilter = () => {
    const fetch = React.useMemo(
        (request, callback ) => {
	    // autocompleteService.current.getPlacePredictions(
	    // 	request,
	    // 	callback,
	    // );
	    return getOptions();
        },
	[],
    );
    
    return (
	<Autocomplete
	    options={getOptions()}
	    renderInput={(params) => <MuiTextField {...params} label="Taxon" />}
	/>
    );
}

const MapOptions = ({onFeatureCountChange, featureCount,
		     onDisplayTypeChange, displayType}) => {
    return (
	<Stack direction="row">
	    <FormControl>
		<FormLabel>Observations on map</FormLabel>
		<RadioGroup
		    row
		    aria-labelledby="demo-radio-buttons-group-label"
		    defaultValue="page"
		    value={featureCount}
	            onChange={(e) => onFeatureCountChange(e.target.value)}>
		    <FormControlLabel value="page" control={<Radio />} label="This page" />
		    <FormControlLabel value="1000" control={<Radio />} label="First 1000 results" />
		</RadioGroup>
	    </FormControl>
	    <FormControl>
		<FormLabel>Display observation as</FormLabel>
		<RadioGroup
		    row
		    aria-labelledby="demo-radio-buttons-group-label"
		    defaultValue="page"
		    value={displayType}
	            onChange={(e) => onDisplayTypeChange(e.target.value)}>
		    <FormControlLabel value="centroid" control={<Radio />} label="Center" />
		    <FormControlLabel value="polygon" control={<Radio />} label="Polygon" />
		</RadioGroup>
	    </FormControl>
	</Stack>
);
}

export const ObservationList = () => {
    const [viewState, setViewState] = React.useState({
        longitude: 6.08,
        latitude: 49.72,
        zoom: 9
    });

    const [highlighted, setHighlighted] = React.useState();
    const [imageUrl, setImageUrl] = React.useState();

    const [featureCount, setFeatureCount] = React.useState('page');
    const [displayType, setDisplayType] = React.useState('centroid');

    const mapRef = React.useRef();

    const postRowClick = (id, resource, record) => {
        if (getGeography(displayType, record)) {
            const geo = parse(getGeography(displayType, record));
            let center;
            if (geo.type === 'Polygon') {
                center = geo['coordinates'][0][0];
            } else if (geo.type === 'Point') {
                center = geo['coordinates'];
            }
            setHighlighted(id);
	    // FIXME: This should probably be handled one up using a callback passet to this component
            mapRef.current?.flyTo({center: center, duration: 800});
        }

        // Image
        if (record.file_names) {
            const url = record.file_names.find(fn => isUrl(fn));
            if (url) {
                setImageUrl(url);
            } else {
                setImageUrl(null);
            }
        }

        return null;
    };

    return (
        <List filters={filters}
              pagination={<ObservationPagination />}
              aside={<Image url={imageUrl}/>}>
            <Stack spacing={2}>
		<MapOptions onFeatureCountChange={setFeatureCount}
			    featureCount={featureCount}
			    onDisplayTypeChange={setDisplayType}
			    displayType={displayType} />
		<TaxonFilter />
		<GeoMap viewState={viewState}
			setViewState={setViewState}
			highlighted={highlighted}
			ref={mapRef}
			featureCount={featureCount}
			displayType={displayType} />
               <Datagrid rowClick={postRowClick}>
		   <TextField source="id" />
		   <TextField source="taxon_name"
                              sx={{ display: 'inline-block', maxWidth: '20em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
		   <TextField source="sampler_names" />
		   <DateField source="sampled_at_end" />
		   <TextField source="source" />
              {/* <TextField source="geography" sx={{ display: 'inline-block', maxWidth: '20em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} /> */}
              </Datagrid>
           </Stack>
        </List>
    );
}
