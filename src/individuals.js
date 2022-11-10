import { Datagrid, List, TextField, TextInput } from 'react-admin';

import { ListWrapper } from './util.js'

const filters = [
	<TextInput label="Name key" source="name_key@like" alwaysOn />,
	<TextInput label="Title" source="title@like" alwaysOn />,
	<TextInput label="First Name" source="first_name@like" alwaysOn />,
	<TextInput label="Last Name" source="last_name@like" alwaysOn />,
];

export const IndividualsList = () => (
    <List filters={filters}
          component={ListWrapper}
          sx={{width: "100%"}} >
      <Datagrid>
        <TextField source="name_key" />
        <TextField source="title" />
        <TextField source="first_name" />
        <TextField source="last_name" />
      </Datagrid>
    </List>
);
