// in src/MyLayout.js
import * as React from 'react';
import {
    Menu,
    Sidebar,
    useSidebarState,
    AppBar,
} from 'react-admin';
import { styled } from '@mui/material';

const Root = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    zIndex: 1,
    minHeight: "100vh",
    backgroundColor: theme.palette.background.default,
    position: "relative",
}));

const AppFrame = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    overflowX: "auto",
    height: "100vh",
}));

const ContentWithSidebar = styled("main")(({ theme }) => ({
    display: "flex",
    flexGrow: 1,
}));

const Content = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    flexGrow: 2,
    // padding: theme.spacing(3),
    marginTop: "2.9em",
    //paddingLeft: 5,
    height: "calc(100vh - 2.9em)",
}));

export const MyLayout = (props) => {
    const [open] = useSidebarState();

    return (
        <Root>
            <AppFrame>
		<AppBar open={props.open} />
		<ContentWithSidebar>
		    <Sidebar sx={{maxWidth: "10em"}}>
			<Menu style={{marginTop: 50}}
			      hasDashboard={!!props.dashboard} />
		    </Sidebar>
		    <Content>
			{props.children}
		    </Content>
		</ContentWithSidebar>
            </AppFrame>
        </Root>
    );
};
