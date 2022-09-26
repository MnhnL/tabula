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
import { Stack } from '@mui/material';

maplibregl.workerClass = maplibreglWorker; // part of hack above

const filters = [
    <DateInput label="Determined after" alwaysOn source="determined_at_start@gte"/>,
    <DateInput label="Determined before" alwaysOn source="determined_at_start@lte"/>,
    <TextInput label="Determiner name" source="determined_name@ilike" />,
    <DateInput label="Entered after" alwaysOn source="entered_at_start@gte"/>,
    <DateInput label="Entered before" alwaysOn source="entered_at_start@lte"/>,
    <TextInput label="Entered name" source="entered_name@ilike" />,
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
        'circle-radius': ['case', ['get', 'highlighted'], 8, 4],
        'circle-color': ['case', ['get', 'highlighted'], '#0f0', '#000'],
        'circle-opacity': 0.4,
        // 'circle-sort-key': 'sort',
    }
};

const GeoMap = React.forwardRef(({viewState, setViewState, highlighted}, ref) => {
    // const { data, isLoading  } = useListContext();

    const {
        sort, // a sort object { field, order }, e.g. { field: 'date', order: 'DESC' }
        filterValues, // a dictionary of filter values, e.g. { title: 'lorem', nationality: 'fr' }
        resource, // the resource name, deduced from the location. e.g. 'posts'
    } = useListController();

    // eslint-disable-next-line
    const { data, __, isLoading, error } = useGetList(
        resource,
        {
            pagination: { page: 1, perPage: 5000 },
            sort,
            filter: filterValues
        }
    );

    if (isLoading  || !data) { return <Loading />; }
    if (error) { return <p>ERROR</p>; }

    const featureCollection = {
        type: "FeatureCollection",
        features: data.filter(r => r.geography !== null).map(r => {
            //console.log(r.geography);
            const geo = parse(r.geography);
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

export const ObservationList = () => {
    const [viewState, setViewState] = React.useState({
        longitude: 6.08,
        latitude: 49.72,
        zoom: 9
    });

    const [highlighted, setHighlighted] = React.useState();
    const [imageUrl, setImageUrl] = React.useState();

    const mapRef = React.useRef();

    const postRowClick = (id, resource, record) => {
        if (record.geography) {
            const geo = parse(record.geography);
            let center;
            if (geo.type === 'Polygon') {
                center = geo['coordinates'][0][0];
            } else if (geo.type === 'Point') {
                center = geo['coordinates'];
            }
            setHighlighted(id);
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
            <GeoMap viewState={viewState}
                    setViewState={setViewState}
                    highlighted={highlighted}
                    ref={mapRef} />
            <Datagrid rowClick={postRowClick}>
              <TextField source="id" />
              <TextField source="taxon_name"
                         sx={{ display: 'inline-block', maxWidth: '20em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
              <TextField source="determined_name" />
              <DateField source="determined_at_start" />
              <DateField source="determined_at_end" />
              <TextField source="entered_name" />
              <DateField source="entered_at_start" />
              <DateField source="entered_at_end" />
              <TextField source="source" />
              {/* <TextField source="geography" sx={{ display: 'inline-block', maxWidth: '20em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} /> */}
            </Datagrid>
          </Stack>
        </List>
    );
}
