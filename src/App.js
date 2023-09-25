
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
	MuiButton: {
	    defaultProps: {
		size: 'small',
	    },
	},
	MuiFilledInput: {
	    defaultProps: {
		margin: 'dense',
	    },
	},
	MuiFormControl: {
	    defaultProps: {
		margin: 'dense',
	    },
	},
	MuiFormHelperText: {
	    defaultProps: {
		margin: 'dense',
	    },
	},
	MuiIconButton: {
	    defaultProps: {
		size: 'small',
	    },
	},
	MuiInputBase: {
	    defaultProps: {
		margin: 'dense',
	    },
	},	
	MuiInputLabel: {
	    defaultProps: {
		margin: 'dense',
	    },
	},
	MuiListItem: {
	    defaultProps: {
		dense: true,
	    },
	},
	MuiOutlinedInput: {
	    defaultProps: {
		margin: 'dense',
	    },
	},
	MuiFab: {
	    defaultProps: {
		size: 'small',
	    },
	},
	MuiTable: {
	    defaultProps: {
		size: 'small',
	    },
	},
    },
};

const initialState = {
    admin: { ui: { sidebarOpen: false, viewVersion: 0 } }
};

const fetchJson = (url, options) => {
    options['headers'] = new Headers({
	'Prefer': 'count=exact' // planned & exact
    });
    return fetchUtils.fetchJson(url, options);
}

const dp = dataProvider(process.env.REACT_APP_API_URL,
                        fetchJson,
                        'eq',
                        new Map([['rpc/observation_flat', ['internal_id']],
				 ['taxon_flat', ['internal_id']],
                                 ['individual', ['internal_id']]]));

function App() {
    return (
        <Admin title="MNHN Tabula - "
               layout={MyLayout}
	       theme={theme}
               initialState={initialState}
               dataProvider={dp}
               disableTelemetry>
          <Resource name="rpc/observation_flat"
                    list={ObservationList}
                    icon={SpaIcon}
                    options={{label: 'Observations'}} />
          <Resource name="taxon_flat"
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
