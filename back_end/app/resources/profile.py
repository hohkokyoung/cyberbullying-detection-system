from flask import Blueprint, Response, request, json, current_app
from flask_jwt_extended import jwt_required
from app.database import establish_connection
import tweepy
# from app.database import get_profiles_collection, get_incidents_collection
import datetime
from bson.json_util import dumps
from bson.objectid import ObjectId
# import mysql.connector
from werkzeug.utils import secure_filename

import os

import base64
# from base64 import b64encode
from pkcs7 import PKCS7Encoder
from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.PublicKey import RSA

import tweepy

profile = Blueprint("profile", __name__)

@profile.route("/api/profiles", methods=["GET", "POST"])
@jwt_required()
def get_profiles():
    print(request.get_json())

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = "SET block_encryption_mode = 'aes-256-cbc'"
    cursor.execute(query)

    # query = """SELECT *, CONVERT(CEILING(COUNT(*) OVER() / 8), CHAR) AS page_count FROM 
    #             (SELECT *, CONVERT(SUM(temporary_cyberbully_notification), CHAR) AS cyberbully_notification, CONVERT(SUM(temporary_cybervictim_notification), CHAR) AS cybervictim_notification, CONVERT(SUM(partial_incidents), CHAR) AS total_incidents, (CASE WHEN total_incidents_past_month >= 20 THEN "high" WHEN total_incidents_past_month >= 10 THEN "medium" WHEN total_incidents_past_month IS NULL THEN NULL ELSE "low" END) AS toxicity FROM
    #             (SELECT cyberbully.profile_id AS id, cyberbully.profile_twitter_id AS twitter_id, cyberbully.profile_username AS username, cyberbully.profile_image AS image, cyberbully.role_id AS role_id,
    #                 role_title AS role, support_status, COUNT(DISTINCT(incidents_associations.cyberbullying_id)) AS partial_incidents,
    #                 COUNT(DISTINCT(CASE WHEN incidents.incident_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW() THEN incidents.incident_id ELSE NULL END)) AS total_incidents_past_month,
    #                 CONVERT(COUNT(DISTINCT(CASE WHEN cyberbully_notification = "unread" THEN 1 ELSE 0 END)), CHAR) AS temporary_cyberbully_notification, NULL AS temporary_cybervictim_notification
    #             FROM incidents_associations
    #             JOIN incidents ON incidents.incident_id = incidents_associations.cyberbullying_id
    #             JOIN profiles AS cyberbully ON incidents_associations.cyberbully_id = cyberbully.profile_id
    #             JOIN roles ON cyberbully.role_id = roles.role_id
    #             JOIN supports ON cyberbully.support_id = supports.support_id
    #             GROUP BY cyberbully.profile_id
    #             UNION
    #             SELECT cybervictim.profile_id, cybervictim.profile_twitter_id, cybervictim.profile_username, cybervictim.profile_image, cybervictim.role_id AS role_id,
    #                 role_title, support_status, COUNT(DISTINCT(incidents.incident_id)), NULL,
    #                 NULL, CONVERT(SUM(CASE WHEN cybervictim_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cybervictim_notification
    #             FROM incidents_associations
    #             JOIN incidents ON incidents.incident_id = incidents_associations.cyberbullying_id
    #             JOIN profiles AS cybervictim ON incidents_associations.cybervictim_id = cybervictim.profile_id
    #             JOIN roles ON cybervictim.role_id = roles.role_id
    #             JOIN supports ON cybervictim.support_id = supports.support_id
    #             GROUP BY cybervictim.profile_id) AS profiles
    #             GROUP BY id) AS profiles
    #             WHERE """

    query = """SELECT *, CONVERT(CEILING(COUNT(*) OVER() / 8), CHAR) AS page_count FROM
                (SELECT *, CONVERT(SUM(temporary_cyberbully_notification), CHAR) AS cyberbully_notification, 
                CONVERT(SUM(temporary_cybervictim_notification), CHAR) AS cybervictim_notification, 
                CONVERT(SUM(partial_incidents), CHAR) AS total_incidents, 
                (CASE WHEN total_incidents_past_month >= 20 THEN "high" WHEN total_incidents_past_month >= 10 THEN "medium" WHEN total_incidents_past_month IS NULL THEN NULL ELSE "low" END) AS toxicity
                FROM
                (SELECT *, CONVERT(COUNT(CASE WHEN cyberbully_notification_status = "unread" THEN 1 ELSE NULL END), CHAR) AS temporary_cyberbully_notification,
                NULL AS temporary_cybervictim_notification, CONVERT(SUM(incidents_past_month), CHAR) AS total_incidents_past_month, CONVERT(SUM(temporary_partial_incidents), CHAR) AS partial_incidents
                FROM (SELECT cyberbully.profile_id AS id, cyberbully.profile_twitter_id AS twitter_id, 
                cyberbully.profile_username AS username, cyberbully.profile_image AS image, cyberbully.role_id AS role_id,
                role_title AS role, support_status, COUNT(incidents_associations.cyberbullying_id) AS temporary_partial_incidents,
                COUNT(DISTINCT(CASE WHEN incidents.incident_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW() THEN incidents.incident_id ELSE NULL END)) AS incidents_past_month,
                #CONVERT(COUNT(CASE WHEN cyberbully_notification = "unread" THEN 1 ELSE NULL END), CHAR) AS temporary_cyberbully_notification, NULL AS temporary_cybervictim_notification
                cyberbully_notification AS cyberbully_notification_status, NULL
                FROM incidents_associations
                JOIN incidents ON incidents.incident_id = incidents_associations.cyberbullying_id
                JOIN profiles AS cyberbully ON incidents_associations.cyberbully_id = cyberbully.profile_id
                JOIN roles ON cyberbully.role_id = roles.role_id
                JOIN supports ON cyberbully.support_id = supports.support_id
                GROUP BY cyberbully.profile_id, incidents_associations.cyberbullying_id) AS profiles
                GROUP BY id
                UNION
                SELECT cybervictim.profile_id, cybervictim.profile_twitter_id, cybervictim.profile_username, cybervictim.profile_image, cybervictim.role_id AS role_id,
                role_title, support_status, NULL, NULL,
                NULL, NULL, NULL, CONVERT(SUM(CASE WHEN cybervictim_notification = "unread" THEN 1 ELSE 0 END), CHAR) AS cybervictim_notification, NULL, COUNT(DISTINCT(incidents.incident_id))
                FROM incidents_associations
                JOIN incidents ON incidents.incident_id = incidents_associations.cyberbullying_id
                JOIN profiles AS cybervictim ON incidents_associations.cybervictim_id = cybervictim.profile_id
                JOIN roles ON cybervictim.role_id = roles.role_id
                JOIN supports ON cybervictim.support_id = supports.support_id
                GROUP BY cybervictim.profile_id) AS profiles
                GROUP BY id) AS profiles
                WHERE """

    where_subquery = ""

    search = request.get_json()["search"]
    search = search[1:] if search and search[0] == "@" else search

    search_subquery = "CONVERT(AES_DECRYPT(SUBSTRING(FROM_BASE64(username), 17), %s, SUBSTRING(FROM_BASE64(username), 1, 16)) USING latin1) LIKE (%s)"

    search_value = ["%" + search + "%"]

    search_subquery = "(" + search_subquery + ")"

    where_subquery = where_subquery + search_subquery + " AND "

    support_values = []
    support_subquery = ""
    # query += "toxicity = (%s)"
    supports = request.get_json()["filter"]["supports"]
    if supports:
        # where_subquery = where_subquery + " AND "
        # toxicity_subquery += ["toxicity = (%s) " for toxic in toxicity]
 
        for support in supports:
            support_subquery += "support_status = (%s)"
            if support == supports[-1]:
                break
            support_subquery += " OR "

        support_values = supports

        support_subquery = "(" + support_subquery + ")"

    else:
        support_subquery = "support_status IS NULL"
    
    where_subquery = where_subquery + support_subquery + " AND "

    toxicity_values = []
    toxicity_subquery = ""
    # query += "toxicity = (%s)"
    toxicity = request.get_json()["filter"]["toxicity"]
    if toxicity:
        # where_subquery = where_subquery + " AND "
        # toxicity_subquery += ["toxicity = (%s) " for toxic in toxicity]
        for toxic in toxicity:
            toxicity_subquery += "toxicity = (%s)"
            # if toxic == toxicity[-1]:
            #     break
            toxicity_subquery += " OR "

        print(toxicity_subquery)

        toxicity_subquery += "toxicity IS NULL"

        toxicity_subquery = "(" + toxicity_subquery + ")"

        toxicity_values = toxicity
    else:
        toxicity_subquery = "toxicity IS NULL"

    where_subquery = where_subquery + toxicity_subquery + " AND "

    role_values = []
    role_subquery = ""

    roles = request.get_json()["filter"]["roles"]
    if roles:
        role_subquery = ""

        for role in roles:
            role_subquery += "role = (%s)"
            if role == roles[-1]:
                break
            role_subquery += " OR "

        role_values = roles

        role_subquery = "(" + role_subquery + ")"

    else:
        role_subquery = "role IS NULL"
    
    where_subquery += role_subquery

    query += where_subquery

    query += " LIMIT 8 "

    page_number = request.get_json()["page_number"]
    offset = page_number * 8

    query += f"OFFSET {offset}"
    offset_value = [offset]

    with open("aes_key.txt") as file:
        key = bytes(file.readlines()[0], "utf-8")

    value = tuple([key] + search_value + support_values + toxicity_values + role_values)

    print(query)
   
    cursor.execute(query, value)
    profiles = cursor.fetchall()
    print(profiles)

    connection.close()


    # profiles = get_profiles_collection().aggregate([
    #     # {
    #     #     "$match" : { "roles.title": "cyberbully"}
    #     # },
    #     {
    #         "$project": {
    #             # "document": "$$ROOT",
    #             "_id": 1,
    #             "twitter_id": 1,
    #             "username": 1,
    #             "image": 1,
    #             "roles": 1,
    #             "cyberbullying_incidents": { "$size": { "$ifNull": [ "$incidents.cyberbullying", [] ] } },
    #             "total_incidents": {
    #                 "$add": [ { "$size": { "$ifNull": [ "$incidents.cyberbullying", [] ] } }, { "$size": { "$ifNull": [ "$incidents.cyberbullied", [] ] } } ]
    #             }
    #         }
    #     }
    #     # {
    #     #     "$group": {
    #     #         "_id": "$username",
    #     #         "total": {
    #     #             "$sum": [ { "$size": "$incidents.cyberbullying" }, { "$size": "$incidents.cyberbullied" } ]
    #     #         }
    #     #     }
    #     # }
    # ])
    # profiles = json.loads(dumps(profiles))
    # print(profiles)
    # # for profile in profiles:
    # #     incident_ids = profile["incidents"]
    # #     object_incident_ids = []

    # #     for incident_id in incident_ids:
    # #         object_incident_ids.append(ObjectId(incident_id))

    # #     incidents = get_incidents_collection().find({ "_id": { "$in": object_incident_ids } })

    # #     for incident in incidents:
    # #         print(incident)
    # return Response(json.dumps(profiles), mimetype="application/json", status=200)
    return Response(json.dumps(profiles), mimetype="application/json", status=200)

# def formulate_subquery(list, subquery):

#     return subquery

BLOCK_SIZE = 16
key = b"1234567890123456" 

# def pad(data):
#     length = BLOCK_SIZE - (len(data) % BLOCK_SIZE)
#     return data + chr(length)*length

def pad(data):
    length = 16 - (len(data) % 16)
    return data + chr(length)*length

def decrypt_from_cryptoJS(encrypted, iv):
    key = base64.b64decode("aR1h7EefwlPNVkvTHwfs6w==")                # Interpret key as Base64 encoded   
    aes = AES.new(key, AES.MODE_CBC, iv)                              # Use CBC-mode
    encrypted = aes.decrypt(encrypted)                                # Remove Base64 decoding
    return encrypted

def unpadPkcs7(data):
    # return data[:-ord(data[-1])]
    return data[:-data[-1]] #Python 3

# def unpad(data):
#     return data[:-(data[-1] if type(data[-1]) == int else ord(data[-1]))]


# @profile.route("/api/xD", methods=["GET"])
# def xD():
#     auth = tweepy.OAuthHandler("ojzrgMUrN1uubxn8TRcsoeL9m",
#         "KezayLvFeK9AiITvlka3UmYwuGijsAjdHTHFR36m9CrtaS7JwK")

#     verifier_code = input('PIN: ')
#     print(verifier_code)

#     token = auth.get_access_token(verifier = verifier_code)
#     print(token)
    
#     return Response(json.dumps("lol"), mimetype="application/json", status=200)

@profile.route("/api/lol", methods=["GET"])
def lol():

    # auth = tweepy.OAuthHandler("ojzrgMUrN1uubxn8TRcsoeL9m",
    #     "KezayLvFeK9AiITvlka3UmYwuGijsAjdHTHFR36m9CrtaS7JwK")
    # print(auth.get_authorization_url())

    # api = current_app.config["tweepy_api"]
    # print(api.get_user("robot4213").location)    

    # verifier_code = input('PIN: ')
    # print(verifier_code)

    # token = auth.get_access_token(verifier = verifier_code)
    # print(token)

    # t_auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
    # t_auth.set_access_token(token[0], token[1])
    # the_api = tweepy.API(t_auth)
    # the_api.update_status(status = "Look at me using tweepy")


    # connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)

    # query = "SET block_encryption_mode = 'aes-256-cbc'"
    # cursor.execute(query)

    # # connection.commit()

    # query = "SELECT AES_DECRYPT(SUBSTRING(FROM_BASE64(profile_twitter_id), 17), 'UkXp2s5v8x/A?D(G+KbPeShVmYq3t6w9', SUBSTRING(FROM_BASE64(profile_twitter_id), 1, 16)) AS twitter_id FROM profiles WHERE profile_id = 20;"
    # cursor.execute(query)

    # # joinedDataB64 = "sbYEr73hZVKviuQ2rt5RcJ5ugpn7XBLTtZIKKk5JjTXmGojFkAS+dK0D8NNAET6bC/Ai4sx+El5Bzu4igT1S9g=="
    # # joinedDataB64 = request.get_json()["message_text"]
    # # joinedData = base64.b64decode(joinedDataB64)
    # # iv = joinedData[:16]                                                # Determine IV from concatenated data
    # # encrypted = joinedData[16:]                                         # Determine ciphertext from concatenated data

    # # decrypted = unpadPkcs7(decrypt_from_cryptoJS(encrypted, iv))        # Decrypt and remove PKCS7-padding manually
    # # print(decrypted)

    # # twitter_id = cursor.fetchone()["twitter_id"].decode("utf-8")
    # # print(request.get_json()["message_text"])
    # message_text = base64.b64decode(request.get_json()["encrypted_message"])
    # # message_text = "54fcf9b4aba06f031b1443c8ab769237dd2caeda454c2e66d7dde09f1cc05f1ckNxC6cbDZCl5lU0mfaMT4w=="
    # with open("aes_key.txt") as file:
    #     key = bytes(file.readlines()[0], "utf-8")

    # encoder = PKCS7Encoder()
    # encoded_message = encoder.encode("""sadsaoijdqwiojdoiwqjoidjqwiojdioqwjdoiqwjiodjqwiodjwqiojdowqjdwoidjacoiwjdiowdjiowqjdoiqwjdiowqjdioqwjiodjwqijdiowqjdiowqjdiojqwiodjwqiojdoiwqjdioqwjdiowqjdoiwqjiodjwqiodjoqiwjdiowqjdoiwqjdiowqjiodjwqoidjqwiojdiowqjdiowqjdoiqwjdoiwqjdiowqjiodjwqiodjiwoqjdoiwqjdoiqwjdioqwjdioqwjdiowqjoidjwqoidjoiwqjdiowqjdioqwjdoiwqjoidwqjiodjwqiodjoiqwjqwojdqwioqwdwqdwqdwqdowqjdoiwqjdoqwijdoiwqjdioqwjiodjwqiodjiowqjdiowqjdiowqjidoqwjiodjwqiojdioqwjdiowqjdiojwidjiowqdwqdwqdwdwdwdwdwdqiodjwqiojdwqiodjoiqwjdioqwjdijwqiodjiwoqjdiwjiijwdjiwjdiwjidwjidjwidjiwjjjdjiiiisidsadsaoijdqwiojdoiwqjoidjqwiojdioqwjdoiqwjiodjqwiodjwqiojdowqjdwoidjacoiwjdiowdjiowqjdoiqwjdiowqjdioqwjiodjwqijdiowqjdiowqjdiojqwiodjwqiojdoiwqjdioqwjdiowqjdoiwqjiodjwqiodjoqiwjdiowqjdoiwqjdiowqjiodjwqoidjqwiojdisadsadsadsadqwdjwqiodjiqwjddwdwwwdw""")
    # iv = Random.new().read( 16 )
    # cipher = AES.new(key, AES.MODE_CBC, iv)
    # # # return 
    # # return cipher
    # encoded_message = base64.b64encode(iv + cipher.encrypt(encoded_message.encode("utf-8")))
    # encrypted_message = encoded_message.decode('ascii')
    # print(len(encrypted_message))

    # # message_text = message_text.decode("utf-8")

    # print(message_text)

    # with open("aes_key.txt") as file:
    #     key = bytes(file.readlines()[0], "utf-8")
    #     # key = base64.b64decode(file.readlines()[0])

    # # message_text = message_text.decode("utf-8")

    # print("hehehe")
    # iv = message_text[:16]
    # print(iv)
    # encrypted_message = message_text[16:]
    # print(iv)
    # print(encrypted_message)
    # print("middle")
    # cipher = AES.new(key, AES.MODE_CBC, iv)
    # print("xDDD")
    # # print(cipher.decrypt(encrypted_message).decode("utf-8"))
    # test = cipher.decrypt(encrypted_message)
    # print(test.decode("utf-8").encode("utf8").strip())
    # # print(test[:-ord(test[-1])])
    # # unpad = lambda s : s[:-ord(s[len(s)-1:])]

    # print(unpadPkcs7(test).decode("utf-8"))
    # # print(unpadPkcs7(test).decode("utf-8"))

    # # print(PKCS7Encoder().decode(test))

    # print("hmm")



    # return Response("lol", mimetype="application/json", status=200)

    # return Response(json.dumps(cursor.fetchall()), mimetype="application/json", status=200)

    # print(request.get_json())

    # data = base64.b64encode(b'base64 encoded string')

    # ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    # print(ROOT_DIR)

    # data = str.encode("wtf")
    # # data = b64decode("ibirgCQu8TwtJOaKKtMLxw==")
    # # data = base64.b64encode("wtf bro")
    # # print("asdqwdSDasd")
    # # print(data)



    # with open("aes_key.txt") as file:
    #     key = bytes(file.readlines()[0], "utf-8")
    # # master_key = b'1234567890123456'

    # encoder = PKCS7Encoder()
    # raw = encoder.encode("139504475323061")
    # iv = Random.new().read( 16 )
    # cipher = AES.new(key, AES.MODE_CBC, iv)
    # # # return 
    # # return cipher
    # encoded = base64.b64encode(iv + cipher.encrypt(raw.encode("utf-8")))
    # data = encoded.decode('ascii') 
    # return data




    # return Response(json.dumps("lol"), mimetype="application/json", status=200)
    # IV = Random.new().read(BLOCK_SIZE)
    # aes = AES.new(key, AES.MODE_CBC, IV)
    # return base64.b64encode(IV + aes.encrypt(pad(raw))).decode('ascii') 
    return Response(json.dumps("lol"), mimetype="application/json", status=200)

# @profile.route("/api/heh", methods=["GET"])
# def heh():
#     key_pair = RSA.generate(1024)
#     private_key = open("privatekey.pem", "w")
#     print(key_pair.exportKey())
#     private_key.write(key_pair.exportKey().decode("utf-8"))
#     private_key.close()
#     public_key = open("public_key.pem", "w")
#     public_key.write(key_pair.publickey().exportKey().decode("utf-8"))
#     public_key.close()
#     return Response(json.dumps("lol"), mimetype="application/json", status=200)
