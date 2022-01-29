import React, { useState, useEffect, useContext } from 'react';
import '../static/css/edit_organisation.css';
import ChangePassword from "./change_password.js";
// import Tweets from './tweets.js';
import { toggleFieldError, triggerTooltip } from '../static/js/utils.js';
import { host, api } from "../static/js/config.js";
import TempProfile from '../static/media/images/profile.jpg';
import Camera from '../static/media/icons/camera.png';
import BiggerCross from '../static/media/icons/bigger-cross.png';
import DefaultProfile from "../static/media/images/default-profile.jpg";
import CrossIcon from '../static/media/icons/cross.svg';
import { TokenContext } from '../context.js';
import Loading from "./loading.js";
import Popup from "./pop_up.js";
import InfoIcon from '../static/media/icons/information.svg';

export default function EditOrganisation({setEditOrganisationModal, tempOrganisation, loadData}) {
    const [popupMessage, setPopupMessage] = useState("")
    const [tempImage, setTempImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    // const [imageFile, setImageFile] = useState({
    //     // extension: "",
    //     name: "",
    //     base64: "",
    // });
    const [organisation, setOrganisation] = useState(tempOrganisation);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [organisationError, setOrganisationError] = useState({
        nameError: false,
        phoneNumberError: false,
        emailAddressError: false,
    });

    const token = useContext(TokenContext);

    const editOrganisation = () => {

        setErrorMessage("");

        if (organisationError.nameError || organisationError.phoneNumberError || organisationError.emailAddressError) {
            toggleFieldError(document.getElementById("organisationName"), organisationError.nameError);
            // toggleFieldError(document.getElementById("accountTitle"), accountError.titleError);
            toggleFieldError(document.getElementById("organisationPhoneNumber"), organisationError.phoneNumberError);
            toggleFieldError(document.getElementById("organisationEmailAddress"), organisationError.emailAddressError);
            organisationError.nameError && triggerTooltip("organisationNameTooltipText");
            // accountError.titleError && triggerTooltip("accountTitleTooltipText");
            organisationError.phoneNumberError && triggerTooltip("organisationPhoneNumberTooltipText");
            organisationError.emailAddressError && triggerTooltip("organisationEmailAddressTooltipText");
            return;
        }

        setLoading(true);

        //Trim white spaces of input
        let filteredOrganisation = {
            image: organisation.image,
            name: organisation.name.trim(),
            // title: organisation.title && organisation.title.trim(),
            phone_number: organisation.phone_number && organisation.phone_number.trim(),
            email_address: organisation.email_address && organisation.email_address.trim(),
        }

        let url = `${api}/edit_organisation`;
        fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
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
            // const tempRoles = ["cyberbully", "cybervictim"];
            // console.log(result)
            // setAccount(result);
            setLoading(false);
            if (result.error) { return setErrorMessage(result.error) };
            setPopupMessage(result.success);
        });
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
        // let value = tempValue.trim();
        let emptyValue = value.length === 0;
        let invalidPhoneNumber = !value.match(/^(01)[2-45-9]-[0-9]{7}$/) && !value.match(/^(011)-[0-9]{8}$/) && !value.match(/^(03)-[0-9]{8}$/);
        let invalidEmailAddress = !value.match(/^\w+([\.-]?\w+)+@\w+([\.:]?\w+)+(\.[a-zA-Z0-9]{2,3})+$/);
        let invalidInput = !value.match(/^[A-Z a-z]+$/i);
        let invalidInputLength = id === "organisationName" ? value.length < 3 || value.length > 60 
                            // : id === "accountTitle" ? value.length < 5 || value.length > 100 
                            : id === "accountEmailAddress" ? value.length > 320 : null;

        let element = document.getElementById(id);

        if (id === "organisationName") {
            if (emptyValue || invalidInput || invalidInputLength) {
                toggleFieldError(element, true);
                handleOrganisationError("nameError", true);
                return;
            }
        }

        // if (id === "accountTitle") {
        //     if (emptyValue || invalidInput || invalidInputLength) {
        //         toggleFieldError(element, true);
        //         handleAccountError("titleError", true);
        //         return;
        //     }
        // }

        if (id === "organisationPhoneNumber") {
            if (!emptyValue && (invalidPhoneNumber || invalidInputLength)) {
                handleOrganisationError("phoneNumberError", true);
                toggleFieldError(element, true);
                return;
            }
        }

        if (id === "organisationEmailAddress") {
            if (!emptyValue && (invalidEmailAddress || invalidInputLength)) {
                handleOrganisationError("emailAddressError", true);
                toggleFieldError(element, true);
                return;
            }
        }


        // if (id === "accountPhoneNumber" && invalidPhoneNumber && !emptyValue && invalidInputLength) {
        //     handleAccountError("phoneNumberError", true);
        //     toggleFieldError(element, true);
        //     return;
        // }

        // if (id === "accountEmailAddress" && invalidEmailAddress && !emptyValue && invalidInputLength) {
        //     handleAccountError("emailAddressError", true);
        //     toggleFieldError(element, true);
        //     return;
        // }

        id === "organisationName" && handleOrganisationError("nameError", false);
        // id === "accountTitle" && handleOrganisationError("titleError", false);
        id === "organisationPhoneNumber" && handleOrganisationError("phoneNumberError", false);
        id === "organisationEmailAddress" && handleOrganisationError("emailAddressError", false);
        // id === "username" ? handleCredentialError("usernameError", false) : handleCredentialError("passwordError", false)
        toggleFieldError(element, false);
    }

    const handleOrganisationError = (key, value) => {
        setOrganisationError(previousOrganisationError => { return {...previousOrganisationError, [key]: value}});
    }

    const handleInputChange = (event, key) => {
        validate(event.target.value, event.target.id);
        setOrganisation(previousOrganisation => { return {...previousOrganisation, [key]: event.target.value}});
    }

    useEffect(() => {
        organisation.name && validate(organisation.name, "organisationName");
        validate(organisation.phone_number || "", "organisationPhoneNumber");
        validate(organisation.email_address || "", "organisationEmailAddress");
    }, []);

    return (
        <div className="edit__organisation__modal">
            <div className="edit__organisation__modal__background">
                <div>
                    <h2>Edit Organisation</h2>
                    <img src={CrossIcon} alt="cross icon" id="cross" className="cross__icon" onClick={() => setEditOrganisationModal(false)} />
                </div>
                <div className="edit__organisation__content">
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
                                <img src={tempImage ? tempImage : organisation.image ? `${host}/static/media/images/${organisation.image}` : DefaultProfile} className="organisation__image" alt="organisation image" />
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
                                        {/* <li>&#8226; More than 3 characters.</li>
                                        <li>&#8226; Less than 50 characters.</li> */}
                                        <li>&#8226; Between 3 and 50 characters only.</li>
                                        <li>&#8226; Letters only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="John Doe" type="text" id="organisationName" value={organisation.name} onChange={event => handleInputChange(event, "name")} />
                        </div>
                        <div>
                            <h3>
                                Phone Number
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="organisationPhoneNumberTooltipText" className="tooltiptext">
                                    <ul>
                                        <li>&#8226; Between 10 and 12 characters only.</li>
                                        <li>&#8226; Numerals only.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="012-3429617" type="text" id="organisationPhoneNumber" value={organisation.phone_number} onChange={event => handleInputChange(event, "phone_number")} />
                        </div>
                        <div>
                            <h3>
                                Email Address
                                <div className="tooltip">
                                    <img src={InfoIcon} alt="info icon" className="info__icon" />
                                    <span id="organisationEmailAddressTooltipText" className="tooltiptext">
                                    <ul>
                                        {/* <li>&#8226; More than 3 characters.</li> */}
                                        {/* <li>&#8226; Less than 320 characters.</li> */}
                                        <li>&#8226; Between 3 to 320 characters.</li>
                                        <li>&#8226; Letters, symbols and numerals.</li>
                                    </ul>
                                    </span>
                                </div>
                            </h3>
                            <input placeholder="example@hotmail.com" type="text" id="organisationEmailAddress" value={organisation.email_address} onChange={event => handleInputChange(event, "email_address")} />
                        </div>
                    </div>
                </div>
                <div>
                    {loading ? <Loading /> : <p className="error">{errorMessage}</p>}
                    <div>
                        <button className="button" onClick={() => setEditOrganisationModal(false)}>Cancel</button>
                        <button className="button" onClick={editOrganisation}>Save</button>
                    </div>
                </div>
            </div>
            {popupMessage && <Popup popupMessage={popupMessage} setPopupMessage={setPopupMessage} setModal={setEditOrganisationModal} loadData={loadData} />}
        </div>
    );
}