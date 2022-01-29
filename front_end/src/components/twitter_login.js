import React, { useState, useEffect, useContext } from 'react';
import '../static/css/twitter_login.css';
import { useHistory } from 'react-router-dom';
// import Tweets from './tweets.js';
import { triggerTooltip, toggleFieldError } from '../static/js/utils.js';
import { api } from "../static/js/config.js";
import PopUp from "./pop_up.js";
import Loading from "./loading.js";
import TempProfile from '../static/media/images/profile.png';
import CrossIcon from '../static/media/icons/cross.svg';
import InfoIcon from '../static/media/icons/information.svg';
import { TokenContext } from '../context.js';
import aesFile from "../static/aes_key.txt";
import * as CryptoJS from 'crypto-js';

export default function SupportMessage({ requestToken, setTwitterLoginModal, twitterLoginURL, setToken, identity, setIdentity, loggedIn }) {
    const [popupMessage, setPopupMessage] = useState("");
    const [pinCode, setPinCode] = useState(null);
    const token = useContext(TokenContext);
    const history = useHistory();
    const [loading, setLoading] = useState(false);

    const twitterLogin = () => {
        setLoading(true);
        let url = `${api}/twitter_login`;
        fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                //  'Authorization': "Bearer " + auth,
            },
            body: JSON.stringify({
                pin: pinCode,
                twitter_id: identity.organisation_twitter_id,
                request_token: requestToken,
                id: identity.organisation_id,
                logged_in: loggedIn || null,
            })
        })
            .then(response => response.json())
            .then(result => {
                setLoading(false);
                if (!loggedIn) {
                    if (result.token) {
                        localStorage.setItem("token", result.token);
                        setToken(result.token);
                        history.push('/dashboard');
                        return;
                    }
                    if (result.error) {
                        setPopupMessage(result.error);
                        localStorage.removeItem("identity");
                        setIdentity(null);
                        return;
                    }
                } else {
                    if (result.error) {
                        setPopupMessage(result.error);
                    } else {
                        setPopupMessage(result.message);
                    }
                }
            });
    }

    return (
        <div id="twitterLogin" className="twitter__login__modal">
            <div className="twitter__login__background">
                <div>
                    <h2>Twitter Login</h2>
                    <p>
                        {loggedIn && "The feature was disabled because your organisation's Twitter account token has expired or became invalid. "}
                        Please redirect to this <a href={twitterLoginURL} target="_blank">link</a> and authorise the app to access your organisation Twitter's account.
                    </p>
                    <div>
                        {!loading ? <div>
                            <p>PIN Code:</p>
                            <input type="text" value={pinCode} onChange={event => setPinCode(event.target.value)} />
                        </div> :
                        <Loading />}
                        <div>
                            <button className="button" onClick={() => setPopupMessage("Authorised unsuccessful. The authorisation process was cancelled.")}>Cancel</button>
                            <button className="button" onClick={twitterLogin}>Submit</button>
                        </div>
                    </div>
                </div>
            </div>
            {popupMessage && <PopUp popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={setTwitterLoginModal} />}
        </div>
    );
}