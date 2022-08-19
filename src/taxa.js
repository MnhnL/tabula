import { Datagrid, List, TextField, TextInput } from 'react-admin';

import { mkReferenceInput } from './filters.js';

const filters = [
    <TextInput label="ListItemKey" source="taxon_list_item_key@eq" alwaysOn />,
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
        <TextField source="taxon_list_item_key" />
        <TextField source="taxon_name" />
        <TextField source="taxon_rank" />
        <TextField source="authority" />
        <TextField source="synonym_of" />
        <TextField label="Species " source="spp_name" />
        <TextField label="Genus" source="gen_name" />
        <TextField label="Family" source="fam_name" />
        <TextField label="Order" source="ord_name" />
        <TextField label="Class" source="cla_name" />
        <TextField label="Phylum" source="phyl_name" />
        <TextField label="Kingdom" source="kng_name" />
      </Datagrid>
    </List>
);
