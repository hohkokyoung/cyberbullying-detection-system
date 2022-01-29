import requests
from flask import Blueprint, Response, request, json, current_app
from flask_jwt_extended import jwt_required
from app.database import establish_connection
# from app.database import get_incidents_collection
import datetime
from bson.json_util import dumps

incident = Blueprint("incident", __name__)

@incident.route("/api/incidents", methods=["GET", "POST"])
@jwt_required()
def get_incidents():
    profile_id = request.get_json()["profile_id"]
    # profile_role = request.get_json()["profile_role"]
    filter = request.get_json()["filter"]
    # test = json.loads(dumps(get_profiles_collection().find()))
    # test = json.dumps(list(get_incidents_collection().find()))
    # tests = json.loads(dumps(get_incidents_collection().find()))
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    # query = """SELECT incident_id, incident_message, incident_created_at, cyberbully.profile_username AS cyberbully_username, cyberbully.profile_image AS cyberbully_image, 
    #                     target.profile_username AS target_username, target.profile_image AS target_image, cybervictim.profile_username AS cybervictim_username,
    #                     cybervictim.profile_image AS cybervictim_image
	# 					FROM incidents
    #             JOIN incidents_associations ON incidents.incident_id = incidents_associations.cyberbullying_id
    #             JOIN profiles AS cyberbully ON incidents_associations.cyberbully_id = cyberbully.profile_id
    #             JOIN profiles AS target ON incidents_associations.replied_profile_id = target.profile_id
    #             JOIN profiles AS cybervictim ON incidents_associations.cybervictim_id = cybervictim.profile_id """

    query = """SELECT incidents_associations.incidents_association_id, incidents.incident_twitter_id AS twitter_id, cyberbullying_id,
                        incidents.incident_message AS cyberbullying_message, incidents.incident_date AS cyberbullying_date, 
                        replied_incident.incident_message AS replied_message, replied_incident.incident_date AS replied_date,
                        cyberbully.profile_username AS cyberbully_username, cyberbully.profile_image AS cyberbully_image,
                        replied_profile.profile_username AS replied_username, replied_profile.profile_image AS replied_image
                FROM incidents_associations
                JOIN incidents ON incidents.incident_id = incidents_associations.cyberbullying_id
                LEFT JOIN incidents AS replied_incident ON replied_incident.incident_id = incidents_associations.replied_id
                JOIN profiles AS cyberbully ON incidents_associations.cyberbully_id = cyberbully.profile_id
                LEFT JOIN profiles AS replied_profile ON replied_profile.profile_id = incidents_associations.replied_profile_id WHERE 
            """

    # print(profile_role)

    cyberbully_subquery = "cyberbully.profile_id = (%s)"

    cybervictim_subquery = "incidents_associations.cybervictim_id = (%s)"

    cyberbully_victim_subquery = cyberbully_subquery + " OR " + cybervictim_subquery

    query += cyberbully_subquery if filter == "cyberbully" else cybervictim_subquery
    print(query)

    query += " GROUP BY incidents_associations.cyberbullying_id ORDER BY cyberbullying_date DESC"

    value = (profile_id, )

    cursor.execute(query, value)
    
    incidents = cursor.fetchall()

    connection.close()
    
    return Response(json.dumps(incidents), mimetype="application/json", status=200)

@incident.route("/api/remove_incident", methods=["POST"])
@jwt_required()
def remove_incident():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True, buffered=True)
    cursor = connection.cursor()

    chosen_filter = request.get_json()["chosen_filter"]

    # if chosen_filter == "cyberbully":
    query = "SELECT incidents_association_id, cyberbullying_id, replied_id FROM incidents_associations WHERE incidents_associations.cyberbullying_id = (%s)"
    value = (request.get_json()["cyberbullying_id"], )
    cursor.execute(query, value)
    incidents_associations = cursor.fetchall()

    if chosen_filter == "cyberbully":
        query = "SELECT cybervictim_id AS associated_id FROM incidents_associations WHERE incidents_associations.incidents_association_id = (%s)"
    else:
        query = "SELECT cyberbully_id AS associated_id FROM incidents_associations WHERE incidents_associations.incidents_association_id = (%s)"
    
    if chosen_filter == "cyberbully":
        values = [(incidents_association["incidents_association_id"], ) for incidents_association in incidents_associations]
    else:
        incidents_association_ids = [request.get_json()["incidents_association_id"]]
        values = [(incidents_association_ids[0], )]

    associated_ids = []

    for value in values:
        cursor.execute(query, value)
        associated_ids.append(cursor.fetchone())

    query = "DELETE FROM incidents_associations WHERE incidents_associations.incidents_association_id = (%s)"

    values = [(incidents_association["incidents_association_id"], ) for incidents_association in incidents_associations] 
    # if chosen_filter == "cyberbully" else [(incidents_association, ) for incidents_association in incidents_association_ids] 
    cursor.executemany(query, values)

    connection.commit()

    query = "DELETE FROM incidents WHERE incident_id = (%s)"
    values = []
    for incident_association in incidents_associations:
        values.append((incident_association["cyberbullying_id"], ))
        if incident_association.get("replied_id"):
            values.append((incident_association["replied_id"], ))

    cursor.executemany(query, values)
    connection.commit()

    associated_cyberbully_query = "SELECT * FROM incidents_associations WHERE cyberbully_id = (%s)"
    associated_cybervictim_query = "SELECT * FROM incidents_associations WHERE cybervictim_id = (%s)"
    query = "UPDATE profiles SET role_id = (%s) WHERE profile_id = (%s)"

    for associated_id in associated_ids:
        associated_value = (associated_id["associated_id"], )
        cursor.execute(associated_cyberbully_query, associated_value)
        associated_cyberbully_incidents = cursor.fetchone()
        cursor.execute(associated_cybervictim_query, associated_value)
        associated_cybervictim_incidents = cursor.fetchone()

        role_id = None

        remove_associated_profile = False

        if associated_cyberbully_incidents == None and associated_cybervictim_incidents == None:
            role_id = 0
            # remove_associated_profile = True

        elif associated_cyberbully_incidents == None:
            role_id = 2

        elif associated_cybervictim_incidents == None:
            role_id = 1

        if role_id != None:
            value = (role_id, associated_id["associated_id"])
            cursor.execute(query, value)
            connection.commit()
        
    profile_role = request.get_json()["profile_role"]

    profile_id = request.get_json()["profile_id"]
    cyberbully_query = "SELECT * FROM incidents_associations WHERE cyberbully_id = (%s)"

    cybervictim_query = "SELECT * FROM incidents_associations WHERE cybervictim_id = (%s)"

    value = (profile_id, )

    cursor.execute(cyberbully_query, value)
    cyberbully_incidents = cursor.fetchone()

    cursor.execute(cybervictim_query, value)
    cybervictim_incidents = cursor.fetchone()

    response = {"success": "The incident has been successfully deleted."}

    if cyberbully_incidents == None and cybervictim_incidents == None:
        role_id = 0
        response["close_profile"] = True
        # temporary_message = " The current profile alongside the related profile will be removed from the system since there are no related incidents." if remove_associated_profile else " The profile will be removed from the system since there are no related incidents."
        response["success"] = response["success"] + " The profile will be removed from the system since there are no related incidents."

    elif cyberbully_incidents == None:
        role_id = 2

    elif cybervictim_incidents == None:
        role_id = 1

    else: 
        connection.close()

        return Response(json.dumps(response), mimetype="application/json", status=200)

    response["refresh_profile"] = True
    value = (role_id, profile_id)
    cursor.execute(query, value)
    connection.commit()

    connection.close()

    return Response(json.dumps(response), mimetype="application/json", status=200)
        

   

# """SELECT SUM(CASE WHEN cyberbully_id = 12 THEN 1 ELSE 0 END) AS cyberbullying_incidents, SUM(CASE WHEN cybervictim_id = 12 THEN 1 ELSE 0 END) AS cybervictim_incidents FROM profiles
# JOIN incidents_associations ON incidents_associations.cyberbully_id = profiles.profile_id OR incidents_associations.cybervictim_id = profiles.profile_id
# WHERE profile_id = 12
# """

# """
# DELETE incidents_associations FROM incidents_associations 
# JOIN profiles ON incidents_associations.cyberbully_id = profiles.profile_id OR incidents_associations.cybervictim_id = profiles.profile_id 
# WHERE profile_id = 19
# """

@incident.route("/api/conversation", methods=["GET"])
@jwt_required()
def get_conversation():
    headers = {"Authorization": "Bearer {}".format("AAAAAAAAAAAAAAAAAAAAAAQdLAEAAAAAqKV1HevCjUSxludPm0Vh0k1YA4U%3DYWeC0MlhQBUOKTbXvmD64IB4o0pVmrsC8vGnG6nzLLtAJ3uRRW")}
    feed_id = { "id": "1388720221033095168" }
    user_ids = []
    conversation = []
    while True:
        url = "https://api.twitter.com/2/tweets?ids={}&tweet.fields=conversation_id,created_at,author_id,referenced_tweets"
        url = url.format(feed_id["id"])
        
        #! Need to handle deleted tweets.
        
        feed = requests.get(url, headers=headers).json()["data"][0]
        reply = feed.get("referenced_tweets")
        user_ids.append(feed["author_id"])
        # reply = requests.get(url, headers=headers).json()["data"][0].get("referenced_tweets")
        # print(feed)
        # object_users = api.lookup_users(user_ids=[])
        conversation.append({
            "message": feed["text"],
            "created_at": feed["created_at"]
        })
        if reply is not None:
            for tweet in reply:
                if tweet["type"] == "replied_to":
                    feed_id["id"] = tweet["id"]
        else:
            break
    print(conversation)
    # for conversation in conversations:
    api = current_app.config["tweepy_api"]
    users = api.lookup_users(user_ids)

    # for feed in conversation:


    return Response("lol", mimetype="application/json", status=200)