import React, { useState, useEffect, useContext } from 'react';
import '../static/css/profile_detail.css';
// import Tweets from './tweets.js';
import { formatDate } from '../static/js/utils.js';
import { api } from "../static/js/config.js";
import SupportMessage from "./support_message.js";
import MessageHistory from "./message_history.js";
import Popup from "./pop_up.js";
import Loading from "./loading.js";
import TempProfile from '../static/media/images/profile.png';
import CrossIcon from '../static/media/icons/cross.svg';
import { TokenContext } from '../context.js';
import aesFile from "../static/aes_key.txt";
import * as CryptoJS from 'crypto-js';

export default function ProfileDetail({profile, setProfile, loadProfiles}) {
    // const [profileState, setProfileState] = useState(profile);
    const [loading, setLoading] = useState(true);
    const [chosenFilter, setChosenFilter] = useState("");
    const [filter, setFilter] = useState([]);
    const [closeModal, setCloseModal] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [incident, setIncident] = useState(null);
    const [tweetID, setTweetID] = useState(null);
    const [supportMessageModal, setSupportMessageModal] = useState(false);
    const [messageHistoryModal, setMessageHistoryModal] = useState(false);
    const [incidents, setIncidents] = useState();
    const token = useContext(TokenContext);

    // useEffect(() => {
    //     // setNumber(number);
    //     // console.log(number + "xD");
    // }, [profile]);

    const closeBothModal = () => {
        setSupportMessageModal(false);
        setProfile(null);
    }

    const loadIncidents = event => {
        setLoading(true);
        let url = `${api}/incidents`;
        let filter = event ? event.target.value : profile?.role === "cyberbully" ? "cyberbully" : "cybervictim"
        setChosenFilter(filter);
        fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                profile_id: profile?.id,
                // profile_role: profile?.role,
                filter: filter,
            })
        })
            .then(response => response.json())
            .then(result => {
                // const tempRoles = ["cyberbully", "cybervictim"];
                // console.log(result)
                // setIncidents(result)
                let tempIncidents = [];

                fetch(aesFile)
                    .then(response => response.text())
                    .then(aesKey => {

                        tempIncidents = result.map(item => {
                            //twitter_id
                            //cyberbully_username
                            //cyberbullying_message
                            //replied_username
                            //replied_message

                            console.log(item)
                            var key = CryptoJS.enc.Utf8.parse(aesKey);
                            
                            var decodedTwitterID = atob(item.twitter_id);
                            var iv = decodedTwitterID.substring(0, 16);
                            var encryptedTwitterID = decodedTwitterID.substring(16);
            
                            encryptedTwitterID = CryptoJS.enc.Latin1.parse(encryptedTwitterID);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
            
                            var twitterIDArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedTwitterID },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );

                            var decodedCyberbullyUsername = atob(item.cyberbully_username);
                            iv = decodedCyberbullyUsername.substring(0, 16);
                            var encryptedCyberbullyUsername = decodedCyberbullyUsername.substring(16);
            
                            encryptedCyberbullyUsername = CryptoJS.enc.Latin1.parse(encryptedCyberbullyUsername);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
            
                            var cyberbullyUsernameArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedCyberbullyUsername },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );

                            var decodedCyberbullyingMessage = atob(item.cyberbullying_message);
                            iv = decodedCyberbullyingMessage.substring(0, 16);
                            var encryptedCyberbullyingMessage = decodedCyberbullyingMessage.substring(16);
            
                            encryptedCyberbullyingMessage = CryptoJS.enc.Latin1.parse(encryptedCyberbullyingMessage);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
            
                            var cyberbullyingMessageArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedCyberbullyingMessage },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );
                             
                            let decryptedObjects = {
                                "twitter_id": CryptoJS.enc.Latin1.stringify(twitterIDArray), 
                                "cyberbully_username": CryptoJS.enc.Latin1.stringify(cyberbullyUsernameArray),
                                "cyberbullying_message": CryptoJS.enc.Latin1.stringify(cyberbullyingMessageArray),       
                            }

                            if (item.replied_username) {
                                var decodedRepliedUsername = atob(item.replied_username);
                                iv = decodedRepliedUsername.substring(0, 16);
                                var encryptedRepliedUsername = decodedRepliedUsername.substring(16);
                
                                encryptedRepliedUsername = CryptoJS.enc.Latin1.parse(encryptedRepliedUsername);
                                iv = CryptoJS.enc.Latin1.parse(iv); 
                
                                var repliedUsernameArray = CryptoJS.AES.decrypt(
                                    { ciphertext:  encryptedRepliedUsername },
                                    key,
                                    {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                                );
    
                                var decodedRepliedMessage = atob(item.replied_message);
                                iv = decodedRepliedMessage.substring(0, 16);
                                var encryptedRepliedMessage = decodedRepliedMessage.substring(16);
                
                                encryptedRepliedMessage = CryptoJS.enc.Latin1.parse(encryptedRepliedMessage);
                                iv = CryptoJS.enc.Latin1.parse(iv); 
                
                                var repliedMessageArray = CryptoJS.AES.decrypt(
                                    { ciphertext:  encryptedRepliedMessage },
                                    key,
                                    {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                                );

                                decryptedObjects = Object.assign(decryptedObjects, {
                                    "replied_username": CryptoJS.enc.Latin1.stringify(repliedUsernameArray),
                                    "replied_message": CryptoJS.enc.Latin1.stringify(repliedMessageArray),
                                })
    
                            }

                           

                            // var decodedUsername = atob(item.username);
                            // iv = decodedUsername.substring(0, 16);
                            // var encryptedUsername = decodedUsername.substring(16);
            
                            // encryptedUsername = CryptoJS.enc.Latin1.parse(encryptedUsername);
                            // iv = CryptoJS.enc.Latin1.parse(iv); 
                            // // var key = CryptoJS.enc.Utf8.parse(aesKey);
            
                            // var usernameArray = CryptoJS.AES.decrypt(
                            //     { ciphertext:  encryptedUsername },
                            //     key,
                            //     {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            // );
                        
                            // // Can be Utf8 too
                            // // var output_plaintext = CryptoJS.enc.Latin1.stringify(twitterIDArray);

                            // return Object.assign(item, {"twitter_id": CryptoJS.enc.Latin1.stringify(twitterIDArray), "username": CryptoJS.enc.Latin1.stringify(usernameArray)})
                            
                            return Object.assign(item, decryptedObjects);
                        })

                        console.log(tempIncidents);

                        setIncidents(tempIncidents);
                        setLoading(false);

                        // console.log("plain text : " + output_plaintext);
                    });
            });
    }

    const removeIncident = (incidents_association_id, cyberbullying_id) => {
        let url = `${api}/remove_incident`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                incidents_association_id: incidents_association_id,
                profile_id: profile?.id,
                profile_role: profile?.role,
                chosen_filter: chosenFilter,
                cyberbullying_id: cyberbullying_id,
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result)
            setPopupMessage(result.success);
            if (result.refresh_profile) loadProfiles();
            if (result.close_profile) setCloseModal(true);
        })
    }

    const updateNotifications = event => {
        let url = `${api}/update_notifications`;
        let filter = event ? event.target.value : profile?.role === "cyberbully" ? "cyberbully" : "cybervictim"
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                // incidents_association_id: incidents_association_id,
                incidents: incidents,
                profile_id: profile?.id,
                // profile_role: profile?.role,
                chosen_filter: filter,
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result)
            loadProfiles();
        })
    }

    useEffect(() => {
        loadIncidents();
        loadFilter();
        updateNotifications();
        // decryptAES();
    }, []);

    useEffect(() => {
        loadFilter();
    }, [profile?.role]);

    const test = () => {
        return {__html: 'First &middot; Second'};
    }

    // useEffect(() => {
    //     if (incidents?.length > 0 && document.getElementsByClassName("message")?.length > 0) {
    //         console.log("hehe")
    //         document.getElementsByClassName("message").map(test => console.log('hoho'))
            
            
    //     }
    // }, [incidents]);

    // const formatDate = date => {
    //     return date.getUTCFullYear() + " " + months[date.getUTCMonth()] + " " + date.getUTCDate() + ", " + date.getUTCHours() + ":" + ((date.getMinutes() < 10 ? "0" : "") + date.getMinutes()) + " " + (date.getUTCHours() >= 12 ? "PM" : "AM")
    // }

    const loadFilter = () => {
        let tempFilter = [];
        // profile?.role === "cyberbully-victim" && tempFilter.append("");
        if (profile?.role.includes("cyberbully")) { tempFilter.push("cyberbully") }
        if (profile?.role.includes("victim")) { tempFilter.push("cybervictim") }
        setFilter(tempFilter);
    }

    // const buildFilters = () => {
    //     let role = profile?.role;
    //     let cyberbullyFilter = <label>Cyberbully
    //                                 <input type="radio" name="options" value="cyberbully" defaultChecked onClick={loadIncidents} />
    //                                 <span></span>
    //                             </label>

    //     let cybervictimFilter = <label>Cybervictim
    //                                 <input type="radio" name="options" value="cybervictim" defaultChecked onClick={loadIncidents} />
    //                                 <span></span>
    //                             </label>

    //     return role === "cyberbully" 
    //         ? <div>{cyberbullyFilter}</div> : role === "cybervictim" 
    //         ? <div>{cybervictimFilter}</div> : <div>{cyberbullyFilter}{cybervictimFilter}</div>
    // }

    return (
        <div id="profileModal" className="profile__detail__modal">
            <div className="profile__detail__background">
                <div className="profile__detail__header">
                    <div>
                        {/* <img src={TempProfile} alt="profile icon" /> */}
                        <img src={profile?.image} alt="profile icon" />
                        <div>
                            <h2>
                                @{profile?.username}
                            </h2>
                            {/* <h2>Hoh Kok Young<span></span></h2> */}
                            {/* <p>Cyberbully</p> */}
                            <div>
                                <p>{profile?.role === "both" ? "Cyberbully & Cybervictim" : profile?.role}</p>
                                <p>{profile?.role !== "cybervictim" && <span className={`profile__icon--${profile?.toxicity}`}></span>}
                                {profile?.role !== "cybervictim" && <span>{profile?.toxicity} Toxicty</span>}</p>
                                <p>Support Status: {profile?.support_status}</p>
                            </div>
                        </div>
                    </div> 
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => setProfile(null)} />
                </div>
                <div className="profile__detail__content__filters">
                    <h3>{incidents?.length} Incidents</h3>
                    {/* {buildFilters()} */}
                    <div>
                    {filter.map(item => 
                        <div>
                            <label>
                                {item}
                                <input type="radio" name="options" value={item.toLowerCase()} checked={chosenFilter === item} onClick={event => {if (chosenFilter !== item) { loadIncidents(event); (profile?.cyberbully_notification > 0 || profile?.cybervictim_notification > 0) && updateNotifications(event);} }} />
                                <span></span>
                            </label>
                            <div className="notifications">
                                {item === "cyberbully" && profile?.cyberbully_notification > 0 && <p className="cyberbully">{profile.cyberbully_notification}</p>}
                                {item === "cybervictim" && profile?.cybervictim_notification > 0 && <p className="cybervictim">{profile.cybervictim_notification}</p>}
                            </div>
                        </div>
                    )}
                    </div>
                </div>
                <div className="profile__detail__content">
                    <div className="incidents__messages">
                        {!loading ? incidents?.map(incident => {
                        let replied_date = new Date(incident.replied_date)
                        let cyberbullying_date = new Date(incident.cyberbullying_date);
                        return <div className="incident__messages">
                            {incident.replied_date &&
                            <div className="incident__message">
                                <img src={incident.replied_image} alt="profile icon" className="image" />
                                <div>
                                    <p className="date">{formatDate(replied_date)}</p>
                                    <p className="username">@{incident.replied_username}</p>
                                    {/* <p className="message">{incident.replied_message}</p> */}
                                    <div className="message"><p dangerouslySetInnerHTML={{__html: incident.replied_message.replace(/(^|[^@\w])@(\w{1,15})\b/g, match => "<span class='tag'>" + match + "</span>")}} /></div>
                                </div>
                            </div>}
                            {incident.replied_date && <div className="divider"></div>}
                            <div className="incident__message">
                                <img src={incident.cyberbully_image} alt="profile icon" className="image" />
                                <div>
                                    <p className="date">{formatDate(cyberbullying_date)}</p>
                                    <p className="username">@{incident.cyberbully_username}</p>
                                    <div className="message"><p dangerouslySetInnerHTML={{__html: incident.cyberbullying_message.replace(/(^|[^@\w])@(\w{1,15})\b/g, match => "<span class='tag " + ((chosenFilter === 'cybervictim' && '@' + profile?.username === match) ? 'tag--profile' : null) + "'>" + match + "</span>")}} /></div>
                                </div>
                                <div className="actions">
                                    <button onClick={() => {setIncident(incident); setTweetID(incident.twitter_id); setSupportMessageModal(true);}}>Reply Tweet</button>
                                    <button onClick={() => removeIncident(incident.incidents_association_id, incident.cyberbullying_id)}>Not Cyberbullying</button>
                                </div>
                            </div>
                        </div>}) :
                        <div className="profile__detail__content--loading">
                            <Loading />
                        </div>}
                    </div>
                    
                    {/* <div className="profile__modal__content"> */}
                        {/* <div className="profile__modal"> */}
                            {/* <div>
                                <p className="modal__time">2021-02-21 11:00p.m.</p>
                                <p className="modal__message">What a fucking noob.</p>
                            </div>
                            <button>Not Cyberbullying</button> */}
                        {/* </div> */}
                    {/* </div> */}
                </div>
                <div className="profile__detail__actions">
                    <button onClick={() => setMessageHistoryModal(true)}>Message History</button>
                    <button onClick={() => setSupportMessageModal(true)}>Direct Message (DM)</button>
                </div>
            </div>
            {supportMessageModal && <SupportMessage incident={incident} tweetID={tweetID} setTweetID={setTweetID} profile={profile} setProfile={setProfile} setSupportMessageModal={setSupportMessageModal} loadProfiles={loadProfiles} loadData={loadIncidents} chosenFilter={chosenFilter} />}
            {messageHistoryModal && <MessageHistory profile={profile} setMessageHistoryModal={setMessageHistoryModal} />}
            {popupMessage && <Popup popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={closeModal ? closeBothModal : setSupportMessageModal} loadData={loadIncidents} />}
        </div>
    );
}