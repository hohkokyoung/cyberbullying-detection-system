import React, { useState, useEffect, useContext } from 'react';
import '../static/css/add_organisation.css';
import ChangePassword from "./change_password.js";
// import Tweets from './tweets.js';
import { toggleFieldError, triggerTooltip } from '../static/js/utils.js';
import { host, api } from "../static/js/config.js";
import { toggleFilter } from '../static/js/utils.js';
import TempProfile from '../static/media/images/profile.jpg';
import Camera from '../static/media/icons/camera.png';
import BiggerCross from '../static/media/icons/bigger-cross.png';
import DefaultProfile from "../static/media/images/default-profile.jpg";
import CrossIcon from '../static/media/icons/cross.svg';
import { TokenContext } from '../context.js';
import Loading from "./loading.js";
import Popup from "./pop_up.js";
import InfoIcon from '../static/media/icons/information.svg';
import ArrowIcon from '../static/media/icons/arrow.svg';
import aesFile from "../static/aes_key.txt";
import * as CryptoJS from 'crypto-js';

export default function AddOrganisation({setAddOrganisationModal, loadData}) {
    const [popupMessage, setPopupMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [organisationError, setOrganisationError] = useState({
        nameError: true,
        systemUsernameError: true,
        twitterUsernameError: true,
    });
    const [organisation, setOrganisation] = useState({
        image: "",
        name: "",
        type: "government",
        // adminUsername: "",
        systemUsername: "",
        twitterUsername: "",
    });
    const token = useContext(TokenContext);

    const addOrganisation = () => {
        
        setErrorMessage("");

        // if (!imageFile) {
        //     triggerTooltip("organisationImageTooltipText");
        //     return;
        // }

        if (organisationError.nameError || organisationError.systemUsernameError || organisationError.twitterUsernameError) {
            toggleFieldError(document.getElementById("name"), organisationError.nameError);
            toggleFieldError(document.getElementById("systemUsername"), organisationError.systemUsernameError);
            toggleFieldError(document.getElementById("twitterUsername"), organisationError.twitterUsernameError);
            organisationError.nameError && triggerTooltip("organisationNameTooltipText");
            organisationError.systemUsernameError && triggerTooltip("organisationSystemUsernameTooltipText");
            organisationError.twitterUsernameError && triggerTooltip("organisationTwitterUsernameTooltipText");
            // (passwordsError.currentPasswordError || passwordsError.newPasswordError || passwordsError.confirmPasswordError)
            // && triggerTooltip("changePasswordTooltipText");
            return;
        }

        // if (passwords.newPassword !== passwords.confirmPassword) {
        //     // errorMessage.innerHTML = "The passwords does not match.";
        //     setErrorMessage("The new passwords do not match.");
        //     return;
        // }

        setLoading(true);

        let filteredOrganisation = {
            name: organisation.name.trim(),
            type: organisation.type,
            systemUsername: organisation.systemUsername.trim(),
            twitterUsername: organisation.twitterUsername.trim(),
        }

        let url = `${api}/add_organisation`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                file: imageFile,
                organisation: filteredOrganisation,
            })
        })
        .then(response => response.json())
        .then(result => {
            setLoading(false);
            if (result.error) { return setErrorMessage(result.error) }
            fetch(aesFile)
                .then(response => response.text())
                .then(aesKey => {
                    var decodedPassword = atob(result.success);
                    // Split by 16 because my IV size
                    var iv = decodedPassword.substring(0, 16);
                    var encryptedPassword = decodedPassword.substring(16);

                    encryptedPassword = CryptoJS.enc.Latin1.parse(encryptedPassword);
                    iv = CryptoJS.enc.Latin1.parse(iv); 
                    var key = CryptoJS.enc.Utf8.parse(aesKey);

                    var passwordArray = CryptoJS.AES.decrypt(
                        { ciphertext:  encryptedPassword },
                        key,
                        {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
                    );
                
                    // Can be Utf8 too
                    var password = CryptoJS.enc.Latin1.stringify(passwordArray);
                    setPopupMessage("The organisation has been successfully created. The password for the organisation account is:\n " + password);
                });
        })
    }

    const previewImage = event => {
        // setAccount(previousAccount => {
        //     return {...previousAccount, image: URL.createObjectURL(event.target.files[0])}
        // })
        let validExtensions = ['jpg','png','jpeg'];
        let filePicker = document.getElementById("organisationImageFile");
        let filePath = filePicker.value;

        // if (filePicker.value === "") {
        //     alert("hi");
        // }

        let extension = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();

        if (validExtensions.includes(extension)) {
            var fileReader = new FileReader();

            fileReader.onload = function(fileLoadedEvent) {
                console.log(event.target.files[0].name)
                var srcData = fileLoadedEvent.target.result; // <--- data: base64
                // console.log(srcData.replace(/^data:image.+;base64,/, ''))  
                setImageFile(srcData.replace(/^data:image.+;base64,/, ''));
                // setImageFile({
                    // name: event.target.files[0].name,
                    // extension: extension,
                    // base64: srcData.replace(/^data:image.+;base64,/, '')
                // });
            }

            fileReader.readAsDataURL(event.target.files[0]);
            
            setTempImage(URL.createObjectURL(event.target.files[0]));
        } else {
            triggerTooltip("organisationImageTooltipText");
            // setPopupMessage("Only allow images with .png, .jpg and .jpeg extensions.");
        }
    }

    const validate = (value, id) => {
        let emptyValue = value.length === 0;
        let invalidInput = id === "name" ? !value.match(/^[A-Za-z0-9\s()]+$/i) : id === "systemUsername" ? !value.match(/^[A-Za-z0-9]+$/i) : !value.match(/^[A-Za-z0-9_]+$/i);
        let invalidInputLength = id === "name" ? value.length < 3 || value.length > 60 
                                : id === "systemUsername" ? value.length < 5 || value.length > 50 : value.length < 5 || value.length > 15;

        let element = document.getElementById(id);

        if (emptyValue || invalidInput || invalidInputLength) {
            toggleFieldError(element, true);
        // id === "username" ? handleOrganisationError("usernameError", true) : handleOrganisationError("passwordError", true)
            id === "name" && handleOrganisationError("nameError", true);
            id === "systemUsername" && handleOrganisationError("systemUsernameError", true);
            id === "twitterUsername" && handleOrganisationError("twitterUsernameError", true);
            return;
        }

        // id === "username" ? handleOrganisationError("usernameError", false) : handleOrganisationError("passwordError", false)
        id === "name" && handleOrganisationError("nameError", false);
        id === "systemUsername" && handleOrganisationError("systemUsernameError", false);
        id === "twitterUsername" && handleOrganisationError("twitterUsernameError", false);
        toggleFieldError(element, false);
    }

    const handleOrganisationError = (key, value) => {
        setOrganisationError(previousOrganisationError => { return {...previousOrganisationError, [key]: value}});
    }

    const handleInputChange = (event, key) => {
        validate(event.target.value, event.target.id);
        setOrganisation(previousOrganisation => { return {...previousOrganisation, [key]: event.target.value}});
    }
    
    return (
        <div className="add__organisation__modal">
            <div className="add__organisation__modal__background">
                <div>
                    <h2>Add Organisation</h2>
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => setAddOrganisationModal(false)} />
                </div>
                <div className="add__organisation__content">
                    <div>
                        <h3>
                            Image
                            <div className="tooltip">
                                <img src={InfoIcon} alt="info icon" className="info__icon" />
                                <span id="organisationImageTooltipText" className="tooltiptext">
                                <ul>
                                    <li>&#8226; Images with .png, .jpg and .jpeg extension only.</li>
                                </ul>
                                </span>
                            </div>
                        </h3>
                        <div className="input__container">
                            <label for="organisationImageFile" title="Select Image" className="organisation__image__container">
                                {tempImage 
                                ? <img src={BiggerCross} className="image__overlap" alt="cross overlap icon" />
                                : <img src={Camera} className="image__overlap" alt="camera overlap icon" />}
                                <img src={tempImage ? tempImage : DefaultProfile} className="organisation__image" alt="organisation image" />
                            </label>
                            {tempImage ? <button id="organisationImageFile" onClick={() => {setTempImage(false); setImageFile(null)}}></button> : <input id="organisationImageFile" className="organisation__image__file" type="file" onChange={previewImage} />}
                        </div>
                    </div>
                    <div>
                        <div>
                            <h3>
                                Name
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="organisationNameTooltipText" className="tooltiptext">
                                    <ul>
                                        {/* <li>&#8226; More than 4 characters.</li>
                                        <li>&#8226; Less than 61 characters.</li> */}
                                        <li>&#8226; Between 5 to 60 characters.</li>
                                        <li>&#8226; Letters, numerals and brackets only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="Childline Foundation" type="text" id="name" value={organisation.name} onChange={event => handleInputChange(event, "name")} />
                        </div>
                        <div>
                            <h3>
                                Type
                                {/* <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="organisationTypeTooltipText" className="tooltiptext">
                                    <ul>
                                        <li>&#8226; More than 5 characters.</li>
                                    </ul>
                                    </span>
                                </div> */}
                            </h3>
                            <div id="showFilter" onClick={() => toggleFilter(0, "organisationTypeContent")} className="organisation__type">
                                {/* <p>{timeSwitch ? year : date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear()}</p> */}
                                <p>{organisation.type}</p>
                                <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                            </div>
                            <div id="organisationTypeContent" className="organisation__type__content">
                                <label className={organisation.type === "government" && "organisation__type--checked"}>
                                    Government
                                    <input checked type="radio" value="government" name="government" onClick={event => setOrganisation(previousOrganisation => { return {...previousOrganisation, "type": event.target.value}})} />
                                </label>
                                <label className={organisation.type === "non-government" && "organisation__type--checked"}>
                                    Non-Government
                                    <input type="radio" value="non-government" name="non-government" onClick={event => setOrganisation(previousOrganisation => { return {...previousOrganisation, "type": event.target.value}})} />
                                </label>
                            </div>
                        </div>
                        <div>
                            <h3>
                                Username (System)
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="organisationSystemUsernameTooltipText" className="tooltiptext">
                                    <ul>
                                        {/* <li>&#8226; More than 4 characters.</li>
                                        <li>&#8226; Less than 50 characters.</li> */}
                                        <li>&#8226; Between 5 to 50 characters.</li>
                                        <li>&#8226; Letters and numerals only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="wicky20" type="text" id="systemUsername" value={organisation.systemUsername} onChange={event => handleInputChange(event, "systemUsername")} />
                        </div>
                        <div>
                            <h3>
                                Username (Twitter)
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="organisationTwitterUsernameTooltipText" className="tooltiptext">
                                    <ul>
                                        {/* <li>&#8226; More than 4 characters.</li>
                                        <li>&#8226; Less than 50 characters.</li> */}
                                        <li>&#8226; Between 5 to 15 characters.</li>
                                        <li>&#8226; Letters, numerals and underscores only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="anonymous24" type="text" id="twitterUsername" value={organisation.twitterUsername} onChange={event => handleInputChange(event, "twitterUsername")} />
                        </div>
                    </div>
                </div>
                <div>
                    {loading ? <Loading /> : <p className="error">{errorMessage}</p>}
                    <div>
                        <button className="button" onClick={() => setAddOrganisationModal(false)}>Cancel</button>
                        <button className="button" onClick={addOrganisation}>Save</button>
                    </div>
                </div>
            </div>
            {popupMessage && <Popup popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={setAddOrganisationModal} loadData={loadData} />}
        </div>
    );
}