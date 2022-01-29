import React, { useState, useEffect, useContext } from 'react';
import '../static/css/support_message.css';
// import Tweets from './tweets.js';
import { triggerTooltip, toggleFieldError } from '../static/js/utils.js';
import { api } from "../static/js/config.js";
import PopUp from "./pop_up.js";
import Loading from "./loading.js";
import TwitterLogin from "./twitter_login.js";
import TempProfile from '../static/media/images/profile.png';
import CrossIcon from '../static/media/icons/cross.svg';
import InfoIcon from '../static/media/icons/information.svg';
import { TokenContext, IdentityContext } from '../context.js';
import aesFile from "../static/aes_key.txt";
import * as CryptoJS from 'crypto-js';

export default function SupportMessage({ incident, profile, setProfile, setSupportMessageModal, tweetID, setTweetID, loadProfiles, loadData, chosenFilter }) {
    const [closeModal, setCloseModal] = useState(false);
    const [closeBothModalStatus, setCloseBothModalStatus] = useState(false);
    const [refreshData, setRefreshData] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [modify, setModify] = useState(false);
    const [originalMessage, setOriginalMessage] = useState("");
    const [message, setMessage] = useState("");
    const token = useContext(TokenContext);
    const [twitterLoginModal, setTwitterLoginModal] = useState(false);
    const [twitterLoginURL, setTwitterLoginURL] = useState(null);
    const [requestToken, setRequestToken] = useState(null);
    const identity = useContext(IdentityContext);

    const closeBothModal = () => {
        setSupportMessageModal(false);
        setProfile(null);
    }

    const loadMessage = () => {
        let url = `${api}/load_message`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                role_id: profile.role_id,
                method: tweetID ? "reply tweet" : "direct message",
            })
        })
            .then(response => response.json())
            .then(result => {
                console.log(result)
                fetch(aesFile)
                    .then(response => response.text())
                    .then(aesKey => {
                        // console.log(result.message_text)
                        let encrypted_message = result.message_text;
                        var key = CryptoJS.enc.Utf8.parse(aesKey);

                        var decodedMessage = atob(encrypted_message);
                        var iv = decodedMessage.substring(0, 16);
                        var encryptedMessage = decodedMessage.substring(16);

                        encryptedMessage = CryptoJS.enc.Latin1.parse(encryptedMessage);
                        iv = CryptoJS.enc.Latin1.parse(iv);

                        var messageArray = CryptoJS.AES.decrypt(
                            { ciphertext: encryptedMessage },
                            key,
                            { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                        );
                        let decrypted_message = CryptoJS.enc.Latin1.stringify(messageArray);
                        setMessage(Object.assign(result, { "message_text": decrypted_message, 
                                    "encrypted_message": encrypted_message }));
                        setOriginalMessage(Object.assign(result, { "message_text": decrypted_message, 
                                    "encrypted_message": encrypted_message }));
                    })
            })
    }

    const validate = value => {
        let emptyValue = value.length === 0;
        let invalidInput = !value.match(/^[A-Za-z0-9-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/@#\s]+$/i);
        let invalidInputLength = value.length < 20 || value.length > (tweetID ? 280 : 800);

        if (emptyValue || invalidInput || invalidInputLength) {
            triggerTooltip("supportMessageTooltipText")
            return false;
        }

        return true;
    }

    const saveMessage = () => {
        // let url = `${api}/lol`;
        

        if (!validate(message.message_text)) return;

        let url = `${api}/save_message`;

        fetch(aesFile)
            .then(response => response.text())
            .then(aesKey => {
                let key = CryptoJS.enc.Utf8.parse(aesKey);
                let iv = CryptoJS.lib.WordArray.random(16);
                // let iv = CryptoJS.lib.WordArray.random("1234567890123456");
                // let iv = "1234567890123456";
                // iv = CryptoJS.enc.Latin1.parse(iv);
                let encryptedMessage = CryptoJS.AES.encrypt(
                    message.message_text,
                    // CryptoJS.enc.Base64.parse(message.message_text),
                    key,
                    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                );

                console.log(iv);

                // encryptedMessage = encryptedMessage.iv + encryptedMessage.ciphertext;
                // encryptedMessage = iv.clone().concat(encryptedMessage.ciphertext); 
                // console.log(iv.concat(encryptedMessage.ciphertext).toString());
                encryptedMessage = iv.concat(encryptedMessage.ciphertext).toString(CryptoJS.enc.Base64);
                // encryptedMessage = CryptoJS.enc.Base64.stringify(encryptedMessage);
                // CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encryptedMessage.iv + encryptedMessage.ciphertext))
                console.log(aesKey)

                console.log(encryptedMessage);

                // encryptedMessage = "cvyE5dk/dzNunOolRFOIbfPsG2OoQQGr0GDk3uEAaGquvm4l7pG2bUKN+PFCtIf8253Uti3TzgS7rYGjXmFXRcWOwwfybMR1s10JvpUZanY=";

                // encryptedMessage = atob("mtTxu4tdVaX+4WCvFD2hEQt92gmxXubRWl1r0QuyM00XzV4Say…/AyAeqORsb+wc9/BvMG9yHZWfA7PvxkF3PmoQfIzhE5IBAGM=");

                // encryptedMessage = atob(encryptedMessage)
                // console.log(encryptedMessage)

                // console.log(iv)

                // // key = CryptoJS.enc.Utf8.parse(aesKey);

                // iv = encryptedMessage.substring(0, 16);
                // var encryptedTwitterID = encryptedMessage.substring(16);

                // // let encryptedTwitterID = CryptoJS.enc.Latin1.parse(encryptedMessage);
                // encryptedTwitterID = CryptoJS.enc.Latin1.parse(encryptedTwitterID);
                // iv = CryptoJS.enc.Latin1.parse(iv); 

                // console.log(iv)

                // var twitterIDArray = CryptoJS.AES.decrypt(
                //     { ciphertext:  encryptedTwitterID },
                //     key,
                //     {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                // );
                // console.log(CryptoJS.enc.Latin1.stringify(twitterIDArray));
                fetch(url, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token,
                    },
                    body: JSON.stringify({
                        message_id: message.message_id,
                        // message_text: message.message_text,
                        encrypted_message: encryptedMessage,
                        method: tweetID ? "reply tweet" : "direct message",
                    })
                })
                    .then(response => response.json())
                    .then(result => {
                        setPopupMessage(result);
                        setModify(false);
                        setMessage(previousMessage => { return { ...previousMessage, "message_text": message.message_text, "encrypted_message": encryptedMessage} });
                        setOriginalMessage(previousMessage => { return { ...previousMessage, "message_text": message.message_text, "encrypted_message": encryptedMessage} });
                    })
            })


    }

    const replyTweet = () => {

        let url = `${api}/reply_tweet`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                profile_id: profile.id,
                profile_role: profile.role,
                profile_role_id: profile.role_id,
                tweet_id: tweetID,
                encrypted_message: message.encrypted_message,
                timestamp: Number(new Date()),
                incidents_association_id: incident.incidents_association_id,
                chosen_filter: chosenFilter,
                method: tweetID ? "reply tweet" : "direct message",
                cyberbullying_id: incident.cyberbullying_id,
            })
        })
            .then(response => response.json())
            .then(result => {
                if (result.twitter_login_required) {
                    setRequestToken(result.request_token);
                    setTwitterLoginURL(result.twitter_login_url);
                    setTwitterLoginModal(true);
                } else {
                    if (result.error) setRefreshData(true);
                    setCloseModal(true);
                    setPopupMessage(result.message);
                    loadProfiles();
                    if (result.close_profile) setCloseBothModalStatus(true);
                }
            })
    }

    const directMessage = () => {
        let url = `${api}/direct_message`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                profile_id: profile.id,
                profile_role: profile.role,
                profile_role_id: profile.role_id,
                profile_twitter_id: profile.twitter_id,
                // message: message.message_text,
                encrypted_message: message.encrypted_message,
                timestamp: Number(new Date()),
                method: tweetID ? "reply tweet" : "direct message",
                // incidents_association_id: incident.incidents_association_id,
                // message_id: message.message_id,
            })
        })
            .then(response => response.json())
            .then(result => {
                if (result.twitter_login_required) {
                    setRequestToken(result.request_token);
                    setTwitterLoginURL(result.twitter_login_url);
                    setTwitterLoginModal(true);
                } else {
                    if (result.error) setRefreshData(true);
                    loadProfiles();
                    if (result.close_profile) setCloseBothModalStatus(true);
                    setCloseModal(true);
                    setPopupMessage(result.message);
                    console.log(result)
                }
            })
    }

    useEffect(() => {
        loadMessage();

        return _ => setTweetID(null);
    }, []);

    return (
        <div id="supportMessage" className="support__message__modal">
            <div className="support__message__background">
                <div className="support__message__header">
                    <div>
                        <label>
                            <h2>Support Message - {tweetID ? "Reply Tweet" : "Direct Message"}</h2>
                            <div className="tooltip">
                                <img src={InfoIcon} alt="info icon" className="info__icon" />
                                <span id="supportMessageTooltipText" className="tooltiptext">
                                    <ul>
                                        <li>&#8226; More than 20 characters.</li>
                                        <li>&#8226; Less than {tweetID ? "280" : "800"} characters.</li>
                                        <li>&#8226; Letters, numerals and symbols.</li>
                                    </ul>
                                </span>
                            </div>
                        </label>
                    </div>
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => { setTweetID(null); setSupportMessageModal(false); }} />
                </div>
                <div>
                    <div className="message__content">
                        <textarea disabled={modify ? false : true} minLength="20" maxlength={tweetID ? "280" : "800"} value={message.message_text} onKeyPressCapture={event => {event.target.value.length === (tweetID ? 280 : 800) && triggerTooltip("supportMessageTooltipText")}} onChange={event =>  event.target.value.length > (tweetID ? 280 : 800) ? null : setMessage(previousMessage => { return { ...previousMessage, message_text: event.target.value } })} />
                        <p>{modify ? message.message_text?.length + (tweetID ? " / 280" : " / 800") : ""}</p>
                        {modify ?
                            <div>
                                <button onClick={() => {setModify(false); setMessage(previousMessage => { return { ...previousMessage, "message_text": originalMessage.message_text, "encrypted_message": originalMessage.encrypted_message} })}}>Cancel</button>
                                <button onClick={saveMessage}>Save</button>
                            </div> :
                            <div>
                                <button onClick={() => setModify(true)}>Modify</button>
                            </div>}
                    </div>
                    <div className="message__notice">
                        <div>
                            <img src={InfoIcon} alt="info icon" className="info__icon" />
                            <p>
                                The support message will be sent to the twitter user {tweetID ? "publicly" : "privately"}.
                            </p>
                        </div>
                        <div>
                            <img src={InfoIcon} alt="info icon" className="info__icon" />
                            <p>
                                Please ensure to formulate the message to be as caring and as least provocative as possible.
                            </p>
                        </div>
                        <div>
                            {!modify && <button onClick={tweetID ? replyTweet : directMessage}>Send</button>}
                        </div>
                    </div>
                </div>
            </div>
            {popupMessage && <PopUp popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={closeBothModalStatus ? closeBothModal : closeModal && setSupportMessageModal} loadData={refreshData && loadData} />}
            {twitterLoginModal && <TwitterLogin identity={identity} twitterLoginURL={twitterLoginURL} requestToken={requestToken} setTwitterLoginModal={setTwitterLoginModal} loggedIn={true} />}
        </div>
    );
}