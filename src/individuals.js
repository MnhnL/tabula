import { Datagrid, List, TextField, TextInput } from 'react-admin';

const filters = [
    <TextInput label="Last Name" source="last_name@like" alwaysOn />
];

export const IndividualsList = () => (
    <List filters={filters}>
      <Datagrid>
        <TextField source="title" />
        <TextField source="first_name" />
        <TextField source="last_name" />
      </Datagrid>
    </List>
);
