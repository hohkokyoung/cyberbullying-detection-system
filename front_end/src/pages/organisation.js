import React, { useState, useEffect, useContext } from 'react';
import '../static/css/organisation.css';
import ChangePassword from "../components/change_password.js";
import EditOrganisation from "../components/edit_organisation.js";
// import Tweets from './tweets.js';
// import { showModal } from '../static/js/utils.js';
import { host, api } from "../static/js/config.js";
import TempProfile from '../static/media/images/profile.jpg';
import DefaultProfile from "../static/media/images/default-profile.jpg";
import CrossIcon from '../static/media/icons/cross.svg';
import { TokenContext } from '../context.js';

export default function Organisation() {
    const [organisation, setOrganisation] = useState({
        image: "",
        name: "",
        // organisation: "",
        // title: "",
        phone_number: "",
        email_address: "",
    });
    const token = useContext(TokenContext);

    const loadOrganisation = () => {
        let url = `${api}/organisation`;
        fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
        })
        .then(response => response.json())
        .then(result => {
            // const tempRoles = ["cyberbully", "cybervictim"];
            // console.log(result)
            setOrganisation(result);
        });
    }

    useEffect(() => {
        loadOrganisation();
    }, []);

    const [changePasswordModal, setChangePasswordModal] = useState(false);
    const [editOrganisationModal, setEditOrganisationModal] = useState(false);

    return (
        <div className="organisation">
            <div className="organisation__header">
                <img src={organisation.image ? `${host}/static/media/images/${organisation.image}` : DefaultProfile} alt="organisation image" />
                <div>
                    <h3>{organisation.name}</h3>
                    <h4>{organisation.type}</h4>
                </div>
                <div className="organisation__actions">
                    <button onClick={() => setChangePasswordModal(true)}>Change Password</button>
                    <button onClick={() => setEditOrganisationModal(true)}>Edit Organisation</button>
                </div>
            </div>
            <div className="organisation__content">
                <div>
                    <p className="title">Phone Number</p>
                    <p className="value">{organisation.phone_number || "-"}</p>
                </div>
                <div>
                    <p className="title">Twitter Username</p>
                    <p className="value">@{organisation.twitter_username}</p>
                </div>
                <div>
                    <p className="title">Email Address</p>
                    <p className="value">{organisation.email_address || "-"}</p>
                </div>
                {/* <div>
                    <p className="title">Username</p>
                    <p className="value">peach</p>
                </div> */}
            </div>
            {changePasswordModal && <ChangePassword setChangePasswordModal={setChangePasswordModal} />}
            {editOrganisationModal && <EditOrganisation setEditOrganisationModal={setEditOrganisationModal} tempOrganisation={organisation} loadData={loadOrganisation} />}
            {/* <EditProfile /> */}
        </div>
    );
}