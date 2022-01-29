import React, { useState, useEffect, useContext } from "react";
import ReactPaginate from 'react-paginate';
import "../static/css/profile.css";
import { toggleSearch, toggleFilter } from "../static/js/utils.js";
import ProfileDetail from "../components/profile_detail.js";
import PopUp from "../components/pop_up.js";
import Loading from "../components/loading.js";
import DefaultProfile from "../static/media/images/default-profile.jpg";
import SearchIcon from "../static/media/icons/search.svg";
import ArrowIcon from "../static/media/icons/arrow.svg";
import TickIcon from "../static/media/icons/tick.svg";
import CrossIcon from "../static/media/icons/cross.svg";
import { api } from "../static/js/config.js";
import { TokenContext } from '../context.js';
import aesFile from "../static/aes_key.txt";
import * as CryptoJS from 'crypto-js';

export default function Profile({loadNotifications}) {
    const [loading, setLoading] = useState(true);
    const [popupMessage, setPopupMessage] = useState("");
    const [search, setSearch] = useState("");
    const [pageNumber, setPageNumber] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [filter, setFilter] = useState({
        "supports": ["not yet", "offered", "offered yet continues"],
        "roles": ["cyberbully", "cybervictim", "cyberbully-victim"],
        "toxicity": ["low", "medium", "high"],
    });
    const [toxicity, setToxicity] = useState(["none", "low", "medium", "high"]);
    const [roles, setRoles] = useState(["cyberbully", "cybervictim", "cyberbully-victim"]);
    const [profile, setProfile] = useState();
    const [profiles, setProfiles] = useState([
    // {
    //     "id": 1,
    //     "username": "Hoh Kok Young",
    //     "cyberbullying": 20,
    //     "toxicity": "high",
    // },
    // {
    //     "id": 2,
    //     "username": "Elijah Woo",
    //     "cyberbullying": 10,
    //     "toxicity": "medium",
    // },
    // {
    //     "id": 3,
    //     "username": "Pewdiepie",
    //     "cyberbullying": 2,
    //     "toxicity": "low",
    // }
    ]);
    const token = useContext(TokenContext);

    const loadProfiles = () => {
        setLoading(true);
        let url = `${api}/profiles`;
        fetch(url, {
            method: (search || filter) ? 'POST' : 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: (search || filter) ? JSON.stringify({
                search: search,
                filter: filter,
                page_number: pageNumber,
            }) : null 
        })
            .then(response => response.json())
            .then(result => {
                // const tempRoles = ["cyberbully", "cybervictim"];
                // let tempProfiles = [];
                // result.map(element => tempProfiles.push({
                //     "id": element.id,
                //     "twitterID": element.twitter_id,
                //     "username": "@" + element.username,
                //     "image": element.image,
                //     "role": element.role,
                //     // "incidents": element.incidents,
                //     "totalIncidents": element.total_incidents,
                //     "toxicity": element.total_incidents_past_month >= 20 ? "high" : element.total_incidents_past_month >= 10 ? "medium" : element.total_incidents_past_month > 0 ? "low" : "none",
                // }));

                let tempProfiles = [];

                fetch(aesFile)
                    .then(response => response.text())
                    .then(aesKey => {

                        tempProfiles = result.map(item => {
                            var decodedTwitterID = atob(item.twitter_id);
                            var iv = decodedTwitterID.substring(0, 16);
                            var encryptedTwitterID = decodedTwitterID.substring(16);
            
                            encryptedTwitterID = CryptoJS.enc.Latin1.parse(encryptedTwitterID);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
                            var key = CryptoJS.enc.Utf8.parse(aesKey);
            
                            var twitterIDArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedTwitterID },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );

                            var decodedUsername = atob(item.username);
                            iv = decodedUsername.substring(0, 16);
                            var encryptedUsername = decodedUsername.substring(16);
            
                            encryptedUsername = CryptoJS.enc.Latin1.parse(encryptedUsername);
                            iv = CryptoJS.enc.Latin1.parse(iv); 
                            // var key = CryptoJS.enc.Utf8.parse(aesKey);
            
                            var usernameArray = CryptoJS.AES.decrypt(
                                { ciphertext:  encryptedUsername },
                                key,
                                {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                            );
                        
                            // Can be Utf8 too
                            // var output_plaintext = CryptoJS.enc.Latin1.stringify(twitterIDArray);

                            return Object.assign(item, {"twitter_id": CryptoJS.enc.Latin1.stringify(twitterIDArray), "username": CryptoJS.enc.Latin1.stringify(usernameArray)})
                        })

                        console.log(tempProfiles)
                        setProfiles(tempProfiles);

                        if (result[0]) {
                            setPageCount(result[0].page_count);
                        } else {
                            setPageCount(1)
                            setPageNumber(0);
                        }

                        if (profile) {
                            result.some(item => 
                                // tempProfile.id === profile.id && console.log(tempProfile)
                                item.id === profile.id && setProfile(item)
                            );
                        }
                        setLoading(false);
                        loadNotifications();

                        // console.log("plain text : " + output_plaintext);
                    });
                
            });
    }
    
    useEffect(() => {
        document.querySelector(".profile__content").addEventListener("click", toggleSearch);
        var interval = setInterval(loadProfiles, 300000);


        return () => {
            document.removeEventListener("click", toggleSearch)
            clearInterval(interval);
        }
    }, []);

    const setFilterOptions = event => {
        event.target.checked
        ? setFilter(prevFilter => {return {...prevFilter, [event.target.name]: [...prevFilter[event.target.name], event.target.value]}})
        : setFilter(prevFilter => {return {...prevFilter, [event.target.name]: prevFilter[event.target.name].filter(item => item !== event.target.value)}})
    }

    // let results = search 
    //     ? profiles.filter(profile => profile.username.toLowerCase().includes(search.toLowerCase())) 
    //     : profiles;

    // results = results.filter(profile => roles.includes(profile.role));
    // results = results.filter(profile => toxicity.includes(profile.toxicity));

    // let fullResults = results;

    // results = results.slice(pageNumber * 8, (pageNumber + 1) * 8);

    // let pageCount = fullResults.length / 8;
    
    // useEffect(() => {
    //     pageNumber !== 0 && results.length === 0 && setPageNumber(pageCount - 1);
    // }, [results]);

    useEffect(() => {
        loadProfiles();
    }, [search, filter, pageNumber]);

    return (
        <div className="profile__content">
            <div className="profile__header">
                <h2>Profiles</h2>
                <div className="filter">
                    <div className="filter__search">
                        <img src={SearchIcon} id="searchIcon" alt="search icon" className="search__icon" />
                        <input placeholder="Search" id="searchInput" type="text" value={search} onChange={event => setSearch(event.target.value)} />
                    </div>
                    <div className="filter__support">
                        <div id="showSupport" onClick={() => toggleFilter(0, "filterSupportContent")}>
                            <p>Support</p>
                            <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                        </div>
                        <div id="filterSupportContent" className="support__content">
                            <label>
                                Not Yet
                                <input type="checkbox" value="not yet" name="supports" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                            <label>
                                Offered
                                <input type="checkbox" value="offered" name="supports" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                            <label>
                                Offered Yet Continues
                                <input type="checkbox" value="offered yet continues" name="supports" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="filter__roles">
                        <div id="showRoles" onClick={() => toggleFilter(1, "filterRolesContent")}>
                            <p>Roles</p>
                            <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                        </div>
                        <div id="filterRolesContent" className="roles__content">
                            <label>
                                Cyberbully
                                <input type="checkbox" value="cyberbully" name="roles" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                            <label>
                                Cybervictim
                                <input type="checkbox" value="cybervictim" name="roles" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                            <label>
                                Cyberbully-Victim
                                <input type="checkbox" value="cyberbully-victim" name="roles" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="filter__toxicity">
                        <div id="showToxicity" onClick={() => toggleFilter(2, "filterToxicityContent")}>
                            <p>Toxicity</p>
                            <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                        </div>
                        <div id="filterToxicityContent" className="toxicity__content">
                            <label>
                                Low
                                <input type="checkbox" value="low" name="toxicity" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                            <label>
                                Medium
                                <input type="checkbox" value="medium" name="toxicity" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                            <label>
                                High
                                <input type="checkbox" value="high" name="toxicity" defaultChecked onClick={setFilterOptions} />
                                <div className="tick__cross__container">
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                    <img src={CrossIcon} alt="cross icon" className="cross__icon" />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="profiles__outline">
                {!loading && profiles.length > 0 ? <div className="profiles">
                    {profiles.map(profile =>
                        <div className="profile">
                            {/* <img src={TempProfile} alt="profile icon" /> */}
                            <div className={`profile--${profile.toxicity}`}>
                                <img src={profile.image} alt="profile icon" />
                            </div>
                            <div>
                                <div className="username__container">
                                    <p>@{profile.username}</p>
                                    <div className="notifications">
                                        {profile.cyberbully_notification > 0 && <p className="cyberbully">{profile.cyberbully_notification}</p>}
                                        {profile.cybervictim_notification > 0 && <p className="cybervictim">{profile.cybervictim_notification}</p>}
                                    </div>
                                </div>
                            <p className="support__status">Support: {profile.support_status}</p>
                            </div>
                            <button className="button" onClick={() => setProfile(profile)}>View Incidents ({profile.total_incidents})</button>
                            {/* <p>Approached 2 times before</p> */}
                        </div>
                    )}
                </div> : !loading && profiles.length === 0 ?
                <div className="profiles--empty">
                    <p>No profiles were found.</p>
                </div> : 
                <div className="profiles--loading">
                    <Loading />
                </div>}
                <ReactPaginate
                    pageCount={pageCount}
                    pageRangeDisplayed={2}
                    marginPagesDisplayed={1}
                    forcePage={pageNumber}
                    initialPage={pageNumber}
                    onPageChange={event => setPageNumber(event.selected)}
                    activeClassName="pagination__link--active"
                    containerClassName="pagination__container" 
                />
            </div>
            {profile && <ProfileDetail profile={profile} setProfile={setProfile} loadProfiles={loadProfiles} popupMessage={popupMessage} setPopupMessage={setPopupMessage} />}
            {/* {popupMessage && <PopUp popupMessage={popupMessage} setPopupMessage={setPopupMessage} />} */}
            {/* <PopUp /> */}
        </div>
    )
}