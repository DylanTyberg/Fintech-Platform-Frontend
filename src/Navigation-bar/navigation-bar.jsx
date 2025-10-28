import {Link, Outlet} from "react-router-dom";
import { Fragment } from "react";
import "../Navigation-bar/navigation-bar.css"
const NavigationBar = () => {

    return (
        <Fragment >
            <div className="nav-bar">
                <div className="links">
                    <Link to="/">
                        Market
                    </Link>
                    
                    <Link to="/portfolio">
                        Portfolio
                    </Link>
                </div>
                <div className="sign-in-button">
                    <Link to="/sign-in">
                        Sign In
                    </Link>
                </div>
                    
            </div>
            <Outlet/>
        </Fragment>
    );
}

export default NavigationBar;