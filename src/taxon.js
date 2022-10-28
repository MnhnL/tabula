import * as React from 'react';

import { IconButton,
         Grid, Chip, Box,
	 FormControlLabel, FormGroup,
	 Switch, 
	 List as MuiList, ListItem as MuiListItem, ListItemText as MuiListItemText,
	 Autocomplete, TextField as MuiTextField from '@mui/material';
import { useListContext } from 'react-admin';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';

import { useMapState } from 'react-use-object-state';

export const TaxonItem = ({taxon,
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
		     sx={{backgroundColor: include ? 'white': 'yellow', m: 0, py: 0}}>
	    { includeExcludeButton }
	    <MuiListItemText sx={{m: 0}}
			     secondary={path}
			     secondaryTypographyProps={{fontSize: '0.9em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
		<Box component={'span'}
		     sx={{fontStyle: 'italic'}}>
		    {taxon_name}
		</Box>
		&nbsp;{authority}&nbsp;
		<Chip label={taxon_rank} variant="outlined" size="small"/>
	    </MuiListItemText>
	    { !displayOnly &&
	      <FormGroup>
		  <FormControlLabel
		      control={
			  <Switch size="small"
				  checked={includeSubtaxa.state.get(taxon_list_item_key)}
				  onChange={(e) => includeSubtaxa.set(taxon_list_item_key, !includeSubtaxa.state.get(taxon_list_item_key))} />}
		      label="Subtaxa" />
		  <FormControlLabel
		      control={
			  <Switch size="small"
				  checked={includeSynonyms.state.get(taxon_list_item_key)}
				  onChange={(e) => includeSynonyms.set(taxon_list_item_key, !includeSynonyms.state.get(taxon_list_item_key))}/>}
		      label="Synonyms" />
	      </FormGroup>
	    }
	</MuiListItem>
    );
}

export const TaxonFilter = ({onChange}) => {
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
	    } else {
		filterIdPrefix = 'taxon_list_item_key';
	    }

	    // Search via preferred_${rank}_key or preferred_taxon_list_item_key
	    if (includeSynonyms.state.get(id)) {
		filterIdPrefix = 'preferred_' + filterIdPrefix;
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
		    renderInput={(params) => <MuiTextField {...params} label="Find Taxon" variant="outlined" size="small" fullWidth
							   // InputProps={{
							   //     startAdornment: (
							   // 	   <InputAdornment position="start">
							   // 	       <AccountTreeIcon />
							   // 	   </InputAdornment>
							   //     ),
							   // }}
					     />}
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
		<MuiList sx={{maxHeight: '8.5em',
			      overflowY: 'scroll'}}>
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
