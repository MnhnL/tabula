import * as React from 'react';

import { useListContext } from 'react-admin';

import { IconButton,
         Stack, Chip, Box,
	 FormControlLabel, FormGroup,
	 Switch, 
	 List as MuiList, ListItem as MuiListItem, ListItemText as MuiListItemText,
	 Autocomplete, TextField as MuiTextField } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';

import { useMapState } from 'react-use-object-state';
import _ from 'lodash';

export const TaxonItem = ({taxon,
			   includeTaxon,
			   onDelete,
			   displayOnly = false,
			   ...props}) => {
    const {internal_id, taxon_name, authority, taxon_rank,
	   kingdom_name, division_name, phylum_name, class_name, order_name, family_name, genus_name,
	   source} = taxon;

    let include = true;

    let secondaryAction = null,
	includeExcludeButton = null;
    
    // in the list
    if (!displayOnly) {
        include = includeTaxon.state.get(taxon.internal_id);

	secondaryAction = <IconButton onClick={(e) => onDelete(e, taxon)}><ClearIcon /></IconButton>;
	includeExcludeButton = <IconButton onClick={(e) => includeTaxon.set(internal_id, !include)}>{include ? <AddCircleOutlineIcon /> : <RemoveCircleOutlineIcon /> }</IconButton>;
    }

    const path = [kingdom_name, phylum_name, class_name,
		  order_name, family_name, genus_name].filter(t => !!t).join(" > ");
    
    return (
	<MuiListItem {...props}
		     key={internal_id}
		     secondaryAction={secondaryAction}
		     sx={{backgroundColor: include ? null: 'yellow', m: 0, paddingLeft: 0, paddingTop: 0, paddingBottom: 0}}>
	    { includeExcludeButton }
	    <MuiListItemText sx={{m: 0}}
			     secondary={path}
			     secondaryTypographyProps={{fontSize: '0.8em',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis'}}>
		<Box component={'span'}
		     sx={{fontStyle: 'italic'}}>
		    {taxon_name}
		</Box>
		&nbsp;{authority}&nbsp;
		<Chip label={taxon_rank} variant="outlined" size="small"/>
		<Chip label={source} variant="outlined" color="info" size="small"/>
	    </MuiListItemText>
	</MuiListItem>
    );
}

export const TaxonFilter = ({selectedTaxa, setSelectedTaxa,
			     include, includeSubtaxa, includeSynonyms }) =>
{
    const [value, setValue] = React.useState(null); // The value selected from the list
    const [inputValue, setInputValue] = React.useState(''); // Raw value from input
    const [options, setOptions] = React.useState([]); // The options shown in dropdown

    const { filterValues, setFilters } = useListContext();
				
    const fetchOptions = React.useMemo(
	() => _.throttle(
            (request, callback ) => {
		fetch(`http://potato.hisnat.local:3000/rpc/taxon_suggest?query=${request.input}&query_source=col`).then((response) => {
		    if (!response.ok) {
			console.error("Could not fetch from taxon_suggest API");
		    } else {
			response.json().then((json) => { callback(json) });
		    }
		});
            }, 200),
	[]
    );

    const fetchEquivalent = 
        (request, callback ) => {
	    const requests = request.selectedTaxa.map(t => fetch(`http://potato.hisnat.local:3000/rpc/taxon_equivalent?q_internal_id=${t.internal_id}&q_preferred_internal_id=${t.preferred_internal_id}&q_rank=${t.taxon_rank}&include_children=${includeSubtaxa}&include_synonyms_and_preferred=${includeSynonyms}`));

	    Promise.all(requests)
		.then((responses) => {
		    const errors = responses.filter(r => !r.ok);
		    if (errors.length > 0) {
			throw errors.map(r => Error(r.statusText));
		    }
		    const jsons = responses.map(r => r.json());
		    return Promise.all(jsons);
		})
		.then(jsons => {
		    callback(jsons);
		})
		.catch(errors => {
		    console.error("Could not fetch from taxon_equivalent API", errors);
		});
	};

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

    const joinList = (l) => "{" + l.join(",") + "}";

    // Add to filters the values in selectedTaxa
    React.useEffect(() => {
	// Make sure that filters not related to taxonomy are not touched
	var filterValuesDup = Object.assign({}, filterValues);
	delete filterValuesDup['taxon_internal_ids@'];
	let newFilters = {};

	if (selectedTaxa.length > 0) {
	    const rightHandSide = joinList(selectedTaxa.map(r => r.preferred_internal_id));
	    newFilters = {'taxon_internal_ids@': rightHandSide};
	}
	const effectiveFilters = {...filterValuesDup, ...newFilters};

	if (!_.isEqual(filterValues, effectiveFilters)) {
	    setFilters(effectiveFilters);
	}
    }, [include.state, selectedTaxa]);
    
    return (
	<Stack style={{minWidth: "30em"}}>
	    <Autocomplete
		options={options}
		filterOptions={(x) => x}
		autoComplete
		value={value}
		renderInput={(params) => <MuiTextField {...params} label="Find Taxon" variant="outlined" size="small" fullWidth />}
		onInputChange={(event, newInputValue) => {
		    if (newInputValue.length >= 3) {
			setInputValue(newInputValue);
		    }
		}}
		onChange={(ev, newSelectedTaxon) => {
		    setOptions([]);
		    setInputValue('');
		    setValue(null);

		    // Set options
		    const iid = newSelectedTaxon.internal_id;
		    include.set(iid, !include.state.get(iid));

		    // Append taxon object returend from API to selected taxa list
		    const newSelectedTaxa = selectedTaxa.concat([newSelectedTaxon])
		    setSelectedTaxa(newSelectedTaxa);
		}}
		renderOption={(props, t) => {
		    return (<TaxonItem {...props}
				       taxon={t}
				       dense={true}
				       key={t.internal_id}
				       includeTaxon={include}
				       displayOnly={true} />
			   );
		}}
		getOptionLabel={(option) =>
		    typeof option === 'string' ? option : option.taxon_name
		}
		blurOnSelect
	    />
	    <MuiList>
		{selectedTaxa.map(t => {
		    return (
			<TaxonItem taxon={t}
				   dense={true}
				   key={t.internal_id}
				   includeTaxon={include}
				   onDelete={(e, t_del) => setSelectedTaxa(selectedTaxa.filter((t) => t.internal_id !== t_del.internal_id))}
			           displayOnly={false}/>
		    );
		})}
	    </MuiList>
	  </Stack>
    );
}
