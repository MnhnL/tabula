import { Datagrid, List, TextField, TextInput } from 'react-admin';
import { Card } from '@mui/material';

import { ListWrapper } from './util.js'
import { mkReferenceInput } from './filters.js';

const filters = [
	<TextInput label="Key" source="key@eq" alwaysOn />,
	<TextInput label="Taxon Name" source="taxon_name@ilike" alwaysOn />,
	<TextInput label="Rank" source="taxon_rank@ilike" alwaysOn />,
	<TextInput label="Authority" source="authority@ilike" alwaysOn/>,

        <TextInput label="Parent Key" source="parent_key@eq" />,
        <TextInput label="Preferred Key" source="preferred_key@eq" />,
    ...mkReferenceInput('Species', 'spp'),
    ...mkReferenceInput('Genus', 'gen'),
    ...mkReferenceInput('Family', 'fam'),
    ...mkReferenceInput('Order', 'ord'),
    ...mkReferenceInput('Class', 'cla'),
    ...mkReferenceInput('Phylum', 'phyl'),
    ...mkReferenceInput('Kingdom', 'kng'),
]

const wrapper = (props) => (<Card style={{height: "100%", overflowY: "scroll"}}>{props.children}</Card>);

export const TaxaList = () => (
    <List filters={filters}
          component={ListWrapper}
          sx={{width: "100%"}} >
      <Datagrid>
        <TextField source="key" />
	<TextField source="parent_key" />
	<TextField source="preferred_key" />
        <TextField source="taxon_name" />
        <TextField source="taxon_rank" />
        <TextField source="authority" />
      </Datagrid>
    </List>
);
