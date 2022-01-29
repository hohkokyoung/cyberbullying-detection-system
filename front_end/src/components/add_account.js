import React, { useState, useEffect, useContext } from 'react';
import '../static/css/add_account.css';
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

export default function AddAccount({setAddAccountModal, loadData, organisationID}) {
    const [popupMessage, setPopupMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [accountError, setAccountError] = useState({
        nameError: true,
        titleError: true,
        usernameError: true,
    });
    const [account, setAccount] = useState({
        image: "",
        name: "",
        title: "",
        username: "",
    });
    const token = useContext(TokenContext);

    const addAccount = () => {
        
        setErrorMessage("");

        // if (!imageFile) {
        //     triggerTooltip("organisationImageTooltipText");
        //     return;
        // }

        if (accountError.nameError || accountError.titleError || accountError.usernameError) {
            toggleFieldError(document.getElementById("name"), accountError.nameError);
            toggleFieldError(document.getElementById("title"), accountError.titleError);
            toggleFieldError(document.getElementById("username"), accountError.usernameError);
            accountError.nameError && triggerTooltip("nameTooltipText");
            accountError.titleError && triggerTooltip("titleTooltipText");
            accountError.usernameError && triggerTooltip("usernameTooltipText");
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

        let filteredAccount = {
            name: account.name.trim(),
            title: account.title.trim(),
            username: account.username.trim(),
        }

        let url = `${api}/add_account`;
        fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                file: imageFile,
                account: filteredAccount,
                organisation_id: organisationID,
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
                    setPopupMessage("The account has been successfully created. The password for the account is:\n " + password);
                });
        })
    }

    const previewImage = event => {
        // setAccount(previousAccount => {
        //     return {...previousAccount, image: URL.createObjectURL(event.target.files[0])}
        // })
        let validExtensions = ['jpg','png','jpeg'];
        let filePicker = document.getElementById("imageFile");
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
            triggerTooltip("imageTooltipText");
            // setPopupMessage("Only allow images with .png, .jpg and .jpeg extensions.");
        }
    }

    const validate = (value, id) => {
        let emptyValue = value.length === 0;
        let invalidInput = id === "username" ? !value.match(/^[A-Za-z0-9]+$/i) : !value.match(/^[A-Za-z0-9\s]+$/i);
        let invalidInputLength =  id === "name" ? value.length < 3 || value.length > 50 
                                : id === "title" ? value.length < 5 || value.length > 100 
                                : id === "username" ? value.length < 5 || value.length > 50
                                : null;

        let element = document.getElementById(id);

        if (emptyValue || invalidInput || invalidInputLength) {
            toggleFieldError(element, true);
        // id === "username" ? handleaccountError("usernameError", true) : handleaccountError("passwordError", true)
            id === "name" && handleAccountError("nameError", true);
            id === "title" && handleAccountError("titleError", true);
            id === "username" && handleAccountError("usernameError", true);
            return;
        }

        // id === "username" ? handleaccountError("usernameError", false) : handleaccountError("passwordError", false)
        id === "name" && handleAccountError("nameError", false);
        id === "title" && handleAccountError("titleError", false);
        id === "username" && handleAccountError("usernameError", false);
        toggleFieldError(element, false);
    }

    const handleAccountError = (key, value) => {
        setAccountError(previousaccountError => { return {...previousaccountError, [key]: value}});
    }

    const handleInputChange = (event, key) => {
        validate(event.target.value, event.target.id);
        setAccount(previousAccount => { return {...previousAccount, [key]: event.target.value}});
    }
    
    return (
        <div className="add__account__modal">
            <div className="add__account__modal__background">
                <div>
                    <h2>Add Account</h2>
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => setAddAccountModal(false)} />
                </div>
                <div className="add__account__content">
                    <div>
                        <h3>
                            Image
                            <div className="tooltip">
                                <img src={InfoIcon} alt="info icon" className="info__icon" />
                                <span id="imageTooltipText" className="tooltiptext">
                                <ul>
                                    <li>&#8226; Images with .png, .jpg and .jpeg extension only.</li>
                                </ul>
                                </span>
                            </div>
                        </h3>
                        <div className="input__container">
                            <label for="imageFile" title="Select Image" className="account__image__container">
                                {tempImage 
                                ? <img src={BiggerCross} className="image__overlap" alt="cross overlap icon" />
                                : <img src={Camera} className="image__overlap" alt="camera overlap icon" />}
                                <img src={tempImage ? tempImage : DefaultProfile} className="account__image" alt="account image" />
                            </label>
                            {tempImage ? <button id="imageFile" onClick={() => {setTempImage(false); setImageFile(null)}}></button> : <input id="imageFile" className="account__image__file" type="file" onChange={previewImage} />}
                        </div>
                    </div>
                    <div>
                        <div>
                            <h3>
                                Name
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="nameTooltipText" className="tooltiptext">
                                    <ul>
                                        <li>&#8226; More than 3 characters.</li>
                                        <li>&#8226; Less than 50 characters.</li>
                                        <li>&#8226; Letters only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="John Doe" type="text" id="name" value={account.name} onChange={event => handleInputChange(event, "name")} />
                        </div>
                        <div>
                            <h3>
                                Job Title
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="titleTooltipText" className="tooltiptext">
                                    <ul>
                                        <li>&#8226; More than 5 characters.</li>
                                        <li>&#8226; Less than 100 characters.</li>
                                        <li>&#8226; Letters only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="Operation Manager" type="text" id="title" value={account.title} onChange={event => handleInputChange(event, "title")} />
                        </div>
                        <div>
                            <h3>
                                Username
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="usernameTooltipText" className="tooltiptext">
                                    <ul>
                                        <li>&#8226; More than 5 characters.</li>
                                        <li>&#8226; Less than 50 characters.</li>
                                        <li>&#8226; Letters only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="wicky20" type="text" id="username" value={account.username} onChange={event => handleInputChange(event, "username")} />
                        </div>
                    </div>
                </div>
                <div>
                    {loading ? <Loading /> : <p className="error">{errorMessage}</p>}
                    <div>
                        <button className="button" onClick={() => setAddAccountModal(false)}>Cancel</button>
                        <button className="button" onClick={addAccount}>Save</button>
                    </div>
                </div>
            </div>
            {popupMessage && <Popup popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={setAddAccountModal} loadData={loadData} />}
        </div>
    );
}