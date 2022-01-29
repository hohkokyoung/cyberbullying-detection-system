import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ZoomableGroup, ComposableMap, Geographies, Geography } from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { scaleQuantile } from 'd3-scale';
import { geoMercatorMalaysia } from "d3-composite-projections";
import { Bar } from 'react-chartjs-2';
import '../static/css/dashboard.css';
import Filter from '../components/filter.js';
import Map from '../components/map.js';
import OverallStatistics from '../components/overall_statistics';
import { api } from '../static/js/config.js';
import Incidents from '../components/incidents.js';
import { toggleFilter } from '../static/js/utils.js';
import BarChartIcon from '../static/media/icons/bar-chart.svg';
import EarthIcon from '../static/media/icons/earth.svg';
import Loading from '../components/loading.js';
import { TokenContext } from '../context.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Dashboard() {
    const [loading, setLoading] = useState(false);
    const [xAxis, setXAxis] = useState()
    const [data, setData] = useState();
    const token = useContext(TokenContext);
    const [overallStatistics, setOverallStatistics] = useState([
        // {
        //     'category': 'null',
        //     'value': 'null',
        //     'subtext': 'null',
        // },
    ]);
    const [tooltip, setTooltip] = useState("");

    const [type, setType] = useState("Bar Chart");

    const loadMonthlyStatistics = (month, year) => {
        setLoading(true);
        let url = `${api}/statistic/incidents/monthly`;

        fetch(url, {
            method: 'POST',
            headers: {
                "Accept": 'application/json',
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token,
            },
            body: JSON.stringify({
                year: year,
                type: type,
                month: month,
            })
        })
            .then(response => response.json())
            .then(result => {
                console.log(result);
                if (type === "Bar Chart") {
                    setData(result.occurrences);
                    setXAxis(result.months);
                } else {
                    setData(result);
                }
                setLoading(false);
            });
    }

    const loadDailyStatistics = date => {
        setLoading(true);
        let url = `${api}/statistic/incidents/daily`;
        fetch(url, {
            method: 'POST',
            headers: {
                // Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token,
            },
            body: JSON.stringify({
                date: date,
                type: type,
            })
        })
            .then(response => response.json())
            .then(result => {
                console.log(result);
                if (type === "Bar Chart") {
                    setData(result.occurrences);
                    setXAxis(result.date);
                } else {
                    setData(result);
                }
                setLoading(false);
            });
    }

    return (
        <div className="dashboard">
            <h2>Last Week's Overall Statistics</h2>
            <OverallStatistics />
            <div className="chart__header">
                <div>
                    <h2>Number of Cyberbullying Incidents</h2>
                    <label>
                        <input type="radio" name="type" defaultChecked onClick={() => setType("Bar Chart")} />
                        <img src={BarChartIcon} className="dashboard__type" alt="bar chart icon" />
                    </label>
                    <label>
                        <input type="radio" name="type" onClick={() => setType("Map View")} />
                        <img src={EarthIcon} className="dashboard__type" alt="earth icon" />
                    </label>
                </div>
                <Filter loadDailyStatistics={loadDailyStatistics} loadMonthlyStatistics={loadMonthlyStatistics} type={type} />
                {/* <div className="filter">
                        <div className="filter__type">
                            <p>Day</p>
                            <label className="switch">
                            
                                <input 
                                    id="timeSwitch" 
                                    type="checkbox" 
                                    defaultChecked={timeSwitch} 
                                    onClick={() => setTimeSwitch(timeSwitch => !timeSwitch)
                                }/>
                                <span className="slider round"></span>
                            </label>
                            <p>Month</p>
                        </div>
                        <div className="filter__time">
                            <div id="showFilter" onClick={() => toggleFilter(0, timeSwitch ? "filterYearContent" : "filterCalendar")} className="filter__text">
                                <p>2021</p>
                                <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                            </div>
                            {timeSwitch ? 
                            <div id="filterYearContent" className="time__content">
                                <p>2021</p>
                                <p>2020</p>
                            </div> : 
                            <div id="filterCalendar" className="filter__calendar__container">
                                <Calendar className="filter__calendar" onChange={setDate} value={date} maxDate={new Date()} />
                            </div>}
                        </div>
                    </div> */}
            </div>
            <div className="chart__container">
                {type === "Bar Chart" && !loading ?
                    <Bar
                        className="chart"
                        data={{
                            labels: xAxis,
                            datasets: [{
                                label: 'Incidents',
                                data: data,
                                backgroundColor: [
                                    'rgba(22, 27, 51, 1)',
                                ],
                            },
                            ],
                        }}
                        options={{
                            maintainAspectRatio: false,
                            responsive: true,
                        }}
                    />
                    : type === "Map View" && !loading ? <div style={{height: "100%"}}>
                        <Map setTooltip={setTooltip} dataProp={data} />
                        <ReactTooltip>{tooltip}</ReactTooltip>
                    </div>
                    : <div className="dashboard--loading">
                        <Loading />
                    </div>}
            </div>
        </div>
    )
}