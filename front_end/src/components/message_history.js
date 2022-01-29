import React, { useState, useEffect, useContext } from 'react';
import '../static/css/message_history.css';
// import Tweets from './tweets.js';
// import { closeModal } from '../static/js/utils.js';
import { formatDate } from '../static/js/utils.js';
import DefaultProfile from "../static/media/images/default-profile.jpg";
import { host, api } from "../static/js/config.js";
import TempProfile from '../static/media/images/profile.png';
import CrossIcon from '../static/media/icons/cross.svg';
import InfoIcon from '../static/media/icons/information.svg';
import Loading from './loading.js';
import { TokenContext } from '../context.js';
import aesFile from "../static/aes_key.txt";
import * as CryptoJS from 'crypto-js';

export default function MessageHistory({profile, setMessageHistoryModal}) {
    const [loading, setLoading]= useState(true);
    const token = useContext(TokenContext);
    const [messages, setMessages] = useState([
        // {
        //     "text": "text",
        //     "date": new Date(),
        //     "account_name": "Account Name",
        //     "account_image": null,
        //     "profile_username": "@username",
        //     "profile_image": null,
        // }
    ]);

    const loadMessageHistory = () => {
        setLoading(true);
        let url = `${api}/load_message_history`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                profile_id: profile.id
            })
        })
        .then(response => response.json())
        .then(result => {

            let tempMessages = [];

                fetch(aesFile)
                    .then(response => response.text())
                    .then(aesKey => {

                        tempMessages = result.map(item => {
                            console.log(item.text)
                            var key = CryptoJS.enc.Utf8.parse(aesKey);
                            
                            var decodedProfileUsername = atob(item.profile_username);
                            var iv = decodedProfileUsername.substring(0, 16);
                            var encryptedProfileUsername = decodedProfileUsername.substring(16);
            
                            encryptedProfileUsername = CryptoJS.enc.Latin1.parse(encryptedProfileUsername);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
            
                            var profileUsernameArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedProfileUsername },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );
                            
                            var decodedText = atob(item.text);
                            iv = decodedText.substring(0, 16);
                            var encryptedText = decodedText.substring(16);
            
                            encryptedText = CryptoJS.enc.Latin1.parse(encryptedText);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
            
                            var textArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedText },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );
                            
                            return Object.assign(item, {"profile_username": CryptoJS.enc.Latin1.stringify(profileUsernameArray), "text": CryptoJS.enc.Latin1.stringify(textArray)});
                        })

                        console.log(tempMessages);

                        setMessages(tempMessages);
                        setLoading(false);

                        // console.log("plain text : " + output_plaintext);
                    });
        })
    }

    useEffect(() => {
        loadMessageHistory();
    }, []);

    return (
        <div className="message__history__modal">
            <div className="message__history__background">
                <div>
                    <h2>Support Message History - @{profile?.username}</h2>
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => {setMessageHistoryModal(false);}} />
                </div>
                {!loading && messages.length > 0 ? <div className="message__history__content">
                    {messages.map(message =>
                        <div>
                            <p className="date">{formatDate(new Date(message.date))} - <span>{message.method}</span></p>
                            <div className="profile__container">
                                <img src={message.profile_image} alt="profile image" />
                                <div>
                                    <p className="username">@{message.profile_username}</p>
                                    <p className="role">As {message.role}</p>
                                </div>
                            </div>
                            <div className="message__container">
                                <div>
                                    {/* <div> */}
                                        {/* <p className="date">{formatDate(new Date(message.date))}</p> */}
                                        {/* <p>Direct Message</p> */}
                                        <p className="organisation__name">{message.organisation_name}</p>
                                    {/* </div> */}
                                    <div>
                                        {/* <p className="text">{message.text}</p> */}
                                        <p className="text" dangerouslySetInnerHTML={{__html: message.text.replace(/(^|[^@\w])@(\w{1,15})\b/g, match => "<b>" + match + "</b>")}} />
                                    </div>
                                </div>
                                <div>
                                    <img src={message.organisation_image ? `${host}/static/media/images/${message.organisation_image}` : DefaultProfile} alt="organisation image" />
                                </div>
                            </div>
                        </div>
                    )}
                </div> : !loading && messages.length === 0 ?
                <div className="message__history__content--empty">
                    <p>No messages were found.</p>
                </div> : 
                <div className="message__history__content--loading">
                    <Loading />
                </div>}
            </div>
        </div>
    );
}