import { Route, BrowserRouter } from 'react-router-dom';
import React from 'react';

import Home from './pages/home';
import CreatePoint from './pages/Create-point';

const Routes = () => {
    return(
        <BrowserRouter>
            <Route exact path={"/"} component={Home}/>
            <Route exact path={"/cadastro"} component={CreatePoint}/>
        </BrowserRouter>
    );
}

export default Routes;