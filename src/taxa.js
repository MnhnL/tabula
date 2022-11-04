import { Datagrid, List, TextField, TextInput } from 'react-admin';

import { mkReferenceInput } from './filters.js';

const filters = [
    <TextInput label="Key" source="key@eq" alwaysOn />,
    <TextInput label="Taxon Name" source="taxon_name@ilike" alwaysOn />,
    <TextInput label="Rank" source="taxon_rank@ilike" alwaysOn />,
    <TextInput label="Authority" source="authority@ilike"/>,
    mkReferenceInput('Species', 'spp'),
    mkReferenceInput('Genus', 'gen'),
    mkReferenceInput('Family', 'fam'),
    mkReferenceInput('Order', 'ord'),
    mkReferenceInput('Class', 'cla'),
    mkReferenceInput('Phylum', 'phyl'),
    mkReferenceInput('Kingdom', 'kng'),
]

export const TaxaList = () => (
    <List filters={filters}>
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
