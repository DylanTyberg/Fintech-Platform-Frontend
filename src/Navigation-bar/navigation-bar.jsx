import {Link, Outlet} from "react-router-dom";
import { Fragment } from "react";
import { useLocation } from "react-router-dom";
import "../Navigation-bar/navigation-bar.css"
import { useUser } from "../Contexts/UserContext";
import {signOut} from 'aws-amplify/auth';

const NavigationBar = () => {
    const {state, dispatch} = useUser();

    const location = useLocation();

    const handleSignOut = async (e) => {
        e.preventDefault();
        await signOut();
        dispatch({type: "LOGOUT"})
    }
    return (
        <Fragment >
            <div className="nav-bar">
                <div className="nav-spacer"></div>
                <div className="links">
                    <Link className={!location.pathname.startsWith("/portfolio") ? "navbar-link-active" : "navbar-link"} to="/">
                        Market
                    </Link>
                    
                    <Link className={location.pathname.startsWith("/portfolio") ? "navbar-link-active" : "navbar-link"} to="/portfolio">
                        Portfolio
                    </Link>

                </div>
                <div className="sign-in-button">
                    {!state.user && <Link className={"navbar-link-sign-in"} to="/sign-in">
                        Sign In
                    </Link>}
                    {state.user && <Link className={"navbar-link-sign-in"} onClick={handleSignOut} to="#">
                        Sign Out
                    </Link>}
                    {!state.user && <Link className={"navbar-link-sign-up"} to="/sign-up">
                        Sign Up
                    </Link>}
                </div>
                    
            </div>
            <Outlet/>
        </Fragment>
    );
}

export default NavigationBar;