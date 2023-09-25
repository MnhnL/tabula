import { Datagrid, List, TextField, TextInput } from 'react-admin';

import { ListWrapper } from './util.js'

const filters = [
	<TextInput label="Internal id" source="internal_id@eq" alwaysOn />,
	<TextInput label="Title" source="title@ilike" alwaysOn />,
	<TextInput label="Name" source="name@ilike" alwaysOn />,
    	<TextInput label="Source" source="source@eq" alwaysOn />,
];

export const IndividualsList = () => (
    <List filters={filters}
          component={ListWrapper}
          sx={{width: "100%"}} >
      <Datagrid>
        <TextField source="internal_id" />
        <TextField source="title" />
        <TextField source="name" />
	<TextField source="username" />
	<TextField source="source" />
      </Datagrid>
    </List>
);
