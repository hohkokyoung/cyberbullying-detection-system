import tweepy
from requests_oauthlib import OAuth1
from flask import Blueprint, Response, request, json, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import establish_connection
# from app.database import get_incidents_collection, get_profiles_collection
import datetime
from bson.json_util import dumps

notification = Blueprint("notification", __name__)

@notification.route("/api/load_notifications", methods=["GET"])
@jwt_required()
def load_notifications():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    # query = """SELECT CONVERT(SUM(CASE WHEN cyberbully_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cyberbully_notification, 
    #         CONVERT(SUM(CASE WHEN cybervictim_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cybervictim_notification 
    #         FROM incidents_associations""";

    # query = """SELECT CONVERT(SUM(CASE WHEN cyberbully_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cyberbully_notification, 
    #             CONVERT(SUM(CASE WHEN cybervictim_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cybervictim_notification 
    #             FROM (SELECT * FROM incidents_associations GROUP BY cyberbullying_id) AS incidents_associations"""

    query = """SELECT CONVERT(SUM(temporary_cyberbully_notification), CHAR) AS cyberbully_notification, CONVERT(SUM(temporary_cybervictim_notification), CHAR) AS cybervictim_notification 
                FROM (SELECT CONVERT(SUM(CASE WHEN cyberbully_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS temporary_cyberbully_notification, NULL AS temporary_cybervictim_notification
                FROM (SELECT * FROM incidents_associations AS cyberbully_associations 
                JOIN profiles ON cyberbully_associations.cyberbully_id = profiles.profile_id WHERE role_id != 0 GROUP BY cyberbullying_id) AS incidents_associations
                UNION
                SELECT NULL AS cyberbully_notification, CONVERT(SUM(CASE WHEN cybervictim_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cybervictim_notification
                FROM (SELECT * FROM incidents_associations AS cybervictim_associations 
                JOIN profiles ON cybervictim_associations.cybervictim_id = profiles.profile_id WHERE role_id != 0) AS incidents_associations) AS notifications
            """

    # value = (request.get_json()["role_id"], get_jwt_identity())

    cursor.execute(query)

    notifications = json.dumps(cursor.fetchone())

    connection.close()

    return Response(notifications, mimetype="application/json", status=200)

@notification.route("/api/update_notifications", methods=["POST"])
@jwt_required()
def update_notifications():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    chosen_filter = request.get_json()["chosen_filter"]

    profile_id = request.get_json()["profile_id"]

    query = "UPDATE incidents_associations";

    sub_query = " SET cyberbully_notification = 'read' WHERE cyberbully_id = (%s)" if chosen_filter == "cyberbully" else " SET cybervictim_notification = 'read' WHERE cybervictim_id = (%s)"

    query = query + sub_query

    value = (profile_id, )

    # value = (request.get_json()["role_id"], get_jwt_identity())

    cursor.execute(query, value)

    connection.commit()

    connection.close()

    return Response(json.dumps({"success": "The notifications has been successfully updated."}), mimetype="application/json", status=200)
