import { Datagrid, List, TextField, TextInput, FunctionField,
         useListContext} from 'react-admin';
import { Card, CircularProgress, Box } from '@mui/material';

import { ListWrapper } from './util.js'
import { mkReferenceInput } from './filters.js';

const filters = [
	<TextInput label="Internal ID" source="internal_id@eq" alwaysOn />,
	<TextInput label="Name" source="name@ilike" alwaysOn />,
	<TextInput label="Rank" source="rank@eq" alwaysOn />,
	<TextInput label="Authority" source="authority@ilike" alwaysOn/>,
    	<TextInput label="Source" source="source@eq" alwaysOn/>,

        <TextInput label="Parent internal ID" source="parent_internal_id@eq" />,
        <TextInput label="Preferred internal ID" source="preferred_internal_id@eq" />,
    ...mkReferenceInput('Species', 'species'),
    ...mkReferenceInput('Genus', 'genus'),
    ...mkReferenceInput('Family', 'family'),
    ...mkReferenceInput('Order', 'order'),
    ...mkReferenceInput('Class', 'class'),
    ...mkReferenceInput('Phylum', 'phylum'),
    ...mkReferenceInput('Kingdom', 'kingdom'),
]

const wrapper = (props) => (<Card style={{height: "100%", overflowY: "scroll"}}>{props.children}</Card>);

export const TaxaList = () => {
    const {
	isFetching,
    } = useListContext();
    
    return <List filters={filters}
		 component={ListWrapper}
		 sx={{width: "100%"}} >
	       { isFetching ?
		 <Box sx={{ display: 'flex',
			    justifyContent: 'center',
			    alignItems: 'center',
			    height: '100%'}}>
		     <CircularProgress/>
		 </Box> : 
		 <Datagrid>
		     <TextField source="internal_id" />
		     <TextField source="parent_internal_id" />
		     <TextField source="preferred_internal_id" />
		     <TextField source="name" />
		     <TextField source="rank" />
		     <TextField source="authority" />
		     <TextField source="language" />
		     <TextField source="source" />
		     <FunctionField label="Taxonomy"
				    render={t => ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'].map(col => t.name_paths[col+'_name']).join(' > ')} />
		 </Datagrid>
	       }
	   </List>
};
