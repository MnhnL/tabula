import * as React from 'react';
import { Datagrid, DateField, List, TextField,
         TextInput, DateInput, AutocompleteArrayInput,
         useListController, useGetList,
         Loading, FunctionField, RecordContextProvider,
	 Show, SimpleShowLayout } from 'react-admin';
import { Pagination } from 'react-admin';

import { Stack,
         FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
	 Grid, Box, FormGroup, ToggleButtonGroup, ToggleButton,
	 Card, Tooltip, InputAdornment } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import OneKIcon from '@mui/icons-material/OneK';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import { ReflexContainer, ReflexSplitter, ReflexElement }  from 'react-reflex';
import 'react-reflex/styles.css';

import { GeoMap, getGeography } from './map.js';
import { TaxonItem, TaxonFilter } from './taxon.js';

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

    React.useEffect(() => {
	mapRef.current?.resize();
    }, []);

    return (
	<Grid container>
	    <Grid item xs={8}>
		<List filters={filters}
		      pagination={<ObservationPagination />}>
		    <Stack spacing={2} sx={{paddingLeft: 3, height: "100%"}}>
			<TaxonFilter />
			<ReflexContainer orientation="horizontal">
			    <ReflexElement>
				<Stack direction="row"
				       spacing={2} >
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
			    </ReflexElement>
			    <ReflexSplitter/>
			    <ReflexElement>
				<Datagrid rowClick={postRowClick} sx={{overflowY: "scroll", height: "40vh"}}>
				    <FunctionField label="Taxon"
						   render={(r) => <TaxonItem taxon={{taxon_name: r.taxon_name, authority: r.authority, taxon_rank: r.taxon_rank}}
									     displayOnly={true} />} />
				    <FunctionField label="Samplers" render={(r) => r.sampler_names?.join(', ')} />
				    <DateField source="sampled_at_end" />
				    <TextField source="source" />
				</Datagrid>
			    </ReflexElement>
			</ReflexContainer>
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
