import React, { useState, useEffect } from 'react';
import '../static/css/incidents.css';
import TempProfile from '../static/media/images/profile.png';
import Incident from './incident.js';

export default function Incidents() {
    const [incidents, setIncidents] = useState([{
        'id': 1,
        'time': '2020-04-21 1:22 a.m.',
        'username': 'Hoh Kok Young',
        'message': "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat mas",
    }, 
    {
        'id': 2,
        'time': '2020-04-21 1:22 a.m.',
        'username': 'Elijah Woo',
        'message': 'What a noob.',
    }, 
    {
        'id': 3,
        'time': '2020-04-21 1:22 a.m.',
        'username': 'Pewdiepie',
        'message': 'What a noob.',
    }]);
    
    return (
        <div>
            <div className="incidents__header">
                <h2>Cyberbullying Incidents</h2>
                <div className="filter__type">
                    <div className="filter__tab">
                        <button>Unread</button>
                        <p>21</p>
                    </div>
                    <div className="filter__tab">
                        <button>Read</button>
                    </div>
                </div>
            </div>
            <Incident incidents={incidents} setIncidents={setIncidents} />
        </div>
    );
}