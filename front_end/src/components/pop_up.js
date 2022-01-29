import React from 'react';
import '../static/css/pop_up.css';
// import { closeModal } from '../static/js/utils.js';

export default function PopUp({popupMessage, setPopupMessage, setModal, loadData}) {
    return (
        <div className="pop__up">
            <div className="pop__up__background">
                <div>
                    <p>{popupMessage}</p>
                    <button onClick={() => {setPopupMessage(""); setModal && setModal(false); loadData && loadData();}}>Continue</button>
                </div>
            </div>
        </div>
    );
}