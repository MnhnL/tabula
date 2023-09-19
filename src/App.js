
import * as React from "react";
import { Admin, Resource, fetchUtils, defaultTheme } from 'react-admin';

import dataProvider from '@promitheus/ra-data-postgrest';

import './App.css';

import SpaIcon from '@mui/icons-material/Spa';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import { ObservationList } from './observations.js';
import { IndividualsList } from './individuals.js';
import { TaxaList } from './taxa.js';
import { MyLayout } from './MyLayout.js';

const theme = {
    ...defaultTheme,
    spacing: 2,
    components: {
	...defaultTheme.components,
	// MuiButton: {
	//     defaultProps: {
	// 	size: 'small',
	//     },
	// },
	// MuiFilledInput: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },
	// MuiFormControl: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },
	// MuiFormHelperText: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },
	// MuiIconButton: {
	//     defaultProps: {
	// 	size: 'small',
	//     },
	// },
	// MuiInputBase: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },	
	// MuiInputLabel: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },
	// MuiListItem: {
	//     defaultProps: {
	// 	dense: true,
	//     },
	// },
	// MuiOutlinedInput: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },
	// MuiFab: {
	//     defaultProps: {
	// 	size: 'small',
	//     },
	// },
	// MuiTable: {
	//     defaultProps: {
	// 	size: 'small',
	//     },
	// },
	// MuiTextField: {
	//     defaultProps: {
	// 	margin: 'dense',
	//     },
	// },
	// MuiToolbar: {
	//     defaultProps: {
	// 	variant: 'dense',
	//     },
	// },
    },
};

const initialState = {
    admin: { ui: { sidebarOpen: false, viewVersion: 0 } }
};

function App() {
    return (
        <Admin title="MNHN Tabula - "
               layout={MyLayout}
	       theme={theme}
               initialState={initialState}
               dataProvider={dataProvider(process.env.REACT_APP_API_URL,
                                          fetchUtils.fetchJson,
                                          'eq',
                                          new Map([['observation_flat', ['internal_id']],
                                                   ['individual', ['name_key']],
                                                   ['taxon', ['key']]]))}
               disableTelemetry>
          <Resource name="observation_flat"
                    list={ObservationList}
                    icon={SpaIcon}
                    options={{label: 'Observations'}} />
          <Resource name="taxon"
                    list={TaxaList}
                    icon={AccountTreeIcon}
                    options={{label: 'Taxa'}} />
          <Resource name="individual"
		    list={IndividualsList}
                    icon={PersonIcon} />
        </Admin>
    );
}

export default App;
