import * as React from "react";
import { Datagrid, DateField, List, TextField,
         TextInput, DateInput, AutocompleteArrayInput,
         useListController, useGetList, useListContext,
         Loading, FunctionField, RecordContextProvider, ShowGuesser } from 'react-admin';
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
         FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
	 List as MuiList, ListItem as MuiListItem, ListItemText as MuiListItemText,
	 IconButton, Box, Grid, Chip, Switch, FormGroup, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';

import ClearIcon from '@mui/icons-material/Clear';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ListIcon from '@mui/icons-material/List';
import OneKIcon from '@mui/icons-material/OneK';

maplibregl.workerClass = maplibreglWorker; // part of hack above

const filters = [
    <TextInput label="External id" source="external_id"/>,
    <DateInput label="Sampled after" source="sampled_at_start@gte"/>,
    <DateInput label="Sampled before" source="sampled_at_start@lte"/>,
    <TextInput label="Taxon ListItemKey" source="taxon_list_item_key@eq" />,
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

    if (isLoading  || !data) { return <Loading sx={{minHeight: "300px", minWidth: "100px"}} />; }
    if (error) { return <p>ERROR</p>; }

    const featureCollection = {
        type: "FeatureCollection",
        features: data.filter(r => getGeography(displayType, r)).map(r => {
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

function isUrl(s) {
    return s.substring(0, 4) === 'http';
}

const Image = ({url}) => {
    if (url) {
    return (
        <div style={{maxWidth: 200}}>
          {/* eslint-disable-next-line */}
            <img style={{maxWidth: 200}} width={200} src={url} />
        </div>
    );
    } else {
        return <div>No image</div>;
    }
};

const InfoBox = ({imageUrl, record}) => {
    //<Image url={imageUrl}/>

    // return (
    // 	<div style={{width: "200px"}}>
    // 	    <RecordContextProvider value={record}>
    // 		<ShowGuesser/>
    // 	    </RecordContextProvider>
    // 	</div>
    // );
    return null;
}

const TaxonItem = ({taxon, includeTaxon, setIncludeTaxon, includeSubtaxa, setIncludeSubtaxa, includeSynonyms, setIncludeSynonyms, onDelete, ...props}) => {
    const {taxon_list_item_key, taxon_name, authority, taxon_rank,
	   kng_name, div_name, phyl_name, cla_name, ord_name, fam_name, gen_name} = taxon;

    let secondaryAction = null,
	includeExcludeButton = null;
    
    // in the list
    if (onDelete) {
	secondaryAction = <IconButton onClick={(e) => onDelete(e, taxon)}><ClearIcon /></IconButton>;
	includeExcludeButton = <IconButton onClick={(e) => setIncludeTaxon(taxon_list_item_key, !includeTaxon)}>{ includeTaxon ? <AddCircleOutlineIcon /> : <RemoveCircleOutlineIcon /> }</IconButton>;
    }

    const path = [kng_name, div_name, phyl_name, cla_name, ord_name, fam_name, gen_name].filter(t => !!t).join(" > ");
    
    return (
	<MuiListItem {...props}
		     key={taxon_list_item_key}
		     secondaryAction={secondaryAction}
		     sx={{backgroundColor: includeTaxon ? 'white': 'yellow'}}>
	    { includeExcludeButton }
	    <MuiListItemText secondary={path}>
		<Box component={'span'} sx={{fontStyle: 'italic'}}>{taxon_name}</Box> {authority} <Chip label={taxon_rank} variant="outlined" size="small"/>
	    </MuiListItemText>
	    { onDelete &&
	      <FormGroup>
		  <FormControlLabel control={<Switch size="small" checked={includeSubtaxa} onChange={(e) => setIncludeSubtaxa(taxon_list_item_key, !includeSubtaxa)} />} label="Subtaxa" />
		  <FormControlLabel control={<Switch size="small" checked={includeSynonyms} onChange={(e) => setIncludeSynonyms(taxon_list_item_key, !includeSynonyms)}/>} label="Synonyms" />
	      </FormGroup>
	    }
	</MuiListItem>
    );
}

const TaxonFilter = ({onChange}) => {
    const [value, setValue] = React.useState(null); // The value selected from the list
    const [inputValue, setInputValue] = React.useState(''); // Raw value from input
    const [options, setOptions] = React.useState([]); // The options shown in dropdown

    const [selectedTaxa, setSelectedTaxa] = React.useState([]); // The list of Taxon API objects currently selected
    
    const [include, setInclude] = React.useState({}); // A map TaxonId -> includeTaxon
    const [includeSubtaxa, setIncludeSubtaxa] = React.useState({}); // A map TaxonId -> includeSubtaxa
    const [includeSynonyms, setIncludeSynonyms] = React.useState({}); // A map TaxonId -> includeSynonyms

    const setIncludeById = (id, value) => {
	setInclude({...include, [id]: value});
    }
    const getIncludeById = (id) => {
	return include[id];
    }

    const setIncludeSubtaxaById = (id, value) => {
	setIncludeSubtaxa({...includeSubtaxa, [id]: value});
    }
    const getIncludeSubtaxaById = (id) => {
	return includeSubtaxa[id];
    }

    const setIncludeSynonymsById = (id, value) => {
	setIncludeSynonyms({...includeSynonyms, [id]: value});
    }
    const getIncludeSynonymsById = (id) => {
	return includeSynonyms[id];
    }

    
    const fetchOptions = React.useMemo(
	() => 
            (request, callback ) => {
		fetch(`http://potato.hisnat.local:3000/rpc/taxon_suggest?query=${request.input}`).then((response) => {
		    if (!response.ok) {
			console.error("Could not fetch from Taxa API");
		    } else {
			response.json().then((json) => {
			    callback(json)
			});
		    }
		});
            },
	[]
    );

    const {filterValues, setFilters} = useListContext();

    React.useEffect(() => {
	let active = true;

	if (inputValue === '') {
	    setOptions(value ? [value] : []);
	    return undefined;
	}

	fetchOptions({ input: inputValue },
		     (results) => {
			 if (active && results) {
			     setOptions(results);
			 }
		     });

	return () => {
	    active = false;
	};
    }, [value, inputValue, fetchOptions]);


    // Add to filters the values in selectedTaxa
    React.useEffect(() => {
	const selectedTaxaTLIKs = selectedTaxa.map((t) => t.taxon_list_item_key);

	// Remove the filter completely if not taxa selected
	if ('taxon_list_item_key@in' in filterValues && selectedTaxa.length == 0) {
	    var dup = Object.assign({}, filterValues);
	    delete dup['taxon_list_item_key@in'];
	    setFilters(dup)
	} else {
	    setFilters({...filterValues, 'taxon_list_item_key@in': "(" + selectedTaxaTLIKs.join(',') + ")"});
	}
    }, [selectedTaxa]);
    
    return (
	<Grid container>
	    <Grid item xs={4}>
		<Autocomplete
		    options={options}
		    // sx={{minWidth: "30em"}}
		    filterOptions={(x) => x}
		    autoComplete
		    value={value}
		    renderInput={(params) => <MuiTextField {...params} label="Find Taxon" fullWidth />}
		    onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
		    onChange={(ev, newSelectedTaxon) => {
			setOptions([]);
			setInputValue('');
			setValue(null);

			// Set options
			const tlik = newSelectedTaxon.taxon_list_item_key;
			setIncludeById(tlik, true);
			setIncludeSubtaxaById(tlik, true);
			setIncludeSynonymsById(tlik, true);

			// Append taxon object returend from API to selected taxa list
			const newSelectedTaxa = selectedTaxa.concat([newSelectedTaxon])
			setSelectedTaxa(newSelectedTaxa);

		    }}
		    renderOption={(props, t) => {
			return (<TaxonItem {...props}
					   dense={true}
					   key={t.taxon_list_item_key}
					   includeTaxon={true}
					   taxon={t}
					   onDelete={null} />
			       );
		    }}
		    getOptionLabel={(option) =>
			typeof option === 'string' ? option : option.taxon_name
		    }
		    blurOnSelect
		/>
	    </Grid>
	    <Grid item xs={8}>
		<MuiList>
		    {selectedTaxa.map(t => {
			return (
			    <TaxonItem taxon={t}
				       dense={true}
				       key={t.taxon_list_item_key}
				       includeTaxon={getIncludeById(t.taxon_list_item_key)}
				       setIncludeTaxon={setIncludeById}
				       includeSubtaxa={getIncludeSubtaxaById(t.taxon_list_item_key)}
				       setIncludeSubtaxa={setIncludeSubtaxaById}
				       includeSynonyms={getIncludeSynonymsById(t.taxon_list_item_key)}
				       setIncludeSynonyms={setIncludeSynonymsById}
				       onDelete={(e, t_del) => setSelectedTaxa(selectedTaxa.filter((t) => t.taxon_list_item_key !== t_del.taxon_list_item_key))} />
			);
		    })}
		</MuiList>
	    </Grid>
	</Grid>
    );
}

const MapOptions = ({onFeatureCountChange, featureCount,
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

    const [lastClickedRecord, setLastClickedRecord] = React.useState();

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

	setLastClickedRecord(record);

        return null;
    };

    return (
	<Grid container>
	    <Grid item xs={8}>
        <List filters={filters}
              pagination={<ObservationPagination />}>
            <Stack spacing={2} sx={{paddingLeft: 1}}>
		<TaxonFilter />
		<Stack direction="row"
		       spacing={1} >
		    <MapOptions onFeatureCountChange={setFeatureCount}
				featureCount={featureCount}
				onDisplayTypeChange={setDisplayType}
				displayType={displayType} />
		    <GeoMap viewState={viewState}
			    setViewState={setViewState}
			    highlighted={highlighted}
			    ref={mapRef}
			    featureCount={featureCount}
			    displayType={displayType} />
		</Stack>
               <Datagrid rowClick={postRowClick}>
		   <TextField source="taxon_name"
                              sx={{ display: 'inline-block', maxWidth: '20em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
		   <FunctionField label="Samplers" render={(r) => r.sampler_names.join(', ')} />
		   <DateField source="sampled_at_end" />
		   <TextField source="source" />
              </Datagrid>
           </Stack>
        </List>
	    </Grid>
	    <Grid item xs={2}>
		<InfoBox imageUrl={imageUrl} record={lastClickedRecord} />
	    </Grid>
	</Grid>
    );
}
