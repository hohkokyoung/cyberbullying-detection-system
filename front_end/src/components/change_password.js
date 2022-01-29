import React, { useState, useEffect, useContext } from 'react';
import '../static/css/change_password.css';
// import Tweets from './tweets.js';
import { triggerTooltip, toggleFieldError } from '../static/js/utils.js';
import { api } from "../static/js/config.js";
import TempProfile from '../static/media/images/profile.jpg';
import CrossIcon from '../static/media/icons/cross.svg';
import { TokenContext } from '../context.js';
import * as CryptoJS from "crypto-js";
import forge from "node-forge";
import InfoIcon from '../static/media/icons/information.svg';
import publicKeyFile from "../static/public_key.pem"
import Loading from "./loading.js";
import Popup from "./pop_up.js";

export default function ChangePassword({setChangePasswordModal}) {
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [passwordsError, setPasswordsError] = useState({
        currentPasswordError: true,
        newPasswordError: true,
        confirmPasswordError: true,
    });
    const [popupMessage, setPopupMessage] = useState("");
    const token = useContext(TokenContext);

    const changePassword = () => {

        // let errorMessage = document.getElementById("changePasswordError");

        // if (passwords.oldPassword.length || passwords.newPassword.length) {

        // }

        setErrorMessage("");

        if (passwordsError.currentPasswordError || passwordsError.newPasswordError || passwordsError.confirmPasswordError) {
            toggleFieldError(document.getElementById("currentPassword"), passwordsError.currentPasswordError);
            toggleFieldError(document.getElementById("newPassword"), passwordsError.newPasswordError);
            toggleFieldError(document.getElementById("confirmPassword"), passwordsError.confirmPasswordError);
            (passwordsError.currentPasswordError || passwordsError.newPasswordError || passwordsError.confirmPasswordError)
            && triggerTooltip("changePasswordTooltipText");
            return;
          }

        if (passwords.newPassword !== passwords.confirmPassword) {
            // errorMessage.innerHTML = "The passwords does not match.";
            setErrorMessage("The new password and confirm password do not match.");
            return;
        }

        setLoading(true);

        fetch(publicKeyFile)
            .then(response => response.text())
            .then(publicKeyText => {
                let publicKey = forge.pki.publicKeyFromPem(publicKeyText);
                var encryptedCurrentPassword = publicKey.encrypt(passwords.currentPassword, "RSA-OAEP", {
                    md: forge.md.sha256.create(),
                    mgf1: forge.mgf1.create()
                });

                var encryptedNewPassword = publicKey.encrypt(passwords.newPassword, "RSA-OAEP", {
                    md: forge.md.sha256.create(),
                    mgf1: forge.mgf1.create()
                });

                let url = `${api}/change_password`;
                fetch(url, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token,
                    },
                    body: JSON.stringify({
                        current_password: forge.util.encode64(encryptedCurrentPassword),
                        new_password: forge.util.encode64(encryptedNewPassword),
                    })
                })
                .then(response => response.json())
                .then(result => {
                    setLoading(false);
                    if (result.error) { return setErrorMessage(result.error) }
                    setPopupMessage(result.success);
                })
            });

      
    // var encrypted = publicKey.encrypt("lolol", "RSA-OAEP", {
    //         md: forge.md.sha256.create(),
    //         mgf1: forge.mgf1.create()
    //     });

    //     var base64 = forge.util.encode64(encrypted);
    //     console.log(base64)

        //  var master_key = "1234567890123456" ;
        //         // console.log(response)
        //         // console.log(response.text());
        //         // console.log(atob(response))
        //     // console.log(atob(JSON.parse(result)))
        //     // console.log(response)
        //     // console.log(atob(response.json()))
        //     // console.log(response.json())
        //     // var rawData = atob(result);
        //     // Split by 16 because my IV size
        //     var rawData = passwords.oldPassword;
        //     var iv = rawData.substring(0, 16);
        //     // var crypttext = rawData.substring(16);

        //     // crypttext = CryptoJS.enc.Latin1.parse(crypttext);
        //     iv = CryptoJS.enc.Latin1.parse(iv); 
        //     var key = CryptoJS.enc.Utf8.parse(master_key);

        //     var plaintextArray = CryptoJS.AES.encrypt(
        //         rawData,
        //         key,
        //         {iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7}
        //       );

        //     console.log(plaintextArray)

        //     console.log(iv.concat(plaintextArray.ciphertext).toString(CryptoJS.enc.Base64))
          

        // let url = `${host}/change_password`;
        // fetch(url, {
        //     method: "POST",
        //     headers: {
        //         "Accept": "application/json",
        //         "Content-Type": "application/json",
        //         "Authorization": "Bearer " + token,
        //     },
        //     body: JSON.stringify({
        //         old_password: passwords.oldPassword,
        //         new_password: passwords.newPassword,
        //         lol: base64,
        //     })
        // })
        // .then(response => response.json())
        // .then(result => {
        //     console.log(result)
        // })
    }

    const handleInputChange = event => {
        validate(event.target.value, event.target.id);
        setPasswords(previousPasswords => { return {...previousPasswords, [event.target.id]: event.target.value}})
    }

    const validate = (value, id) => {
        let emptyValue = value.length === 0;
        let invalidInput = !value.match(/^[A-Za-z0-9-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/@#\\]+$/i);
        let invalidInputLength = value.length < 8 || value.length > 128;
    
        let element = document.getElementById(id);
    
        if (emptyValue || invalidInput || invalidInputLength) {
          toggleFieldError(element, true);
          id === "currentPassword" && handlePasswordsError("currentPasswordError", true);
          id === "newPassword" && handlePasswordsError("newPasswordError", true);
          id === "confirmPassword" && handlePasswordsError("confirmPasswordError", true);
          return;
        }
    
        toggleFieldError(element, false);
        id === "currentPassword" && handlePasswordsError("currentPasswordError", false);
        id === "newPassword" && handlePasswordsError("newPasswordError", false);
        id === "confirmPassword" && handlePasswordsError("confirmPasswordError", false);
      }

    const handlePasswordsError = (key, value) => {
    setPasswordsError(previousPasswordsError => { return {...previousPasswordsError, [key]: value}});
    }

    return (
        <div id="changePassword" className="change__password__modal">
            <div className="change__password__modal__background">
                <div>
                    <div>
                        <label>
                            <h2>Change Password</h2>
                            <div className="tooltip">
                                <img src={InfoIcon} alt="info icon" className="info__icon" />
                                <span id="changePasswordTooltipText" className="tooltiptext">
                                <ul>
                                    <li>&#8226; More than 8 characters.</li>
                                    <li>&#8226; Less than 128 characters.</li>
                                    <li>&#8226; Letters, numerals and symbols.</li>
                                    {/* <li>&#8226; No whitespace.</li> */}
                                    {/* <li>&#8226; White spaces are not allowed.</li> */}
                                </ul>
                                </span>
                            </div>
                        </label>
                    </div>
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => setChangePasswordModal(false)} />
                </div>
                <div>
                    <div>
                        <h3>Current Password</h3>
                        <input type="password" id="currentPassword" value={passwords.currentPassword} onChange={handleInputChange} />
                    </div>
                    <h3>New Password</h3>
                    <input type="password" id="newPassword" value={passwords.newPassword} onChange={handleInputChange} />
                    <h3>Confirm Password</h3>
                    <input type="password" id="confirmPassword" value={passwords.confirmPassword} onChange={handleInputChange} />
                </div>
                <div>
                    {loading ? <Loading /> : <p className="error">{errorMessage}</p>}
                    <div>
                        <button onClick={() => setChangePasswordModal(false)}>Cancel</button>
                        <button onClick={changePassword}>Save</button>
                    </div>
                </div>
            </div>
            {popupMessage && <Popup popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={setChangePasswordModal} />}
        </div>
    );
}