import * as React from 'react';
import { Datagrid, DateField, List, TextField,
         TextInput, DateInput, AutocompleteArrayInput,
         FunctionField, useListContext, useTranslate } from 'react-admin';
import { Pagination } from 'react-admin';
import { useGetList } from 'react-admin';

import { Stack, Grid, Card, Chip, CircularProgress, Box } from '@mui/material';

import { useMapState } from 'react-use-object-state';

import { GeoMap, MapOptions, getGeography } from './map.js';
import { TaxonItem, TaxonFilter } from './taxon.js';
import { ListWrapper } from './util.js'

import { parse } from 'wkt';
import { format }  from 'date-fns';

// const QuickFilter = ({ label }) => {
//     const translate = useTranslate();
//     return <Chip sx={{ marginBottom: 1 }} label={translate(label)} />;
// };

const filters = [
    <TextInput label="Internal id" source="internal_id"/>,
    // <DateInput label="Sampled after" source="sampled_at_end@gte" alwaysOn />,
    // <TextInput label="Sampled at start" source="sampled_at_start@eq" />,
    // <DateInput label="Sampled before" source="sampled_at_start@lte" alwaysOn />,
//    <TextInput label="Sampler" source="sampler_names@cs"/>, // Needs to put {} around names
    <TextInput label="Taxon internal ID" source="taxon_internal_id@eq" />,
    <TextInput label="Determiner" source="determined_by_name@eq" />,
    <AutocompleteArrayInput label="Data source" source="source" choices={[
        { id: 'recorder', name: 'Recorder' },
        { id: 'inaturalist', name: 'iNaturalist' },
    ]} />
];

const ObservationPagination =
      () => <Pagination rowsPerPageOptions={[10, 20, 50, 100, 1000]}
			style={{overflow: "hidden"}}/>;

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

export const ObservationList = () => {
    const wrapper = (props) => (<Card style={{height: "100%"}}>{props.children}</Card>);

    return (
	<List filters={filters}
	      pagination={<ObservationPagination />}
	      component={wrapper}
	      sort={{field: 'entered_at_upper', order: 'DESC'}}
	      sx={{height: "100%",
		   width: "100%",
		   marginLeft: 10,
		   marginRight: 10}}>
	    <InsideList />
	</List>
    );
};

// This is separated so we can use useListContext
const InsideList = () => {
    const include = useMapState();
    const [includeSubtaxa, setIncludeSubtaxa] = React.useState(true);
    const [includeSynonyms, setIncludeSynonyms] = React.useState(true);
    const [selectedTaxa, setSelectedTaxa] = React.useState([]); // The list of Taxon API objects currently selected

    const [viewState, setViewState] = React.useState({
        longitude: 6.08,
        latitude: 49.72,
        zoom: 9
    });
    
    const [highlighted, setHighlighted] = React.useState();
    const mapRef = React.useRef();
    
    const [featureCount, setFeatureCount] = React.useState('page');
    const [displayType, setDisplayType] = React.useState('centroid');

    function boundingBox(geo) {
	let min0 = 100, max0 = -100, min1 = 100, max1 = -100;
	for (let p of geo['coordinates'][0]) {
	    if (p[0] < min0) min0 = p[0];
	    if (p[0] > max0) max0 = p[0];
	}
	for (let p of geo['coordinates'][0]) {
	    if (p[1] < min1) min1 = p[1];
	    if (p[1] > max1) max1 = p[1];
	}
	return [min0, max0, min1, max1];
    }

    function latitudeToZoom(lat) {
	if (lat < 0.0001)
	    return 19;
	if (lat < 0.001)
	    return 16;
	if (lat < 0.01)
	    return 15;
	if (lat < 0.05)
	    return 13;
	else
	    return 12;
    }
    
    const postRowClick = React.useCallback((record) => {
        if (getGeography(displayType, record)) {
            const geo = parse(getGeography(displayType, record));
            let center, zoom = 15;
            if (geo.type === 'Polygon') {
		const bb = boundingBox(geo);
		center = [(bb[0] + bb[1]) / 2.0, (bb[2] + bb[3]) / 2.0];
		console.log(bb[1]-bb[0]);
		zoom = latitudeToZoom(bb[1]-bb[0]);
            } else if (geo.type === 'Point') {
                center = geo['coordinates'];
            }
            setHighlighted(record.internal_id);
            mapRef.current?.flyTo({center: center, duration: 800, zoom});
        }
    });

    const {
	data,
	isFetching,
        sort, // a sort object { field, order }, e.g. { field: 'date', order: 'DESC' }
        resource, // the resource name, deduced from the location. e.g. 'posts'
	page, // Current page
	perPage,
	filterValues,
    } = useListContext();

    // FIXME: This will re-fetch all data, not very efficient :(
    const mapData = useGetList(
        resource,
        {
            pagination: {
		page: featureCount === 'page' ? page : 1,
		perPage: featureCount === 'page' ? perPage : '1000'
	    },
            sort,
            filter: filterValues
        }
    );

    return (
	<Stack sx={{height: "100%"}}>
	    <Stack spacing={2}>
		<Stack direction="row"
		       spacing={2}
		       sx={{paddingLeft: 3,
			    height: "100%"}}>
		    <TaxonFilter selectedTaxa={selectedTaxa}
				 setSelectedTaxa={setSelectedTaxa}
				 include={include}
				 includeSubtaxa={includeSubtaxa}
				 includeSynonyms={includeSynonyms}
		    />
		    <GeoMap viewState={viewState}
 			    setViewState={setViewState}
			    highlighted={highlighted}
			    ref={mapRef}
			    featureCount={featureCount}
			    displayType={displayType}
			    data={mapData.data}
			    isLoading={false}
			    error={false}
		    />
		    <MapOptions onFeatureCountChange={setFeatureCount}
				featureCount={featureCount}
				onDisplayTypeChange={setDisplayType}
				displayType={displayType} />
		</Stack>
	    </Stack>
	    { isFetching ?
	      <Box sx={{ display: 'flex',
			 justifyContent: 'center',
			 alignItems: 'center',
			 height: '100%'}}>
		  <CircularProgress/>
	      </Box> : 
	      <Datagrid rowClick={(id, resource, record) => postRowClick(record)}
			sx={{overflowY:"scroll"}}>
		  <FunctionField label="Taxon"
 				 render={(r) => <TaxonItem taxon={r}
 							   displayOnly={true} />} />
		  <FunctionField label="Entered by" render={(r) => r.entered_by_name} />
		  <FunctionField label="Determined by" render={(r) => r.determined_by_name} />
		  <FunctionField label="Entered" render={(r) => parseTimestampRange(r.entered_at)[0]} />
		  <FunctionField label="Determined" render={(r) => parseTimestampRange(r.determined_at)[0]} />
		  <FunctionField label="Location" render={r => r.geography ? "✓" : "❌"} />
		  <TextField source="source" />
	      </Datagrid>
	    }
	</Stack>
    );
}

//		 <DateField label="Entered" source={(r) => r.entered_at} />
//		 <DateField label="Sampled at end" source="sampled_at" />


function parseTimestampRange(range) {
    const re = '\\["(.*)","(.*)"\\)';
    if (range) {
	const res = range.match(re);
	if (res) {
	    const [_, from, to] =  res;
	    return [new Date(from), new Date(to)].map(d => d.toString());
	}
    }

    return ["n/a", "n/a"];
}


// import ReactDataGrid from '@inovua/reactdatagrid-community'
// import '@inovua/reactdatagrid-community/index.css'
// const RDG = ({onRowClick}) => {
//     const columns = [
// 	{ name: 'external_id', header: 'Id', defaultVisible: false, type: 'string', sortable: false },
// 	{ header: 'Sampled at', render: (r) => parseTimestampRange(r.data.sampled_at)[0], type: 'string', sortable: false, defaultFlex: 1},
// 	{ header: 'Samplers', render: (r) => r.data.sampler_names?.join(', '), sortable: false, defaultFlex: 1},
// 	{ header: 'Taxon', render: (r) => <TaxonItem taxon={r.data} displayOnly={true} />, sortable: false, width: 500, defaultFlex: 2 },
// 	{ name: 'source', header: 'Source', type: 'string' },
//     ];

//     const { data, isLoading } = useListContext();

//     const getData = (args) => {
// 	// FIXME: Use sortInfo.dir, sortInfo.id, sortInfo.name
// 	return Promise.resolve(data);
//     };
    
//     if (data) {
// 	return (
// 	    <ReactDataGrid loading={isLoading}
// 			   nativeScroll={true}
// 			   idProperty="external_id"
// 			   columns={columns}
// 			   dataSource={getData}
// 			   onRowClick={id => onRowClick(data.find(d => d.exernal_id === id))}
// 			   style={{height: "100%"}} />
// 	);
//     }
// }


// const MyTable = ({onRowClick}) => {
//     const { data, isLoading } = useListContext();

//     if (data && !isLoading) {
// 	return (
// 	    <div style={{overflowY: "scroll", width: "100%"}}>
// 	    <table style={{width: "100%"}}>
// 		<thead>
// 		    <tr>
// 			<th>id</th>
// 			<th>taxon</th>
// 			<th>sampled at</th>
// 			<th>samplers</th>
// 			<th>source</th>
// 		    </tr>
// 		</thead>
// 		<tbody>
// 		    { data.map( r =>
// 			<tr onClick={e => onRowClick(data.find(d => d.external_id === r.external_id))}>
// 			    <td>{r.external_id}</td>
// 			    <td><TaxonItem taxon={r} displayOnly={true} /></td>
// 			    <td>{format(parseTimestampRange(r.sampled_at)[0], 'yyyy / MM / dd')}</td>
// 			    <td>{r.sampler_names?.join(', ')}</td>
// 			    <td>{r.source}</td>
// 			</tr>
// 		    ) }
// 		</tbody>
// 	    </table>
// 	    </div>
// 	);
//     }
// }

// <Datagrid rowClick={postRowClick}
// 	  sx={{overflowY: "scroll"}}>
//     <FunctionField label="Taxon"
// 		   render={(r) => <TaxonItem taxon={r}
// 					     displayOnly={true} />} />
//     <FunctionField label="Samplers" render={(r) => r.sampler_names?.join(', ')} />
//     <DateField source="sampled_at" />
//     <TextField source="source" />
// </Datagrid>
