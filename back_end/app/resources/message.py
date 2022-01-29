import tweepy
from requests_oauthlib import OAuth1
from flask import Blueprint, Response, request, json, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database import establish_connection
# from app.database import get_incidents_collection, get_profiles_collection
import datetime
from bson.json_util import dumps

import base64
# from base64 import b64encode
from pkcs7 import PKCS7Encoder
from Crypto import Random
from Crypto.Cipher import AES

message = Blueprint("message", __name__)

@message.route("/api/load_message", methods=["POST"])
@jwt_required()
def load_message():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = "SELECT message_id, message_text FROM messages WHERE message_method = (%s) AND role_id = (%s) AND organisation_id = (%s)";

    value = (request.get_json()["method"], request.get_json()["role_id"], get_jwt_identity())

    cursor.execute(query, value)

    return Response(json.dumps(cursor.fetchone()), mimetype="application/json", status=200)

@message.route("/api/save_message", methods=["POST"])
@jwt_required()
def save_message():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    # text = """test
    # test
    # test
    # test"""

    query = "UPDATE messages SET message_text = (%s) WHERE message_id = (%s)"

    # for result in cursor.execute(query, multi=True):
    #     print(result.fetchall())
    value = (request.get_json()["encrypted_message"], request.get_json()["message_id"])

    cursor.execute(query, value)

    connection.commit()

    connection.close()

    return Response(json.dumps("The message has been successfully saved."), mimetype="application/json", status=200)

def unpadPkcs7(data):
    return data[:-data[-1]] #Python 3

@message.route("/api/direct_message", methods=["POST"])
@jwt_required()
def direct_message():
    # api = current_app.config["tweepy_api"]
    auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])

    organisation_id = get_jwt_identity()
    recipient_id = request.get_json()["profile_twitter_id"]
    

    profile_id = request.get_json()["profile_id"]

    # query = "SELECT message_text FROM messages WHERE message_id = (%s)"

    # value = (request.get_json()["message_id"], )

    # cursor.execute(query, value)

    # message = cursor.fetchone()["message_text"]
    # print(message)
    print(recipient_id)
    encrypted_message = request.get_json()["encrypted_message"]

    response = {
        "message": "The message has been successfully sent."
    }
    try:

        connection = establish_connection()
        # cursor = connection.cursor(dictionary=True)
        cursor = connection.cursor()

        query = "SELECT organisation_twitter_token, organisation_twitter_secret_token FROM organisations WHERE organisation_id = (%s)"

        value = (organisation_id, )

        cursor.execute(query, value)

        tokens = cursor.fetchone()
        print(tokens)

        with open("aes_key.txt") as file:
            key = bytes(file.readlines()[0], "utf-8")

        decrypted_tokens = []
        for _, token in tokens.items():
            string_token = base64.b64decode(token)
            iv = string_token[:16]
            string_token = string_token[16:]
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted_token = cipher.decrypt(string_token)
            decrypted_token = unpadPkcs7(decrypted_token).decode("utf-8")
            decrypted_tokens.append(decrypted_token)

        auth.set_access_token(decrypted_tokens[0], decrypted_tokens[1])

        api = tweepy.API(auth)

        decoded_message = base64.b64decode(encrypted_message)
       

        iv = decoded_message[:16]
        decoded_message = decoded_message[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_message = cipher.decrypt(decoded_message)
        message = unpadPkcs7(decrypted_message).decode("utf-8")

        direct_message = api.send_direct_message(recipient_id, message)

        # account_id = get_jwt_identity()

        query = "INSERT INTO messages_histories (messages_history_text, messages_history_date, messages_history_method, organisation_id, profile_id, profile_role_id) VALUES (%s, %s, %s, %s, %s, %s)"
        value = (encrypted_message, datetime.datetime.fromtimestamp(request.get_json()["timestamp"] / 1000), request.get_json()["method"], organisation_id, profile_id, request.get_json()["profile_role_id"])

        cursor.execute(query, value)

        connection.commit()

        query = "UPDATE profiles SET support_id = %s WHERE profile_id = %s"
        value = (2, profile_id)

        cursor.execute(query, value)

        connection.commit()

    except tweepy.TweepError as tweep_error:
        if str(tweep_error) == "Twitter error response: status code = 401":
            response["message"] = "Invalid or expired token. Please authorise the app again with your organisation's Twitter account."
            response["twitter_login_required"] = True
            auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
            url = auth.get_authorization_url()
            response["request_token"] = auth.request_token
            response["twitter_login_url"] = url
            return Response(json.dumps(response), mimetype="application/json", status=200)

        response["message"] = tweep_error.args[0][0]["message"]

        error_code = tweep_error.args[0][0]["code"]

        print(error_code)
        if error_code == 108:
            response["message"] = response["message"] + " The user's account has been deactivated. The profile will be removed from the system."

            query = "UPDATE profiles SET role_id = (%s) WHERE profile_id = (%s)"
            value = (0, profile_id)
            cursor.execute(query, value)
            connection.commit()

            response["close_profile"] = True

        if error_code == 349:
            response["message"] = response["message"] + " The user did not allow Direct Message (DM) from outsiders."

        # response["message"] = response["message"] + " The incident will be deleted from the system."

        # response["error"] = True

        # query = "DELETE FROM incidents_associations WHERE incidents_associations.incidents_association_id = (%s)"

        # value = (request.get_json()["incidents_association_id"], )

        # cursor.execute(query, value)

        # connection.commit()

        # response["message"] = tweep_error.reason
    # print(direct_message)
    # if direct_message[0].get("code"):
    #     print("lol")
        # print(direct_message._json)
    # test = json.loads(dumps(get_profiles_collection().find()))
    # test = json.dumps(list(get_incidents_collection().find()))
    # tests = json.loads(dumps(get_incidents_collection().find()))

    connection.close()

    return Response(json.dumps(response), mimetype="application/json", status=200)

@message.route("/api/reply_tweet", methods=["POST"])
@jwt_required()
def reply_tweet():
    profile_id = request.get_json()["profile_id"]

    encrypted_message = request.get_json()["encrypted_message"]

    response = {
        "message": "The message has been successfully sent."
    }

    try:
        connection = establish_connection()
        # cursor = connection.cursor(dictionary=True, buffered=True)
        cursor = connection.cursor()

        auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
        organisation_id = get_jwt_identity()
        query = "SELECT organisation_twitter_token, organisation_twitter_secret_token FROM organisations WHERE organisation_id = (%s)"
        value = (organisation_id, )
        cursor.execute(query, value)
        tokens = cursor.fetchone()

        with open("aes_key.txt") as file:
            key = bytes(file.readlines()[0], "utf-8")

        decrypted_tokens = []
        for _, token in tokens.items():
            string_token = base64.b64decode(token)
            iv = string_token[:16]
            string_token = string_token[16:]
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted_token = cipher.decrypt(string_token)
            decrypted_token = unpadPkcs7(decrypted_token).decode("utf-8")
            decrypted_tokens.append(decrypted_token)

        auth.set_access_token(decrypted_tokens[0], decrypted_tokens[1])

        api = tweepy.API(auth)

        string_message = base64.b64decode(encrypted_message)

        iv = string_message[:16]
        string_message = string_message[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_message = cipher.decrypt(string_message)
        message = unpadPkcs7(decrypted_message).decode("utf-8")

        api.update_status(message, in_reply_to_status_id = request.get_json()["tweet_id"] , auto_populate_reply_metadata=True)

        query = """INSERT INTO messages_histories 
                    (messages_history_text, messages_history_date, messages_history_method, organisation_id, profile_id, profile_role_id) 
                    VALUES (%s, %s, %s, %s, %s, %s)"""
        value = (encrypted_message, datetime.datetime.fromtimestamp(request.get_json()["timestamp"] / 1000), 
                    request.get_json()["method"], organisation_id, profile_id, request.get_json()["profile_role_id"])

        cursor.execute(query, value)

        connection.commit()

        query = "UPDATE profiles SET support_id = %s WHERE profile_id = %s"
        value = (2, profile_id)

        cursor.execute(query, value)

        connection.commit()

    except tweepy.TweepError as tweep_error:
        response["message"] = tweep_error.args[0][0]["message"]
        error_code = tweep_error.args[0][0]["code"]
        print(error_code)
        print(response["message"])

        if error_code == 89:
            response["message"] = "Invalid or expired token. Please authorise the app again with your organisation's Twitter account."
            response["twitter_login_required"] = True
            auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
            url = auth.get_authorization_url()
            response["request_token"] = auth.request_token
            response["twitter_login_url"] = url
            return Response(json.dumps(response), mimetype="application/json", status=200)

        if error_code == 187:
            response["message"] = response["message"] + " Same text message cannot be sent to the same tweet twice."

        if error_code == 385:
            response["message"] = response["message"] + " The incident will be deleted from the system."

            response["error"] = True

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

                if associated_cyberbully_incidents == None and associated_cybervictim_incidents == None:
                    role_id = 0

                elif associated_cyberbully_incidents == None:
                    role_id = 2

                elif associated_cybervictim_incidents == None:
                    role_id = 1

                if role_id != None:
                    value = (role_id, associated_id["associated_id"])
                    cursor.execute(query, value)
                    connection.commit()
                
            cyberbully_query = "SELECT * FROM incidents_associations WHERE cyberbully_id = (%s)"

            cybervictim_query = "SELECT * FROM incidents_associations WHERE cybervictim_id = (%s)"

            value = (profile_id, )

            cursor.execute(cyberbully_query, value)
            cyberbully_incidents = cursor.fetchone()

            cursor.execute(cybervictim_query, value)
            cybervictim_incidents = cursor.fetchone()

            role_id = None

            if cyberbully_incidents == None and cybervictim_incidents == None:
                role_id = 0
                response["close_profile"] = True
                response["message"] = response["message"] + " The profile will be removed from the system since there are no related incidents."

            elif cyberbully_incidents == None:
                role_id = 2

            elif cybervictim_incidents == None:
                role_id = 1

            if role_id != None:
                response["refresh_profile"] = True
                value = (role_id, profile_id)
                cursor.execute(query, value)
                connection.commit()
            # return Response(json.dumps(response), mimetype="application/json", status=200)

    connection.close()
    return Response(json.dumps(response), mimetype="application/json", status=200)

@message.route("/api/load_message_history", methods=["POST"])
@jwt_required()
def load_message_history():
    organisation_id = get_jwt_identity()
    profile_id = request.get_json()["profile_id"]

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    # WHERE messages_histories.account_id = (%s) AND messages_histories.profile_id = (%s)

    query = """SELECT messages_history_text AS text, messages_history_date AS date, messages_history_method AS method, organisation_name, organisation_image, profile_username, profile_image, role_title AS role FROM messages_histories
                JOIN organisations ON messages_histories.organisation_id = organisations.organisation_id
                JOIN profiles ON messages_histories.profile_id = profiles.profile_id
                JOIN roles ON messages_histories.profile_role_id = roles.role_id
                WHERE messages_histories.profile_id = (%s)
                ORDER BY date DESC"""

    value = (profile_id, )

    cursor.execute(query, value)

    return Response(json.dumps(cursor.fetchall()), mimetype="application/json", status=200)