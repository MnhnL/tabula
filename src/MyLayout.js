// in src/MyLayout.js
import * as React from 'react';
import { useEffect } from 'react';
import { useGetList } from 'react-admin';
import PropTypes from 'prop-types';
import { styled } from '@mui/material';
import {
    AppBar,
    Menu,
    Sidebar,
    ComponentPropType,
    useSidebarState,
} from 'react-admin';

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
}));

export const MyLayout = ({
    children,
    dashboard,
    title,
}) => {
    const [open] = useSidebarState();

    return (
        <Root>
          <AppFrame>
            <AppBar title={title}
                    open={open} />
            <ContentWithSidebar>
              <Sidebar>
                <Menu style={{marginTop: 50}} hasDashboard={!!dashboard} />
              </Sidebar>
              <Content>
                {children}
              </Content>
            </ContentWithSidebar>
          </AppFrame>
        </Root>
    );
};

MyLayout.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    dashboard: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.string,
    ]),
    title: PropTypes.string.isRequired,
};
