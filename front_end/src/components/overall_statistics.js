import React, { useState, useEffect, useContext, useMemo } from 'react';
import '../static/css/dashboard.css';
import { api } from '../static/js/config.js';
import { TokenContext } from '../context.js';

export default function OverallStatistics() {
    const token = useContext(TokenContext);

    const [overallStatistics, setOverallStatistics] = useState([
        // {
        //     'category': 'null',
        //     'value': 'null',
        //     'subtext': 'null',
        // },
    ]);

    const loadOverallStatistics = () => {
        
        let url = `${api}/statistic/incidents/overall`;

        fetch(url, {
            headers: {
                // Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token,
            },
        })
            .then(response => response.json())
            .then(result => {
                setOverallStatistics(result);
                // console.log(result)
                // setData(result.occurrences);
                // setXAxis(result.months);
            });
    }

    useEffect(() => {
        // timeSwitch ? loadMonthlyStatistics() : loadDailyStatistics();
        loadOverallStatistics();
        var interval = setInterval(loadOverallStatistics, 300000);
        return _ => clearInterval(interval);
    }, []);

    return (
        <div className="overall__statistics__container">
            {overallStatistics.map(statistic =>
                <div className="statistic">
                    <div className="statistic__content">
                        <h2>{statistic.category}</h2>
                        <p>{statistic.value}</p>
                        <p></p>
                        {/* <p>{statistic.subtext}</p> */}
                    </div>
                </div>
            )}
            {/* <div className="statistic">
                        <div className="statistic__content">
                            <h2>Highest (City)</h2>
                            <p>Petaling</p>
                            <p>with 200 cases</p>
                        </div>
                    </div>
                    <div className="statistic">
                        <div className="statistic__content">
                            <h2>Highest (State)</h2>
                            <p>Wilayah Persekutuan Kuala Lumpur</p>
                            <p>with 200 cases</p>
                        </div>
                    </div>
                    <div className="statistic">
                        <div className="statistic__content">
                            <h2>Highest (State)</h2>
                            <p>Perak</p>
                            <p>with 200 cases</p>
                        </div>
                    </div>
                    <div className="statistic">
                        <div className="statistic__content">
                            <h2>Highest (State)</h2>
                            <p>Perak</p>
                            <p>with 200 cases</p>
                        </div>
                    </div> */}
        </div>
    );
}