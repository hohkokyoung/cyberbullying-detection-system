import React, { useState, useEffect } from 'react';
import '../static/css/incident.css';
import TempProfile from '../static/media/images/profile.png';

export default function Incident({incidents, setIncidents}) {
    return (
        <div className="incidents__container">
            {incidents.map(incident =>
                <div className="incident">
                    <img src={TempProfile} alt="profile image" className="profile__image" />
                    <p className="incident__time">{incident.time}</p>
                    <p className="profile__username">@{incident.username}</p>
                    <p className="incident__message">{incident.message}</p>
                    <div className="not__cyberbullying__container">
                        <button className="not__cyberbullying" onClick={() => {
                            let tempIncidents = incidents;
                            tempIncidents = tempIncidents.filter(tempIncident => tempIncident.id !== incident.id);
                            setIncidents(tempIncidents);
                        }}>Not Cyberbullying</button>
                    </div>
                </div>
            )}
        </div>
    );
}