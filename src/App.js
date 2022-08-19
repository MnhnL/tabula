import * as React from "react";
import { Admin, Resource, ListGuesser, fetchUtils } from 'react-admin';
import dataProvider from '@promitheus/ra-data-postgrest';

import './App.css';

import SpaIcon from '@mui/icons-material/Spa';
import PersonIcon from '@mui/icons-material/Person';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import { ObservationList } from './observations.js';
import { IndividualsList } from './individuals.js';
import { TaxaList } from './taxa.js';
import { MyLayout } from './MyLayout.js';

const initialState = {
    admin: { ui: { sidebarOpen: false, viewVersion: 0 } }
};

function App() {
    return (
        <Admin title="MNHN Tabula"
               layout={MyLayout}
               initialState={initialState}
               dataProvider={dataProvider('http://potato.hisnat.local:3000',
                                          fetchUtils.fetchJson,
                                          'eq',
                                          new Map([['observations_flat', ['external_id']],
                                                   ['individuals', ['name_key']],
                                                   ['taxa', ['taxon_list_item_key']]]))}
               disableTelemetry>
          <Resource name="observations_flat"
                    list={ObservationList}
                    icon={SpaIcon}
                    options={{label: 'Observations'}}/>
          <Resource name="taxa"
                    list={TaxaList}
                    icon={AccountTreeIcon}
                    options={{label: 'Taxa'}}/>
          <Resource name="individuals" list={IndividualsList}
                    icon={PersonIcon}/>
        </Admin>
    );
}

export default App;
