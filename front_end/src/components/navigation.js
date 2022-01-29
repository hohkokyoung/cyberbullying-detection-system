import React, { useState, useEffect, useContext } from 'react';
import { Route, Link, Switch, Redirect, useHistory } from 'react-router-dom'
import Dashboard from '../pages/dashboard.js';
import Profile from '../pages/profile.js';
import Organisation from '../pages/organisation.js';
import Management from '../pages/management.js';
import '../static/css/navigation.css';
import DashboardIcon from '../static/media/icons/dashboard.svg';
import TwitterIcon from '../static/media/icons/twitter.svg';
import AccountIcon from '../static/media/icons/user.svg';
import ManagementIcon from '../static/media/icons/management.svg';
import LogoutIcon from '../static/media/icons/logout.svg';
import { api } from "../static/js/config.js";
import { TokenContext, IdentityContext } from '../context.js';

export default function Navigation({setToken, setIdentity}) {
    const history = useHistory();
    const [navigationID, setNavigationID] = useState("navigationDashboard");
    const toggleNavigation = () => {
        const tempIDs = ["navigationDashboard", "navigationProfile", "navigationOrganisation", "navigationManagement"];
        tempIDs.forEach(tempID => {
            tempID === navigationID
            ? document.querySelector("#" + tempID + " li")?.classList?.add("navigation--selected") 
            : document.querySelector("#" + tempID + " li")?.classList?.remove("navigation--selected");
        });
    }
    const [notifications, setNotifications] = useState({
        "cyberbully_notification": "",
        "cybervictim_notification": "",
    });
    const identity = useContext(IdentityContext);
    const token = useContext(TokenContext);

    useEffect(() => {
        loadNotifications();
        setNavigationID(localStorage.getItem("navigationID") ? localStorage.getItem("navigationID") : "navigationDashboard");
        var interval = setInterval(loadNotifications, 300000);
        
        // setToken(null);
        // localStorage.removeItem("token");

        return _ => clearInterval(interval);

      }, []);

    useEffect(() => {
        toggleNavigation();
    }, [navigationID]);

    const handleNavigationChange = navigationID => {
        console.log(notifications)
        localStorage.setItem("navigationID", navigationID);
        setNavigationID(navigationID);
    }

    const loadNotifications = () => {
        let url = `${api}/load_notifications`;
        fetch(url, {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
        })
        .then(response => response.json())
        .then(result => {
            console.log(result)
            setNotifications(result);
        })
    }

    return (
        <div className="navigation">
            <div className="navigation__bar">
                <ul>
                    {/* <div className="navigation__link" id="navigationDashboard" onClick={test}> */}
                        <Link to="/dashboard" id="navigationDashboard" className="navigation__link" onClick={() => handleNavigationChange("navigationDashboard")}>
                            <li>
                                <img src={DashboardIcon} className="navigation__icon" />
                                Dashboard
                            </li>
                        </Link>
                    {/* </div> */}
                    <Link to="/profile" id="navigationProfile" className="navigation__link" onClick={() => handleNavigationChange("navigationProfile")}>
                        <li>
                            <img src={TwitterIcon} className="navigation__icon" />
                            Twitter Profiles
                        </li>
                        <div className="notifications">
                            {notifications?.cyberbully_notification > 0 && <p className="cyberbully">{notifications.cyberbully_notification}</p>}
                            {notifications?.cybervictim_notification > 0 && <p className="cybervictim">{notifications.cybervictim_notification}</p>}
                        </div>
                    </Link>
                    <Link to="/organisation" id="navigationOrganisation" className="navigation__link" onClick={() => handleNavigationChange("navigationOrganisation")}>
                        <li>
                            <img src={AccountIcon} className="navigation__icon" />
                            Own Organisation
                        </li>
                    </Link>
                    {identity?.organisation_type === "government" && <Link to="/management" id="navigationManagement" className="navigation__link" onClick={() => handleNavigationChange("navigationManagement")}>
                        <li>
                            <img src={ManagementIcon} className="navigation__icon" />
                            Management
                        </li>
                    </Link>}
                    <Link to="/" className="navigation__link" onClick={() => {localStorage.setItem("navigationID", "navigationDashboard"); setToken(null); localStorage.removeItem("token"); setIdentity(null); localStorage.removeItem("identity")}}>
                        <li>
                            <img src={LogoutIcon} className="navigation__icon" />
                            Logout
                        </li>
                    </Link>
                </ul>
            </div>
            <div className="content">
                <Switch>
                    <Route exact path ="/dashboard" component={Dashboard} />
                    <Route path="/profile" render={props => <Profile loadNotifications={loadNotifications} />} />
                    <Route path="/organisation" component={Organisation} />
                    {identity?.organisation_type === "government" && <Route path="/management" component={Management} />}
                    <Redirect to='/dashboard' />
                </Switch>
            </div>
        </div>
    )
}