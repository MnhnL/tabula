import { Card } from '@mui/material';

export const ListWrapper = (props) => (<Card style={{height: "100%", overflowY: "scroll"}}>{props.children}</Card>);
