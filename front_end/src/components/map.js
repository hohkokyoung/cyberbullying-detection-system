import React, { useState, useEffect, useContext, useMemo, memo } from 'react';
import { ZoomableGroup, ComposableMap, Geographies, Geography } from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { scaleQuantile } from 'd3-scale';
import { geoMercatorMalaysia } from "d3-composite-projections";

const Map = ({ dataProp, setTooltip }) => {
    const getHeatMapData = () => {
        return [
            { id: 'AP', incident_district: 'Petaling', total_incidents: parseInt(Math.random() * 100) },
        ]
    };

    const [data, setData] = useState(dataProp);
    const COLOR_RANGE = [
        // '#ffedea',
        // '#ffcec5',
        // '#ffad9f',
        // '#ff8a75',
        // '#ff5533',
        // '#e2492d',
        '#be3d26',
        '#9a311f',
        '#782618'
    ];

    const colorScale = scaleQuantile()
        .domain(data.map(item => item.total_incidents))
        .range(COLOR_RANGE);

    return (
        <ComposableMap
            data-tip=""
            projection={geoMercatorMalaysia().scale(5000)}
            width={900}
            height={500}
            style={{ width: "100%", height: "100%", outline: "none" }}>
            <ZoomableGroup>
                <Geographies geography={"/msia_topo.json"}>
                    {({ geographies }) =>
                        geographies.map(geo => {
                            const { DISTRICT, } = geo.properties;
                            let district = data?.find(item => { return item.incident_district.toLowerCase() === DISTRICT.toLowerCase() })
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onMouseEnter={() => {
                                        setTooltip(`${DISTRICT} — ${district ? district?.total_incidents : 0}`);
                                    }}
                                    onMouseLeave={() => {
                                        setTooltip("");
                                    }}
                                    style={{
                                        default: {
                                            fill: district ? colorScale(district.total_incidents) : "#EEE",
                                            // stroke: "#161B33",
                                            stroke: "#D6D6DA",
                                            outline: "none"
                                        },
                                        hover: {
                                            fill: "#161B33",
                                            outline: "none"
                                        },
                                        // pressed: {
                                        //     fill: "#E42",
                                        //     outline: "none"
                                        // }
                                    }}
                                />
                            )
                        })
                    }
                </Geographies>
            </ZoomableGroup>
        </ComposableMap>
    )
}

export default memo(Map);