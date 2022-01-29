import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import '../static/css/login.css';
import { api } from '../static/js/config.js';
import { triggerTooltip, toggleFieldError } from '../static/js/utils.js';
import InfoIcon from '../static/media/icons/information.svg';
import AppIcon from '../static/media/icons/app.png';
import Loading from "../components/loading.js";
import TwitterLogin from "../components/twitter_login.js";
import publicKeyFile from "../static/public_key.pem"
import forge from "node-forge";

export default function Login({setToken, identity, setIdentity}) {
  const history = useHistory();
  const [credential, setCredential] = useState({
    username: "",
    password: "",
  })
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [twitterLoginModal, setTwitterLoginModal] = useState(false);
  const [twitterLoginURL, setTwitterLoginURL] = useState({});
  const [requestToken, setRequestToken] = useState();
  const [credentialError, setCredentialError] = useState({
    usernameError: true,
    passwordError: true
  });
  // const [usernameError, setUsernameError] = useState(true);
  // const [passwordError, setPasswordError] = useState(true);
  // const [attempted, setAttempted] = useState(false);

  const login = event => {
    event.preventDefault();

    setErrorMessage("");
    if (credentialError.usernameError || credentialError.passwordError) {
      toggleFieldError(document.getElementById("username"), credentialError.usernameError);
      toggleFieldError(document.getElementById("password"), credentialError.passwordError);
      credentialError.usernameError && triggerTooltip("usernameTooltipText");
      credentialError.passwordError && triggerTooltip("passwordTooltipText");
      return;
    }

    setLoading(true);
    
    fetch(publicKeyFile)
            .then(response => response.text())
            .then(publicKeyText => {
              let publicKey = forge.pki.publicKeyFromPem(publicKeyText);
                var encryptedPassword = publicKey.encrypt(credential.password, "RSA-OAEP", {
                    md: forge.md.sha256.create(),
                    mgf1: forge.mgf1.create()
                });

                let url = `${api}/login`;
                // let url = "http://192.168.0.109/api/login";
                // let auth = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTYxODgzMjg1NiwianRpIjoiZTE2MGUyNmQtYTk1NS00Nzk1LWJkZjItNTY1NjE1Y2VjZTEzIiwibmJmIjoxNjE4ODMyODU2LCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiNjA3ZDY3MjczMTM4MTU4MTFkMTU2MzIzIiwiZXhwIjoxNjE5NDM3NjU2fQ.ADJwExM-rcACbvTOadN3p5fZz5yNkfI8CtMhh-NxyI0";
                fetch(url, {
                  method: 'POST',
                  headers:{
                    // Accept: 'application/json',
                            'Content-Type': 'application/json',
                  //            'Authorization': "Bearer " + auth,
                    },
                  body: JSON.stringify({
                    username: credential.username,
                    password: forge.util.encode64(encryptedPassword)
                  })
                })
                .then(response => response.json())
                .then(result => {
                  setLoading(false);
                  console.log(result);
                  if (result.error) { return setErrorMessage(result.error) }
                  if (result.twitter_login_required) {
                    setTwitterLoginModal(true);
                    setTwitterLoginURL(result.twitter_login_url);
                    setRequestToken(result.request_token);
                    localStorage.setItem("identity", JSON.stringify(result.identity));
                    setIdentity(result.identity);
                    return;
                  } else {
                    localStorage.setItem("token", result.token);
                    setToken(result.token);
                    localStorage.setItem("identity", JSON.stringify(result.identity));
                    setIdentity(result.identity);
                    history.push('/dashboard');
                    return;
                  }
                })
            })
  }

  // const handleUsernameChange = event => {
  //   validate(event.target.value, "username");
  //   setUsername(event.target.value);
  // }

  // const handlePasswordChange = event => {
  //   validate(event.target.value, "password");
  //   setPassword(event.target.value);
  // }

  const handleInputChange = event => {
    validate(event.target.value, event.target.id);
    setCredential(previousCredential => { return {...previousCredential, [event.target.id]: event.target.value}});
  }

  const validate = (value, id) => {
    let emptyValue = value.length === 0;
    let invalidInput = id === "username" ? !value.match(/^[A-Za-z0-9]+$/i) : !value.match(/^[A-Za-z0-9-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/@#\\]+$/i);
    let invalidInputLength = id === "username" ? value.length < 4 || value.length > 50 : value.length < 8 || value.length > 128;

    let element = document.getElementById(id);

    if (emptyValue || invalidInput || invalidInputLength) {
      toggleFieldError(element, true);
      id === "username" ? handleCredentialError("usernameError", true) : handleCredentialError("passwordError", true)
      return;
    }

    id === "username" ? handleCredentialError("usernameError", false) : handleCredentialError("passwordError", false)
    toggleFieldError(element, false);
  }

  const handleCredentialError = (key, value) => {
    setCredentialError(previousCredentialError => { return {...previousCredentialError, [key]: value}});
  }

  // useEffect(() => {
  //   toggleTooltip("username", "usernameTooltipText");
  //   toggleTooltip("password", "passwordTooltipText");
  // }, []);

  return (
    <div className="login">
        <div className="login__structure">
          <div className="login__information">
            <h1 className="login__information__title"><img src={AppIcon} alt="app icon"/>Cyberbullying Detection System</h1>
            <p className="login__information__objective">
              In order to combat cyberbullying happenings in Malaysia, 
              this website is implemented to allow Malaysian authorities 
              and NGOs in monitoring cyberbullying messages transmitted across Twitter.
            </p>
            <p className="login__information__contacts">
              Contact <a href="tel:+603-8688 8000">03-8688 8000</a> or email <a href="mailto:scird@mcmc.gov.my">scird@mcmc.gov.my</a> to 
              join amongst many other officials in surveilling cyberbullying cases.
            </p> 
          </div>
        </div>
        <div className="login__structure">
          <h1 className="login__title">Login</h1>
          <form className="login__fields" onSubmit={login}>
            <label>
              Username
              <div className="tooltip">
                <img src={InfoIcon} alt="info icon" className="info__icon" />
                <span id="usernameTooltipText" className="tooltiptext">
                  <ul>
                    {/* <li>&#8226; More than 5 characters.</li>
                    <li>&#8226; Less than 50 characters.</li> */}
                    <li>&#8226; Between 5 to 50 characters.</li>
                    <li>&#8226; Letters and numerals only.</li>
                    {/* <li>&#8226; White spaces are not allowed.</li> */}
                  </ul>
                </span>
              </div>
            </label>
            {/* <div style={{width: "100%"}} className="tooltip"> */}
            <input type="text" name="username" id="username" value={credential.username} className="field--input" onChange={handleInputChange} />
              {/* <span className="tooltiptext">Username should only have characters and numerals.</span>
            </div> */}
            <label>
              Password
              <div className="tooltip">
                <img src={InfoIcon} alt="info icon" className="info__icon" />
                <span id="passwordTooltipText" className="tooltiptext">
                  <ul>
                    {/* <li>&#8226; More than 8 characters.</li>
                    <li>&#8226; Less than 128 characters.</li> */}
                    <li>&#8226; Between 8 to 128 characters.</li>
                    <li>&#8226; Letters, numerals and symbols.</li>
                    {/* <li>&#8226; White spaces are not allowed.</li> */}
                  </ul>
                </span>
              </div>
            </label>
            {/* <div style={{width: "100%"}} className="tooltip"> */}
            <input type="password" name="password" id="password" value={credential.password} className="field--input" onChange={handleInputChange} />
              {/* <span className="tooltiptext">Password should only have characters and numerals.</span>
            </div> */}
            <input type="submit" value="Login" />
          </form>
          {loading ? <Loading /> : <p className="login__error">{errorMessage}</p>}
        </div>
        {twitterLoginModal && <TwitterLogin requestToken={requestToken} setTwitterLoginModal={setTwitterLoginModal} twitterLoginURL={twitterLoginURL} identity={identity} setIdentity={setIdentity} setToken={setToken} />}
    </div>
  );
}