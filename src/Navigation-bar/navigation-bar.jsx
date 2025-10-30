import {Link, Outlet} from "react-router-dom";
import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import "../Navigation-bar/navigation-bar.css"
const NavigationBar = () => {

    const location = useLocation();
    return (
        <Fragment >
            <div className="nav-bar">
                <div className="links">
                    <Link className={!location.pathname.startsWith("/portfolio") ? "navbar-link-active" : "navbar-link"} to="/">
                        Market
                    </Link>
                    
                    <Link className={location.pathname.startsWith("/portfolio") ? "navbar-link-active" : "navbar-link"} to="/portfolio">
                        Portfolio
                    </Link>
                    <Link className={"navbar-link-sign-in"} to="/sign-in">
                        Log In
                    </Link>
                    <Link className={"navbar-link-sign-up"} to="/sign-up">
                        Sign Up
                    </Link>
                </div>
                    
            </div>
            <Outlet/>
        </Fragment>
    );
}

export default NavigationBar;