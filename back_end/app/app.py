from flask import Flask, render_template, jsonify, session
import sys, os, tweepy, json, pymongo, os, random, datetime, time, requests, string, pickle, pandas, malaya
from .database import establish_connection
# from .database import initialise_database, get_incidents_collection, get_profiles_collection
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from .resources.profile import profile
from user import user
from statistic import statistic
from incident import incident
from message import message
from account import account
from organisation import organisation
from notification import notification
from flask_cors import CORS
from dateutil import tz
from bson.json_util import dumps
from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences
from urllib3.exceptions import ProtocolError
from http.client import IncompleteRead

from nltk.stem import WordNetLemmatizer
import nltk
from nltk.corpus import stopwords
# nltk.download("stopwords")
# nltk.download("wordnet")

import base64
# from base64 import b64encode
from pkcs7 import PKCS7Encoder
from Crypto import Random
from Crypto.Cipher import AES

os.environ["ENV_FILE_LOCATION"] = "./.env"

app = Flask(__name__)
app.config.from_envvar("ENV_FILE_LOCATION")
jwt = JWTManager(app)
CORS(app)


#Configure timezone to Asia/Kuala Lumpur
app.config["from_zone"] = tz.tzutc()
app.config["to_zone"] = tz.tzlocal()

# client = pymongo.MongoClient("mongodb://admin:admin@localhost:27017/database?authSource=admin")

# initialise_database(client)

app.secret_key = app.config["JWT_SECRET_KEY"]

bcrypt = Bcrypt(app)
app.register_blueprint(user)
app.register_blueprint(statistic)
app.register_blueprint(profile)
app.register_blueprint(incident)
app.register_blueprint(message)
app.register_blueprint(account)
app.register_blueprint(organisation)
app.register_blueprint(notification)

# test_db = client.test
# test_data = test_db.test_data 

auth = tweepy.OAuthHandler(app.config["CONSUMER_KEY"], app.config["CONSUMER_SECRET_KEY"])
auth.set_access_token(app.config["ACCESS_TOKEN"], app.config["ACCESS_SECRET_TOKEN"])

api = tweepy.API(auth)

app.config["tweepy_api"] = api

# print(value)
# print(newest_value)
#2021-04-28 01:24:43.344000


def convert_to_date(timestamp):
    return datetime.datetime.fromtimestamp(timestamp)

def update_profile(id, username, image, role, key):
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = "SET block_encryption_mode = 'aes-256-cbc'"
    cursor.execute(query)

    query = """SELECT profile_id, role_title, support_status FROM profiles 
                INNER JOIN roles ON profiles.role_id = roles.role_id 
                INNER JOIN supports ON profiles.support_id = supports.support_id 
                WHERE AES_DECRYPT(SUBSTRING(FROM_BASE64(profiles.profile_twitter_id), 17), %s, 
                SUBSTRING(FROM_BASE64(profiles.profile_twitter_id), 1, 16)) = %s"""
    value = (key, id)

    cursor.execute(query, value)
    
    profile = cursor.fetchone()

    print(profile)


    if profile is not None:
        # roles = ["cyberbully", "cybervictim"]

        profile_id = profile["profile_id"]
        profile_role = profile["role_title"]
        profile_support_status = profile["support_status"]

        if profile_support_status == "offered" and (profile_role == "cyberbully" or profile_role == "cyberbully-victim") and role["title"] == "cyberbully":
            support_status_id = 3
        elif profile_support_status == "offered" and (profile_role == "cyberbully" or profile_role == "cyberbully-victim") and role["title"] == "cybervictim":
            support_status_id = 2
        elif profile_support_status == "offered" and (profile_role == "cybervictim" or profile_role == "none"):
            support_status_id = 2
        elif profile_support_status == "offered yet continues":
            support_status_id = 3
        else:
            support_status_id = 1

        query = ("UPDATE profiles SET role_id = %s, support_id = %s WHERE profile_id = %s")

        if profile_role == "none":
            value = (role["id"], support_status_id, profile_id)

        elif profile_role != role["title"]:
            value = (3, support_status_id, profile_id)

        else:
            value = (role["id"], support_status_id, profile_id)

        cursor.execute(query, value)
        connection.commit()

    else:   
        query = "INSERT INTO profiles (profile_twitter_id, profile_username, profile_image, role_id, support_id) VALUES (%s, %s, %s, %s, %s)"
        
        encoder = PKCS7Encoder()

        encoded_twitter_id = encoder.encode(str(id))
        encoded_username = encoder.encode(str(username))

        iv = Random.new().read( 16 )
        cipher = AES.new(key, AES.MODE_CBC, iv)

        encrypted_twitter_id = base64.b64encode(iv + cipher.encrypt(encoded_twitter_id.encode("utf-8")))
        encrypted_twitter_id = encrypted_twitter_id.decode('ascii') 
        
        iv = Random.new().read( 16 )
        cipher = AES.new(key, AES.MODE_CBC, iv)

        encrypted_username = base64.b64encode(iv + cipher.encrypt(encoded_username.encode("utf-8")))
        encrypted_username = encrypted_username.decode('ascii') 

        value = (encrypted_twitter_id, encrypted_username, image, role["id"], 1)

        cursor.execute(query, value)
        
        connection.commit()

        profile_id = cursor.lastrowid

    connection.close()
    return profile_id

def preprocess_text(message):
    message = message.lower()
    message = message.replace(r"^.+@[^\.].*\.[a-z]{2,}$",
                                 "emailaddress")
    message = message.replace(r"^http\://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(/\S*)?$",
                                  "webaddress")
    # Replace numbers with "numbr"
    message = message.replace(r"\d+(\.\d+)?", "number")


    message = " ".join(term for term in message.split() if term not in string.punctuation)

    stop_words = set(stopwords.words("english") + ["u", "ü", "ur", "4", "2", "im", "dont", "doin", "ure"])
    message = " ".join(term for term in message.split() if term not in stop_words)

    lem=WordNetLemmatizer()
    message = " ".join(lem.lemmatize(t, "v") for t in message.split())

    sastrawi = malaya.stem.sastrawi()
    message =  " ".join(sastrawi.stem(t) for t in message.split())

    stopwords_ms = pandas.read_csv(os.path.join(app.root_path, 'stopwords-ms.csv'))
    stopwords_ms = stopwords_ms["words"].values.tolist() + ["anda", "awak", "benar", "kamu"]

    message = " ".join(term for term in message.split() if term not in stopwords_ms)
    return message

class StreamListener(tweepy.StreamListener):
    def on_status(self, data):
        #Filter tweets with only mentioned users.
        mentioned_user_ids = [user_mention["id"] for user_mention in data.entities["user_mentions"]]

        if mentioned_user_ids:

            #!Machine learning model predicts cyberbullying tweets.
            #Text Preprocessing
            message = preprocess_text(data.text)

            with open(os.path.join(app.root_path, 'tf_vec.pkl'), 'rb') as handle:
                tf_vec = pickle.load(handle)
            message = tf_vec.transform([message])

            # with open(os.path.join(app.root_path, 'tokenizer.pickle'), 'rb') as handle:
            # tokenizer = pickle.load(handle)

            # sequence = tokenizer.texts_to_sequences([message])
            # message = pad_sequences(sequence, maxlen=200)
            with open(os.path.join(app.root_path, 'model.pkl'), 'rb') as handle:
                model = pickle.load(handle)
            prediction = model.predict(message)[0]

            print(prediction)

            if prediction == 1:
            # if prediction > 0.5:
            # if True:
                #Convert milliseconds of timestamps to local date.
                date = convert_to_date(int(data.timestamp_ms) / 1000)

                print(json.dumps(data._json, indent=4, sort_keys=True))

                cyberbullying_incident = {
                    "id": data.id,
                    "type": "cyberbullying",
                    "message": data.text,
                    "created_at": date,
                }

                place = data.place
                if place:
                    place_id = data.place.id
                    place = api.geo_id(place_id).contained_within[0]

                    cyberbullying_incident.update({
                        "district": place.name,
                        "state": place.full_name.rsplit(", ", 1)[1]
                    })

                replied_status_id = data.in_reply_to_status_id
                replied_incident = {}

                if replied_status_id:
                    url = "https://api.twitter.com/2/tweets?ids={}&tweet.fields=conversation_id,created_at,author_id,referenced_tweets"
                    url = url.format(replied_status_id)
                    replied_data = requests.get(url, headers={"Authorization": "Bearer {}".format(app.config["BEARER_TOKEN"])}).json()["data"][0]

                    replied_incident = {
                        "id": replied_status_id,
                        "type": "replied",
                        "message": replied_data["text"],
                        "created_at": convert_to_date(datetime.datetime.timestamp(datetime.datetime.fromisoformat(replied_data["created_at"][:-1]))) + datetime.timedelta(hours=8)
                    }

                incidents = []
                incidents.append(cyberbullying_incident)
                if bool(replied_incident): incidents.append(replied_incident)

                connection = establish_connection()
                cursor = connection.cursor()
                query = "INSERT INTO incidents (incident_twitter_id, incident_message, incident_date, incident_district, incident_state) VALUES (%s, %s, %s, %s, %s)"

                with open("aes_key.txt") as file:
                    key = bytes(file.readlines()[0], "utf-8")
                # master_key = b'1234567890123456'

                encoder = PKCS7Encoder()

                incident_ids = []
                for incident in incidents:
                    encoded_id = encoder.encode(str(incident["id"]))
                    encoded_message = encoder.encode(str(incident["message"]))
                    iv = Random.new().read( 16 )
                    cipher = AES.new(key, AES.MODE_CBC, iv)
                    # # return 
                    # return cipher
                    encrypted_id = base64.b64encode(iv + cipher.encrypt(encoded_id.encode("utf-8")))
                    encrypted_id = encrypted_id.decode('ascii') 

                    iv = Random.new().read( 16 )
                    cipher = AES.new(key, AES.MODE_CBC, iv)

                    encrypted_message = base64.b64encode(iv + cipher.encrypt(encoded_message.encode("utf-8")))
                    encrypted_message = encrypted_message.decode('ascii') 


                    value = (encrypted_id, encrypted_message, incident["created_at"], incident.get("district", None), incident.get("state", None))
                    cursor.execute(query, value)
                    connection.commit()
                    incident_ids.append(cursor.lastrowid)

                connection.close()

                cyberbullying_id, *replied_id = incident_ids

                #Cybervictim
                role = {
                    "id": 2,
                    "title": "cybervictim",
                    # "identified_at": date,
                }

                if data.in_reply_to_user_id not in mentioned_user_ids:
                    mentioned_user_ids.append(data.in_reply_to_user_id)

                #Remove @ to itself
                mentioned_user_ids = [mentioned_user_id for mentioned_user_id in mentioned_user_ids if mentioned_user_id != data.user.id]
                searched_twitter_profiles = api.lookup_users(user_ids=mentioned_user_ids)

                cybervictim_ids = []

                replied_profile_id = None

                for searched_twitter_profile in searched_twitter_profiles:
                    cybervictim_id = update_profile(searched_twitter_profile.id, searched_twitter_profile.screen_name, searched_twitter_profile.profile_image_url, role, key)
                    cybervictim_ids.append(cybervictim_id)
                    if data.in_reply_to_user_id == searched_twitter_profile.id:
                        replied_profile_id = cybervictim_id

                #Cyberbully
                role = {
                    "id": 1,
                    "title": "cyberbully",
                    # "identified_at": date,
                }
            
                cyberbully_id = update_profile(data.user.id, data.user.screen_name, data.user.profile_image_url, role, key)

                replied_profile_id = None if data.in_reply_to_status_id is None else cyberbully_id if replied_profile_id is None else replied_profile_id

                connection = establish_connection()
                cursor = connection.cursor()

                query = """INSERT INTO incidents_associations (cyberbullying_id, replied_id, cyberbully_id, cybervictim_id, replied_profile_id, 
                            cyberbully_notification, cybervictim_notification) VALUES (%s, %s, %s, %s, %s, %s, %s)"""

                values = []

                for cybervictim_id in cybervictim_ids:
                    values.append((cyberbullying_id, replied_id[0] if replied_id else None, cyberbully_id, cybervictim_id, replied_profile_id, "unread", "unread"))

                print(values)
                cursor.executemany(query, values)
                connection.commit()
                connection.close()

if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
    stream_listener = StreamListener()
    stream = tweepy.Stream(auth=auth, listener=stream_listener)

    while True:
        try:
            # follow = ["1346168138212077569"]
            # stream.filter(follow=follow)
            #Petaling and Kuala Lumpur District Only
            # stream.filter(locations=[101.62031, 3.070566, 101.682108, 3.121647])

            #Entire Country
            stream.filter(locations=[100.085756871, 0.773131415201, 119.181903925, 6.92805288332])
        except (ProtocolError, AttributeError, IncompleteRead):
            continue


if __name__ == "__main__":
    # app.jinja_env.auto_reload = True
    # app.config["TEMPLATES_AUTO_RELOAD"] = True
    # app.before_request(before_request)
    # app.jinja_env.auto_reload = True
    # app.config["TEMPLATES_AUTO_RELOAD"] = True
    # app.config["TEMPLATES_AUTO_RELOAD"] = True      
    # app.jinja_env.auto_reload = True
    # app.run(debug=True, host="0.0.0.0")

    app.run(debug=True, use_reloader=False)



# with open(os.path.join(app.root_path, 'tokenizer.pickle'), 'rb') as handle:
#     tokenizer = pickle.load(handle)

# sequence = tokenizer.texts_to_sequences([message])
# message = pad_sequences(sequence, maxlen=200)

# model = load_model(os.path.join(app.root_path, 'model.h5'))
# prediction = model(message)
