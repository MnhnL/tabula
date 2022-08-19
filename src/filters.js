import { ReferenceInput, AutocompleteInput } from 'react-admin';

export function mkReferenceInput(label, col, alwaysOn=false) {
    return (
        <ReferenceInput label={label}
                        source={`${col}_name`}
                        reference="taxa"
                        filter={{taxon_rank: col}}
                        perPage={100}
                        alwaysOn={alwaysOn}>
          <AutocompleteInput label={label}
                             filterToQuery={searchText => ({[`${col}_name@ilike`]: searchText})}
                             optionText="taxon_name"
                             optionValue="taxon_name" />
        </ReferenceInput>
    );
}

