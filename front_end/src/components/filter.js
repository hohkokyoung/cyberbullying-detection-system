import React, { useState, useEffect, useContext } from 'react';
import { Bar } from 'react-chartjs-2';
import '../static/css/dashboard.css';
// import Arrow from '../components/arrow.js';
import { api } from '../static/js/config.js';
import Incidents from '../components/incidents.js';
import { toggleFilter, resetFilter } from '../static/js/utils.js';
import ArrowIcon from '../static/media/icons/arrow.svg';
import TickIcon from '../static/media/icons/tick.svg';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { TokenContext } from '../context.js';

const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthsFullName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Filter({ loadMonthlyStatistics, loadDailyStatistics, type }) {
    const [timeSwitch, setTimeSwitch] = useState(true);
    const [date, setDate] = useState(new Date());
    const [month, setMonth] = useState((new Date()).getMonth());
    const [year, setYear] = useState(2021);
    const [filterOptions, setFilterOptions] = useState({});
    const token = useContext(TokenContext);

    useEffect(() => {
        timeSwitch ? loadMonthlyStatistics(month, year) : loadDailyStatistics(date);
        var interval = setInterval(timeSwitch ? () => loadMonthlyStatistics(month, year) : () => loadDailyStatistics(date), 300000);
        return _ => clearInterval(interval);
    }, [timeSwitch, type]);


    useEffect(() => {
        loadFilterOptions();
    }, [type]);

    const loadFilterOptions = () => {
        let url = `${api}/statistic/filter/options`;

        fetch(url, {
            method: timeSwitch && type === "Map View" ? 'POST' : 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token,
            },
            body: timeSwitch && type === "Map View" ? JSON.stringify({
                year: year,
            }) : null,
        })
            .then(response => response.json())
            .then(result => {
                // let firstDate = result.first_date;
                // firstDate = firstDate.substring(0, firstDate.length - 4)
                console.log(result)

                setFilterOptions({
                    'years': result.years,
                    'earliestDate': result.earliest_date && result.earliest_date.replace("GMT", ""),
                    'months': result?.months,
                });
            });
    }


    const selectDate = date => {
        setDate(date);
        loadDailyStatistics(date);
        toggleFilter(0, "filterCalendar");
    }

    return (
        <div className="filter">
            <div className="filter__type">
                <p>Day</p>
                <label className="switch">
                    {/* <label className="switch" onClick={() => {
                                document.getElementById("timeSwitch").checked
                                    ? loadMonthlyStatistics()
                                    : loadDailyStatistics();
                            }}> */}
                    <input
                        id="timeSwitch"
                        type="checkbox"
                        defaultChecked={timeSwitch}
                        onClick={() => {
                            // timeSwitch ? loadDailyStatistics() : loadMonthlyStatistics();
                            setTimeSwitch(timeSwitch => !timeSwitch)
                            resetFilter(0);
                        }
                        } />
                    <span className="slider round"></span>
                </label>
                <p>Month</p>
            </div>
            {timeSwitch && type === "Map View" && <div className="filter__time">
                <div id="showFilter" onClick={() => toggleFilter(0, "filterMonthContent")} className="filter__text">
                    <p>{monthsFullName[month - 1]}</p>
                    <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                </div>
                <div id="filterMonthContent" className="time__content">
                        {filterOptions?.months?.map(filterMonth =>
                            <label>
                                {monthsFullName[filterMonth - 1]}
                                <input type="radio" value={filterMonth} name="month" checked={month === filterMonth} onClick={() => {
                                    loadMonthlyStatistics(filterMonth, year);
                                    setMonth(filterMonth);
                                }} />
                                <div>
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                </div>
                            </label>
                        )}
                    </div>
            </div>}
            <div className="filter__time">
                <div id="showFilter" onClick={() => toggleFilter(timeSwitch && type === "Map View" ? 1 : 0, timeSwitch ? "filterYearContent" : "filterCalendar")} className="filter__text">
                    <p>{timeSwitch ? year : date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear()}</p>
                    <img src={ArrowIcon} alt="arrow icon" id="arrow" className="arrow__icon" />
                </div>
                {timeSwitch ?
                    <div id="filterYearContent" className="time__content">
                        {filterOptions?.years?.map(filterYear =>
                            <label>
                                {filterYear}
                                <input type="radio" value={filterYear} name="year" checked={year === filterYear} onClick={() => {
                                    loadMonthlyStatistics(month, filterYear);
                                    setYear(filterYear);
                                }} />
                                <div>
                                    <img src={TickIcon} alt="tick icon" className="tick__icon" />
                                </div>
                            </label>
                        )}
                    </div> :
                    <div id="filterCalendar" className="filter__calendar__container">
                        <Calendar className="filter__calendar" onChange={selectDate} value={date} minDate={new Date(filterOptions?.earliestDate)} maxDate={new Date()} />
                    </div>}
            </div>
        </div>
    );
}