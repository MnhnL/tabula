import { Datagrid, List, TextField, TextInput } from 'react-admin';
import { Card } from '@mui/material';

import { ListWrapper } from './util.js'
import { mkReferenceInput } from './filters.js';

const filters = [
	<TextInput label="Internal ID" source="internal_id@eq" alwaysOn />,
	<TextInput label="Taxon Name" source="taxon_name@ilike" alwaysOn />,
	<TextInput label="Rank" source="taxon_rank@ilike" alwaysOn />,
	<TextInput label="Authority" source="taxon_authority@ilike" alwaysOn/>,

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

export const TaxaList = () => (
    <List filters={filters}
          component={ListWrapper}
          sx={{width: "100%"}} >
      <Datagrid>
        <TextField source="internal_id" />
	<TextField source="parent_internal_id" />
	<TextField source="preferred_internal_id" />
        <TextField source="taxon_name" />
        <TextField source="taxon_rank" />
        <TextField source="taxon_authority" />
      </Datagrid>
    </List>
);
