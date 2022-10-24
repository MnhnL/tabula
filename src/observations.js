import * as React from "react";
import { Datagrid, DateField, List, TextField,
         TextInput, DateInput, AutocompleteArrayInput,
         useListController, useGetList, useListContext,
         Loading, FunctionField, RecordContextProvider,
	 Show, SimpleShowLayout } from 'react-admin';
import { Pagination } from 'react-admin';
import { useMapState } from 'react-use-object-state';

import { Stack, Autocomplete, TextField as MuiTextField,
         FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
	 List as MuiList, ListItem as MuiListItem, ListItemText as MuiListItemText,
	 IconButton, Box, Grid, Chip, Switch, FormGroup, ToggleButtonGroup, ToggleButton,
	 Card, Tooltip } from '@mui/material';

import ClearIcon from '@mui/icons-material/Clear';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ListIcon from '@mui/icons-material/List';
import OneKIcon from '@mui/icons-material/OneK';

import { GeoMap, getGeography } from './map.js';
import { parse } from 'wkt';

const filters = [
    <TextInput label="External id" source="external_id"/>,
    <DateInput label="Sampled after" source="sampled_at_start@gte"/>,
    <DateInput label="Sampled before" source="sampled_at_start@lte"/>,
    // <TextInput label="Sampler" source="sampler_names@cs"/>, // Needs to put {} around names
    <TextInput label="Taxon ListItemKey" source="taxon_list_item_key@eq" />,
    <AutocompleteArrayInput label="Data source" source="source" choices={[
        { id: 'LUXNAT', name: 'Luxnat' },
        { id: 'INAT', name: 'iNaturalist' },
        { id: 'DATA', name: 'data.mnhn.lu' },
        { id: 'CAL', name: 'Centrale ornithologique' },
    ]} />
];


const ObservationPagination = () => <Pagination rowsPerPageOptions={[10, 20, 50, 100, 1000]} />;
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

const InfoBox = ({record}) => {
    function isUrl(s) {
	return s.substring(0, 4) === 'http';
    }

    // Image
    let url;
    if (record?.file_names) {
        url = record.file_names.find(fn => isUrl(fn));
    }

    // <Image url={url}/>

    // return (
    // 	<div style={{width: "200px"}}>
    // 	    <RecordContextProvider value={record}>
    // 		<Show>
    // 		    <SimpleShowLayout>
    // 			<TextField source="taxon_list_item_key" />
    // 		    </SimpleShowLayout>
    // 		</Show>
    // 	    </RecordContextProvider>
    // 	</div>
    // );
    return <Card>Hello</Card>;
}


const TaxonItem = ({taxon,
		    includeTaxon,
		    includeSubtaxa,
		    includeSynonyms,
		    onDelete,
		    displayOnly = false,
		    ...props}) => {
    const {taxon_list_item_key, taxon_name, authority, taxon_rank,
	   kng_name, div_name, phyl_name, cla_name, ord_name, fam_name, gen_name} = taxon;

    let include = true;

    let secondaryAction = null,
	includeExcludeButton = null;
    
    // in the list
    if (!displayOnly) {
        include = includeTaxon.state.get(taxon.taxon_list_item_key);

	secondaryAction = <IconButton onClick={(e) => onDelete(e, taxon)}><ClearIcon /></IconButton>;
	includeExcludeButton = <IconButton onClick={(e) => includeTaxon.set(taxon_list_item_key, !include)}>{ include ? <AddCircleOutlineIcon /> : <RemoveCircleOutlineIcon /> }</IconButton>;
    }

    const path = [kng_name, div_name, phyl_name, cla_name, ord_name, fam_name, gen_name].filter(t => !!t).join(" > ");
    
    return (
	<MuiListItem {...props}
		     key={taxon_list_item_key}
		     secondaryAction={secondaryAction}
		     sx={{backgroundColor: include ? 'white': 'yellow'}}>
	    { includeExcludeButton }
	    <MuiListItemText secondary={path}>
		<Box component={'span'}
		     sx={{fontStyle: 'italic'}}>
		    {taxon_name}
		</Box> {authority} <Chip label={taxon_rank} variant="outlined" size="small"/>
	    </MuiListItemText>
	    { !displayOnly &&
	      <FormGroup>
		  <FormControlLabel control={<Switch size="small"
						     checked={includeSubtaxa.state.get(taxon_list_item_key)}
						     onChange={(e) => includeSubtaxa.set(taxon_list_item_key, !includeSubtaxa.state.get(taxon_list_item_key))} />}
				    label="Subtaxa" />
		  <FormControlLabel control={<Switch size="small"
						     checked={includeSynonyms.state.get(taxon_list_item_key)}
						     onChange={(e) => includeSynonyms.set(taxon_list_item_key, !includeSynonyms.state.get(taxon_list_item_key))}/>}
				    label="Synonyms" />
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
    
    // const [include_, setInclude_] = React.useState({}); // A map TaxonId -> includeTaxon
    const include = useMapState();
    const includeSubtaxa = useMapState();  // A map TaxonId -> includeSubtaxa
    const includeSynonyms = useMapState() // A map TaxonId -> includeSynonyms

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

    // Applies taxon filters based on state mentionned below
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
	const joinList = (l) => "(" + l.join(",") + ")";
	
	const selectedTaxaIds = selectedTaxa.map((t) => t.taxon_list_item_key);

	const includedIds = selectedTaxaIds.filter(id => include.state.get(id));
	const excludedIds = selectedTaxaIds.filter(id => !include.state.get(id));

	var filterValuesDup = Object.assign({}, filterValues);
	const newFilters = {};

	// Remove old taxon filters
	const filterIdPrefixes = [
	    'taxon_list_item_key', 'preferred_taxon_list_item_key',
	    'kng_key', 'div_key', 'phyl_key',
	    'cla_key', 'ord_key', 'fam_key',
	    'gen_key', 'spp_key'];
	for (let filterIdPrefix of filterIdPrefixes) {
	    delete filterValuesDup[`${filterIdPrefix}@in`];
	    delete filterValuesDup[`${filterIdPrefix}@not.in`];
	}

	// Set all filters using index arrays
	for (let st of selectedTaxa) {
	    let id = st.taxon_list_item_key;

	    // The one we filter for
	    let targetId;
	    if (includeSynonyms.state.get(id)) {
		targetId = st.preferred_taxon_list_item_key;
	    } else {
		targetId = st.taxon_list_item_key;
	    }
	    
	    const rank = st.taxon_rank;

	    let filterIdPrefix;
	    if (includeSubtaxa.state.get(id)) {
		filterIdPrefix = `${rank}_key`;
	    } else if (includeSynonyms.state.get(id)) {
		filterIdPrefix = 'preferred_taxon_list_item_key';
	    } else {
		filterIdPrefix = 'taxon_list_item_key';
	    }

	    const filterIdOperator = include.state.get(id) || includeSynonyms.state.get(id) ? 'in' : 'not.in';

	    const filterId = `${filterIdPrefix}@${filterIdOperator}`;

	    // Push taxon id into relevant filter, (maybe create new one)
	    if (!(filterId in newFilters)) {
		newFilters[filterId] = [];
	    }
	    newFilters[filterId].push(targetId);
	}

	// Translate into format usable by API
	for (let filterId in newFilters) {
	    newFilters[filterId] = joinList(newFilters[filterId]);
	}

	const effectiveFilters = {...filterValuesDup, ...newFilters}

	//console.log(effectiveFilters);

	setFilters(effectiveFilters);
    }, [selectedTaxa, include, includeSubtaxa, includeSynonyms]);
    
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
			include.set(tlik, true);
			includeSubtaxa.set(tlik, true);
			includeSynonyms.set(tlik, true);

			// Append taxon object returend from API to selected taxa list
			const newSelectedTaxa = selectedTaxa.concat([newSelectedTaxon])
			setSelectedTaxa(newSelectedTaxa);

		    }}
		    renderOption={(props, t) => {
			return (<TaxonItem {...props}
					   taxon={t}
					   dense={true}
					   key={t.taxon_list_item_key}
					   includeTaxon={include}
					   displayOnly={true} />
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
				       includeTaxon={include}
				       includeSubtaxa={includeSubtaxa}
				       includeSynonyms={includeSynonyms}
				       onDelete={(e, t_del) => setSelectedTaxa(selectedTaxa.filter((t) => t.taxon_list_item_key !== t_del.taxon_list_item_key))}
			               displayOnly={false}/>
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

	setLastClickedRecord(record);

        return null;
    };

    return (
	<Grid container>
	    <Grid item xs={8}>
        <List filters={filters}
              pagination={<ObservationPagination />}>
            <Stack spacing={2} sx={{paddingLeft: 1, height: "100%"}}>
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
		<Datagrid rowClick={postRowClick} sx={{overflowY: "scroll", height: "40vh"}}>
		   <FunctionField label="Taxon"
				  render={(r) => <TaxonItem taxon={{taxon_name: r.taxon_name, authority: r.authority, taxon_rank: r.taxon_rank}}
							    displayOnly={true} />} />
		   <FunctionField label="Samplers" render={(r) => r.sampler_names?.join(', ')} />
		   <DateField source="sampled_at_end" />
		   <TextField source="source" />
              </Datagrid>
           </Stack>
        </List>
	    </Grid>
	    <Grid item xs={2}>
		<InfoBox record={lastClickedRecord} />
	    </Grid>
	</Grid>
    );
}
// <TextField source="taxon_name"
//            sx={{ display: 'inline-block', maxWidth: '20em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
