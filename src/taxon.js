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
			   includeSubtaxa,
			   includeSynonyms,
			   onDelete,
			   displayOnly = false,
			   ...props}) => {
    const {key, taxon_name, authority, taxon_rank,
	   kng_name, div_name, phyl_name, cla_name, ord_name, fam_name, gen_name} = taxon;

    let include = true;

    let secondaryAction = null,
	includeExcludeButton = null;
    
    // in the list
    if (!displayOnly) {
        include = includeTaxon.state.get(taxon.key);

	secondaryAction = <IconButton onClick={(e) => onDelete(e, taxon)}><ClearIcon /></IconButton>;
	includeExcludeButton = <IconButton onClick={(e) => includeTaxon.set(key, !include)}>{include ? <AddCircleOutlineIcon /> : <RemoveCircleOutlineIcon /> }</IconButton>;
    }

    const path = [kng_name, div_name, phyl_name, cla_name,
		  ord_name, fam_name, gen_name].filter(t => !!t).join(" > ");
    
    return (
	<MuiListItem {...props}
		     key={key}
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
	    </MuiListItemText>
	    { !displayOnly &&
	      <FormGroup>
		  <FormControlLabel
		      control={
			  <Switch size="small"
				  checked={includeSubtaxa.state.get(key)}
				  onChange={(e) => includeSubtaxa.set(key, !includeSubtaxa.state.get(key))} />}
		      label="Subtaxa" />
		  <FormControlLabel
		      control={
			  <Switch size="small"
				  checked={includeSynonyms.state.get(key)}
				  onChange={(e) => includeSynonyms.set(key, !includeSynonyms.state.get(key))}/>}
		      label="Synonyms" />
	      </FormGroup>
	    }
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
		fetch(`http://potato.hisnat.local:3000/rpc/taxon_suggest?query=${request.input}`).then((response) => {
		    if (!response.ok) {
			console.error("Could not fetch from Taxa API");
		    } else {
			response.json().then((json) => {
			    callback(json)
			});
		    }
		});
            }, 500),
	[]
    );

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

	var filterValuesDup = Object.assign({}, filterValues);
	const newFilters = {};

	// Remove old taxon filters
	const filterIdPrefixes = [
	    'key',
	    'kng_key', 'div_key', 'phyl_key',
	    'cla_key', 'ord_key', 'fam_key',
	    'gen_key', 'spp_key'];

	for (let filterIdPrefix of filterIdPrefixes) {
	    delete filterValuesDup[`${filterIdPrefix}@in`];
	    delete filterValuesDup[`${filterIdPrefix}@not.in`];
	    delete filterValuesDup[`preferred_${filterIdPrefix}@in`];
	    delete filterValuesDup[`preferred_${filterIdPrefix}@not.in`];
	}

	// Set all filters using index arrays
	for (let st of selectedTaxa) {
	    let id = st.key;

	    // The one we filter for
	    let targetId;
	    if (includeSynonyms.state.get(id)) {
		targetId = st.preferred_key;
	    } else {
		targetId = st.key;
	    }
	    
	    const rank = st.taxon_rank;

	    let filterIdPrefix;
	    if (includeSubtaxa.state.get(id)) {
		filterIdPrefix = `${rank}_key`;
	    } else {
		filterIdPrefix = 'key';
	    }

	    // Search via preferred_${rank}_key or preferred_key
	    if (includeSynonyms.state.get(id)) {
		filterIdPrefix = 'preferred_' + filterIdPrefix;
	    }

	    const filterIdOperator = include.state.get(id) ? 'in' : 'not.in';

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

	setFilters(effectiveFilters);
    }, [include.state, includeSubtaxa.state, includeSynonyms.state,
	selectedTaxa]);
    
    return (
	<Stack style={{minWidth: "30em"}}>
	    <Autocomplete
		options={options}
		filterOptions={(x) => x}
		autoComplete
		value={value}
		renderInput={(params) => <MuiTextField {...params} label="Find Taxon" variant="outlined" size="small" fullWidth />}
		onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
		onChange={(ev, newSelectedTaxon) => {
		    setOptions([]);
		    setInputValue('');
		    setValue(null);

		    // Set options
		    const key = newSelectedTaxon.key;
		    include.set(key, !include.state.get(key));
		    includeSubtaxa.set(key, true);
		    includeSynonyms.set(key, true);

		    // Append taxon object returend from API to selected taxa list
		    const newSelectedTaxa = selectedTaxa.concat([newSelectedTaxon])
		    setSelectedTaxa(newSelectedTaxa);
		}}
		renderOption={(props, t) => {
		    return (<TaxonItem {...props}
				       taxon={t}
				       dense={true}
				       key={t.key}
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
				   key={t.key}
				   includeTaxon={include}
				   includeSubtaxa={includeSubtaxa}
				   includeSynonyms={includeSynonyms}
				   onDelete={(e, t_del) => setSelectedTaxa(selectedTaxa.filter((t) => t.key !== t_del.key))}
			           displayOnly={false}/>
		    );
		})}
	    </MuiList>
	     </Stack>
    );
}
