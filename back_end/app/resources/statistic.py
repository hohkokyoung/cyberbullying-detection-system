from flask import Blueprint, Response, request, json, current_app
from flask_jwt_extended import jwt_required
# from app.database import get_incidents_collection, get_profiles_collection
from app.database import establish_connection
# from dateutil import tz
import datetime, time
from bson.json_util import dumps, loads

statistic = Blueprint("statistic", __name__)

months = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December"
}

@statistic.route("/api/statistic/filter/options", methods=["GET", "POST"])
@jwt_required()
def get_filter_options():
    # years = get_incidents_collection().aggregate([
    #     {
    #         "$match": { "type": "cyberbullying" }
    #     },
    #     { "$project": {
    #         "year": { "$year": "$date" }
    #     }},
    #     {
    #         "$group": {
    #             "_id": "$year"
    #         }
    #     }
    # ])

    filter_options = {
        "years": [],
        "earliest_date": "",
        "months": None,
    }

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()
    
    query = """SELECT DISTINCT YEAR(incident_date) AS incident_date_year 
                FROM incidents_associations 
                JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
            """

    cursor.execute(query)

    # print(cursor.fetchall())

    # for lol in cursor.fetchall():
    #     print(lol)

    filter_options["years"] = [year["incident_date_year"] for year in cursor.fetchall()]


    query = """SELECT MIN(incident_date) AS earliest_date
                FROM incidents_associations 
                JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
            """

    cursor.execute(query)

    # print(dict(cursor.fetchone()))

    filter_options["earliest_date"] = cursor.fetchone()["earliest_date"]

    if request.method == "POST":
        query = """SELECT DISTINCT MONTH(incident_date) AS incident_date_month
                    FROM incidents_associations 
                    JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                    WHERE YEAR(incident_date) = (%s)
                """

        cursor.execute(query, (request.get_json()["year"], ))
        filter_options["months"] = [year["incident_date_month"] for year in cursor.fetchall()]


    connection.close()
    
    # filter_options["first_date"] = 

    # [test] = json.dumps(cursor.fetchall())

    # print(test)
    # years = loads(dumps(years))
    # print(dumps(years))
    

    # for year in years:
    #     filter_options["years"].append(year["_id"])
    # first_date = get_incidents_collection().find({ "type": "cyberbullying" }).sort("date", 1).limit(1)
    # filter_options["first_date"] = first_date[0]["timestamp"]

    # filter_options["first_date"] = datetime.datetime.combine(first_date[0]["date"], datetime.time.min)
    # date = datetime.datetime.combine(first_date[0]["timestamp"], datetime.time.min)
    # print(date)

    return Response(json.dumps(filter_options), mimetype="application/json", status=200)

@statistic.route("/api/statistic/incidents/overall", methods=["GET"])
@jwt_required()
def get_overall_incidents():
    # test = get_incidents_collection().aggregate()
    today = datetime.date.today()
    last_monday = today - datetime.timedelta(days=today.weekday(), weeks=1)
    last_sunday = today - datetime.timedelta(today.weekday() % 7)

    # print(last_monday.strftime("%Y-%m-%d %H:%M:%S"))
    # print(last_sunday.strftime("%Y-%m-%d %H:%M:%S"))
    # print(last_sunday)
    #mktime() returns timestamp
    #fromtimestamp returns date object
    last_monday = datetime.datetime.fromtimestamp(time.mktime(last_monday.timetuple()))
    last_sunday = datetime.datetime.fromtimestamp(time.mktime(last_sunday.timetuple()))

    overall_statistics = []

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = """SELECT AVG(incidents_past_week_per_day) AS average_incidents_past_week FROM
                    (SELECT COUNT(DISTINCT incident_id) AS incidents_past_week_per_day
                        FROM incidents_associations 
                        JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                        WHERE incidents.incident_date BETWEEN (%s) AND (%s)
                        GROUP BY DAY(incidents.incident_date), MONTH(incidents.incident_date), YEAR(incidents.incident_date)) AS incidents_past_week
            """
    value = (last_monday, last_sunday)

    cursor.execute(query, value)

    average_incidents_past_week = cursor.fetchone()["average_incidents_past_week"] or 0

    average_incidents_past_week = round(float(average_incidents_past_week))

    # average_incidents_past_week = get_incidents_collection().aggregate([
    #     {
    #         "$match": {
    #             "type": "cyberbullying",
    #             "date": {"$gte": last_monday, "$lte": last_sunday}
    #         },
    #     },
    #     { "$group": {
    #         "_id": {
    #             "day": { "$dayOfMonth": "$date" },
    #             # "month": { "$month": "$timestamp" },
    #             # "year": { "$year": "$timestamp" }
    #         },
    #         "total": { "$sum": 1 },
    #     }},
    #     {
    #         "$group": {
    #             "_id": None,
    #             "average": { "$avg": "$total" },
    #         }
    #     }
    # ])
    # print(dumps(average_incidents_past_week))

    # print()

    # average_incidents_past_week = list(average_incidents_past_week)
    # average_incidents_past_week_value = round(average_incidents_past_week[0]["average"]) if average_incidents_past_week else 0

    overall_statistics.append({
        "category": "Average (Incidents)",
        "value": average_incidents_past_week,
        "subtext": "for the past week"
    })
    
    print(overall_statistics)

    query = """SELECT COUNT(*) AS total_incidents_past_week
                FROM
                    (SELECT incidents.incident_date
                    FROM incidents_associations 
                    JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                    WHERE incidents.incident_date BETWEEN (%s) AND (%s)
                    #GROUP BY incidents.incident_date
                    ) AS incidents_past_week
            """
    value = (last_monday, last_sunday)

    cursor.execute(query, value)
    total_incidents_past_week = cursor.fetchone()["total_incidents_past_week"]

    # total_incidents_past_week = get_incidents_collection().aggregate([
    #     {
    #         "$match": {
    #             "type": "cyberbullying",
    #             "date": {"$gte": last_monday, "$lte": last_sunday}
    #         },
    #     },
    #     { "$group": {
    #         "_id": {
    #             "day": { "$dayOfMonth": "$date" },
    #             # "month": { "$month": "$timestamp" },
    #             # "year": { "$year": "$timestamp" }
    #         },
    #         "total": { "$sum": 1 },
    #     }},
    #     {
    #         "$group": {
    #             "_id": None,
    #             "total": { "$sum": "$total" },
    #         }
    #     }
    # ])

    # # print(dumps(total_incidents_past_week))

    # total_incidents_past_week = list(total_incidents_past_week)
    # total_incidents_past_week_value = total_incidents_past_week[0]["total"] if total_incidents_past_week else 0

    overall_statistics.append({
        "category": "Total (Incidents)",
        "value": total_incidents_past_week,
        "subtext": "for the past week"
    })

    query = """SELECT COUNT(*) AS total_cyberbullies_past_week FROM 
                (SELECT *
                FROM incidents_associations 
                JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                WHERE incidents.incident_date BETWEEN (%s) AND (%s)
                GROUP BY cyberbully_id) AS incidents_past_week
            """
    value = (last_monday, last_sunday)

    cursor.execute(query, value)
    total_cyberbullies_past_week = cursor.fetchone()["total_cyberbullies_past_week"]

    # total_cyberbullies_past_week = get_profiles_collection().aggregate([
    #     {
    #         "$match": {
    #             "roles.title": "cyberbully",
    #             "roles.identified_at": {"$gte": last_monday, "$lte": last_sunday}
    #         },
    #     },
    #     { "$group": {
    #         "_id": {
    #             "day": { "$dayOfMonth": "$identified_at" },
    #             # "month": { "$month": "$timestamp" },
    #             # "year": { "$year": "$timestamp" }
    #         },
    #         "total": { "$sum": 1 },
    #     }},
    #     {
    #         "$group": {
    #             "_id": None,
    #             "total": { "$sum": "$total" },
    #         }
    #     }
    # ])

    # # print(dumps(total_cyberbullies_past_week))
    # total_cyberbullies_past_week = list(total_cyberbullies_past_week)
    # total_cyberbullies_past_week_value = total_cyberbullies_past_week[0]["total"] if total_cyberbullies_past_week else 0
    
    overall_statistics.append({
        "category": "Total (Cyberbullies)",
        "value": total_cyberbullies_past_week,
        "subtext": "for the past week"
    })

    query = """SELECT MAX(incidents_per_state) AS most_incidents_state_past_week, incident_state
                FROM (SELECT COUNT(*) AS incidents_per_state, incident_state
                FROM (SELECT *
                        FROM incidents_associations 
                        JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                        WHERE incidents.incident_date BETWEEN (%s) AND (%s) AND incidents.incident_state IS NOT NULL
                GROUP BY incidents_associations.cyberbullying_id) AS incidents_past_week
                GROUP BY incident_state) AS incidents_state_past_week
            """
    value = (last_monday, last_sunday)

    cursor.execute(query, value)
    most_incidents_state_past_week = cursor.fetchone()

    connection.close()

    most_incidents_state_past_week_value = most_incidents_state_past_week["incident_state"] if most_incidents_state_past_week["incident_state"] else "None"
    most_incidents_state_past_week_subtext = most_incidents_state_past_week["most_incidents_state_past_week"] if most_incidents_state_past_week["most_incidents_state_past_week"] != None else 0

    # most_incidents_state_past_week = get_incidents_collection().aggregate([
    #     {
    #         "$match": {
    #             "type": "cyberbullying",
    #             "date": {"$gte": last_monday, "$lte": last_sunday},
    #             "state": {
    #                 "$exists": True,
    #                 "$ne": None
    #             }
    #         },
    #     },
    #     { "$group": {
    #         "_id": "$state",
    #         "total": { "$sum": 1 },
    #     }},
    #     # {
    #     #     "$sort": {
    #     #         "total": -1,
    #     #     }
    #     # }
    #     {
    #         "$group": {
    #             "_id": None,
    #             "state": { "$first": "$_id"},
    #             "total": { "$max": "$total" },
    #         }
    #     }
    # ])

    # most_incidents_state_past_week = list(most_incidents_state_past_week)
    # most_incidents_state_past_week_value = most_incidents_state_past_week[0]["state"] if total_incidents_past_week else "None"
    # most_incidents_state_past_week_subtext = most_incidents_state_past_week[0]["total"] if total_incidents_past_week else 0

    overall_statistics.append({
        "category": "Most Incidents (State)",
        "value": most_incidents_state_past_week_value,
        # "subtext": f"for the past week with {most_incidents_state_past_week_subtext} incidents"
        "subtext": f"for the past week"
    })

    print(overall_statistics)

    # previous_month_last_day = datetime.date.today().replace(day=1) - datetime.timedelta(days=1)
    # previous_month_first_day = datetime.date.today().replace(day=1) - datetime.timedelta(days=previous_month_last_day.day)
    # current_month_first_day = datetime.date.today().replace(day=1)

    # average_incidents_weekly = get_incidents_collection().aggregate([
    #     {
    #         "$match": {
    #             "timestamp": {"$gte": last_monday, "$lte": last_sunday}
    #         },
    #     },
    #     { "$group": {
    #         "_id": {
    #             "day": { "$dayOfMonth": "$timestamp" },
    #             # "month": { "$month": "$timestamp" },
    #             # "year": { "$year": "$timestamp" }
    #         },
    #         "total": { "$sum": 1 },
    #     }},
    #     {
    #         "$group": {
    #             "_id": None,
    #             "average": { "$avg": "$total" },
    #         }
    #     }
    # ])

    return Response(json.dumps(overall_statistics), mimetype="application/json", status=200)

@statistic.route("/api/statistic/incidents/monthly", methods=["POST"])
@jwt_required()
def get_monthly_incidents():
    year = request.get_json()["year"] if request.method == "POST" else 2021;

    # statistics = get_incidents_collection().aggregate([
    #     { "$project": {
    #         "type": 1,
    #         "year": { "$year": "$date" },
    #         "month": { "$month": "$date" }
    #     }},
    #     {
    #         "$match": {
    #             "type": "cyberbullying",
    #             "year": year,
    #         }
    #     },
    #     { "$group": {
    #         "_id": "$month", 
    #         "total": { "$sum": 1 }
    #     }},
    #     { "$sort": { "_id": 1 } }
        # {"$group": { "_id": "$month", "count": { "$sum": 1 }}},
        # { "$sort": { "_id": 1 } }
    # ]);

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    dashboard_type = request.get_json()["type"]
    if dashboard_type == "Bar Chart":
        query = """SELECT COUNT(*) AS total_incident_month, MONTH(incident_date) AS incident_date_month
                    FROM 
                        (SELECT *
                        FROM incidents_associations 
                        JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                        WHERE YEAR(incidents.incident_date) = %s
                        GROUP BY incidents_associations.cyberbullying_id) AS incidents_by_year
                    GROUP BY MONTH(incident_date)
                    ORDER BY incident_date_month
                """
        value = (year, )
        cursor.execute(query, value)

        # filteredStatistics["months"]
        filteredStatistics = {
            "months": [],
            "occurrences": []
        }
        for statistic in cursor.fetchall():
            filteredStatistics["months"].append(months[statistic["incident_date_month"]])
            filteredStatistics["occurrences"].append(statistic["total_incident_month"])
    else:
        query = """SELECT COUNT(*) AS total_incidents, MONTH(incident_date) AS incident_date_month, incident_district
                    FROM 
                        (SELECT *
                        FROM incidents_associations 
                        JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                        WHERE YEAR(incidents.incident_date) = (%s) AND MONTH(incidents.incident_date) = (%s) AND incidents.incident_state IS NOT NULL
                        GROUP BY incidents_associations.cyberbullying_id) AS incidents_by_year
                    GROUP BY MONTH(incident_date), incident_district
                """
        value = (year, request.get_json()["month"])

        cursor.execute(query, value)

    # filteredStatistics["months"]
        filteredStatistics = cursor.fetchall()

    connection.close()
    return Response(json.dumps(filteredStatistics), mimetype="application/json", status=200)

@statistic.route("/api/statistic/incidents/daily", methods=["POST"])
@jwt_required()
def get_daily_incidents():
    date = datetime.datetime.fromisoformat(request.get_json()["date"][:-1]) if request.method == "POST" else datetime.datetime.utcnow()
    # print(date)
    # print(datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
    # print(datetime.datetime.combine(date, datetime.time.min))
    date = date.replace(tzinfo=current_app.config["from_zone"]).astimezone(tz=current_app.config["to_zone"]) 
    print(date)
    date = datetime.datetime.combine(date, datetime.time.min) + datetime.timedelta(days=1)
    # date = date + datetime.timedelta(days=8)
    print(date)

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    dashboard_type = request.get_json()["type"]
    
    if dashboard_type == "Bar Chart":
        query = """SELECT COUNT(*) AS incident_per_day, incident_date
                    FROM (SELECT DATE(incident_date) AS incident_date
                            FROM incidents_associations 
                            JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                            WHERE incidents.incident_date BETWEEN (%s) AND (%s)
                            GROUP BY incidents_associations.cyberbullying_id, incidents.incident_date) AS incidents
                    GROUP BY incident_date
                    ORDER BY incident_date
                """
        value = (date - datetime.timedelta(days=8), date)
        cursor.execute(query, value)

        filteredStatistics = {
            "date": [],
            "occurrences": []
        }

        for statistic in cursor.fetchall():
            print(statistic)
            filteredStatistics["date"].append(statistic["incident_date"].strftime("%d %b %Y"))
            filteredStatistics["occurrences"].append(statistic["incident_per_day"])

    else:
        # query = """SELECT COUNT(*) AS total_incidents, incident_district FROM (SELECT incidents.incident_date, incidents.incident_district
        #         FROM incidents_associations 
        #         JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
        #         WHERE incidents.incident_date BETWEEN (%s) AND (%s) AND incidents.incident_state IS NOT NULL
        #         GROUP BY DAY(incidents.incident_date)) AS incidents
        #         GROUP BY incident_district
        #     """
        query = """SELECT COUNT(*) AS total_incidents, incident_district
                    FROM 
                        (SELECT *
                        FROM incidents_associations 
                        JOIN incidents ON incidents_associations.cyberbullying_id = incidents.incident_id
                        WHERE incidents.incident_date BETWEEN (%s) AND (%s) AND incidents.incident_state IS NOT NULL
                        GROUP BY incidents_associations.cyberbullying_id) AS incidents_by_year
                    GROUP BY incident_district"""
        value = (date - datetime.timedelta(days=1), date)

        cursor.execute(query, value)

        filteredStatistics = cursor.fetchall()
        print(filteredStatistics)

    # statistics = get_incidents_collection().aggregate([
    #     {
    #         "$match": {
    #             "type": "cyberbullying",
    #             "date": {"$gte": date-datetime.timedelta(days=8), "$lte": date}
    #         },
    #     },
    #     { "$group": {
    #         "_id": {
    #             "day": { "$dayOfMonth": "$date" },
    #             "month": { "$month": "$date" },
    #             "year": { "$year": "$date" }
    #         },
    #         "total": { "$sum": 1 },
    #     }},
    #     {
    #         "$addFields" :{
    #             "date": {
    #                 "$concat": [
    #                     {"$toString": "$_id.day"},
    #                     "-",
    #                     {"$toString": "$_id.month"},
    #                     "-",
    #                     {"$toString": "$_id.year"},
    #                 ]
    #             }
    #         }
    #     },
    #     { "$project": 
    #         { "date": {
    #             "$toLong": {
    #                 "$dateFromString": {
    #                     "dateString": "$date"
    #                 }
    #             }
    #         },
    #         "total": 1,
    #     }},
    #     { "$sort": { "date": 1 } }
    # ])
    
        # filteredStatistics["date"].append(f"{statistic['_id']['day']} {months[statistic['_id']['month']][0:3]} {statistic['_id']['year']}")
        # filteredStatistics["occurrences"].append(statistic["total"])

    connection.close()
    return Response(json.dumps(filteredStatistics), mimetype="application/json", status=200)
    # return Response("lol", mimetype="application/json", status=200)
