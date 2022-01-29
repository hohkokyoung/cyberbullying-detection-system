import tweepy
from requests_oauthlib import OAuth1
from flask import Blueprint, Response, request, json, current_app, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import generate_password_hash, check_password_hash
from app.database import establish_connection
# from app.database import get_incidents_collection, get_profiles_collection
import datetime, random, string, base64, glob, os, tweepy
from bson.json_util import dumps

from pkcs7 import PKCS7Encoder
from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
from base64 import b64decode

organisation = Blueprint("organisation", __name__)

@organisation.route("/api/organisation", methods=["GET", "POST"])
@jwt_required()
def get_organisation():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    organisation_id = get_jwt_identity()

    query = """SELECT organisation_id AS id, organisation_name AS name, organisation_type AS type, organisation_image as image, 
                organisation_phone_number AS phone_number, organisation_email_address AS email_address, organisation_twitter_id AS twitter_id
                FROM organisations WHERE organisation_id = (%s)"""
    value = (organisation_id, )
    cursor.execute(query, value)
    organisation = cursor.fetchone()

    api = current_app.config["tweepy_api"]

    print(api.get_user(organisation["twitter_id"]).screen_name)

    organisation.update({"twitter_username": api.get_user(organisation["twitter_id"]).screen_name})
    connection.close()
    return Response(json.dumps(organisation), mimetype="application/json", status=200)

@organisation.route("/api/organisations", methods=["GET", "POST"])
@jwt_required()
def get_organisations():
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = """SELECT *, CONVERT(CEILING(COUNT(*) OVER() / 7), CHAR) AS page_count
                FROM 
                (SELECT organisation_id AS id, organisation_name AS name, organisation_image AS image, 
                organisation_phone_number AS phone_number, organisation_email_address AS email_address 
                FROM organisations) AS organisations 
                WHERE """

    where_subquery = ""
    search = request.get_json()["search"]
    search_subquery = "name LIKE (%s)"

    search_value = ["%" + search + "%"]

    search_subquery = "(" + search_subquery + ")"

    where_subquery = where_subquery + search_subquery

    query += where_subquery

    query += " LIMIT 7 "

    page_number = request.get_json()["page_number"]
    offset = page_number * 7

    query += f"OFFSET {offset}"

    value = tuple(search_value)

    cursor.execute(query, value)
    
    organisations = cursor.fetchall()

    connection.close()
    return Response(json.dumps(organisations), mimetype="application/json", status=200)

@organisation.route("/api/add_organisation", methods=["POST"])
@jwt_required()
def add_organisation():
    organisation = request.get_json()["organisation"]

    image = request.get_json()["file"]
    name = organisation["name"]
    organisation_type = organisation["type"]
    system_username = organisation["systemUsername"]
    twitter_username = organisation["twitterUsername"]

    try:
        api = current_app.config["tweepy_api"]
        twitter_id = api.get_user(screen_name = twitter_username).id

    except tweepy.TweepError as tweep_error:
        error_code = tweep_error.args[0][0]["code"]
        if error_code == 50:
            return Response(json.dumps({"error": "The username did not exist on Twitter."}), mimetype="application/json", status=403)

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = "SELECT * FROM organisations WHERE organisation_name = (%s)"
    value = (name, )

    cursor.execute(query, value)

    organisation = cursor.fetchone()

    if (organisation != None):
        return Response(json.dumps({"error": "The organisation with the name has already been registered."}), mimetype="application/json", status=403)

    query = "SELECT * FROM organisations WHERE organisation_username = (%s)"
    value = (system_username, )

    cursor.execute(query, value)

    organisation = cursor.fetchone()

    if (organisation != None):
        return Response(json.dumps({"error": "The organisation with the system username has already been registered."}), mimetype="application/json", status=403)

    query = "SELECT * FROM organisations WHERE organisation_twitter_id = (%s)"
    value = (twitter_id, )

    cursor.execute(query, value)

    organisation = cursor.fetchone()

    if (organisation != None):
        return Response(json.dumps({"error": "The organisation with the twitter account has already been registered."}), mimetype="application/json", status=403)

    # query = "SELECT * FROM accounts WHERE account_username = (%s)"
    # value = (name, )

    # cursor.execute(query, value)

    # account = cursor.fetchone()

    # if (account != None):
    #     return Response(json.dumps({"error": "The account with the username has already been registered."}), mimetype="application/json", status=403)

    file_name = None

    if image:
        list_of_files = glob.glob('./app/static/media/images/image*.png')
        file_path = "./app/static/media/images/"
        temp_file_name = None
        if list_of_files:
            latest_file = max(list_of_files, key=os.path.getctime)
            index = int(os.path.basename(latest_file)[5:-4])
            index += 1
            temp_file_name = "image%s.png" % index
            file_path += temp_file_name
        else:
            temp_file_name = "image1.png"
            file_path += temp_file_name

        with open(file_path, "wb") as file_handler:
            file_handler.write(base64.decodebytes(bytes(image, 'utf-8')))
            file_handler.close()

        file_name = temp_file_name
        # if os.path.exists("./app/static/media/images/" + account["image"]):
        #     os.remove("./app/static/media/images/" + account["image"])
        # else:
        #     print("The file does not exist/")


    query = """INSERT INTO organisations (organisation_name, organisation_image, organisation_type, 
                organisation_username, organisation_twitter_id, organisation_password, role_id) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)"""

    password_characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(password_characters) for i in range(8))

    value = (name, file_name, organisation_type, system_username, twitter_id, generate_password_hash(password), 4)

    cursor.execute(query, value)
    
    connection.commit()

    # query = "INSERT INTO accounts (account_name, account_username, account_password, organisation_id, role_id) VALUES (%s, %s, %s, %s, %s)"

   

    # value = (system_username, admin_username, generate_password_hash(password), cursor.lastrowid, 5)

    # cursor.execute(query, value)
    
    # connection.commit()

    query = "INSERT INTO messages (message_text, message_method, role_id, organisation_id) VALUES (%s, %s, %s, %s)"

    with open("aes_key.txt") as file:
        key = bytes(file.readlines()[0], "utf-8")
    # master_key = b'1234567890123456'

    messages = [{"message": "This is a message for cyberbully", "role_id": 1}, 
                {"message": "This is a message for cybervictim", "role_id": 2}, 
                {"message": "This is a message for cyberbully-victim", "role_id": 3}]

    values = []

    message_methods = ["direct message", "reply tweet"]

    for message_method in message_methods:
        for message in messages:
            encoder = PKCS7Encoder()
            encoded_message = encoder.encode(message["message"])
            iv = Random.new().read( 16 )
            cipher = AES.new(key, AES.MODE_CBC, iv)
            # # return 
            # return cipher
            encoded_message = base64.b64encode(iv + cipher.encrypt(encoded_message.encode("utf-8")))
            encrypted_message = encoded_message.decode('ascii')
            values.append((encrypted_message, message_method, message["role_id"], cursor.lastrowid))

    # values = [("This is a message for cyberbully", 1, cursor.lastrowid),
    #         ("This is a message for cybervictim", 2, cursor.lastrowid),
    #         ("This is a message for cyberbully-victim", 3, cursor.lastrowid)]

    cursor.executemany(query, values)

    connection.commit()

    with open("aes_key.txt") as file:
        key = bytes(file.readlines()[0], "utf-8")

    encoder = PKCS7Encoder()
    raw = encoder.encode(password)
    iv = Random.new().read( 16 )
    cipher = AES.new(key, AES.MODE_CBC, iv)
    # # return 
    encoded = base64.b64encode(iv + cipher.encrypt(raw.encode("utf-8")))
    password = encoded.decode('ascii') 

    connection.close()
    return Response(json.dumps({"success": password}), mimetype="application/json", status=200)

@organisation.route("/api/edit_organisation", methods=["POST"])
@jwt_required()
def edit_organisation():
    organisation_id = get_jwt_identity()
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    image = request.get_json()["file"]

    organisation = request.get_json()["organisation"]

    query = "SELECT * FROM organisations WHERE organisation_name = (%s) AND organisation_id != (%s)"
    value = (organisation["name"], organisation_id)

    cursor.execute(query, value)

    other_organisations = cursor.fetchone()

    if (other_organisations != None):
        return Response(json.dumps({"error": "There is already organisation with the same name registered."}), mimetype="application/json", status=403)

    file_name = organisation["image"]

    if image:
        list_of_files = glob.glob('./app/static/media/images/image*.png') # * means all if need specific format then *.csv
        file_path = "./app/static/media/images/"
        temp_file_name = None
        if list_of_files:
            latest_file = max(list_of_files, key=os.path.getctime)
            index = int(os.path.basename(latest_file)[5:-4])
            index += 1
            temp_file_name = "image%s.png" % index
            file_path += temp_file_name
        else:
            temp_file_name = "image1.png"
            file_path += temp_file_name

        with open(file_path, "wb") as file_handler:
            file_handler.write(base64.decodebytes(bytes(image, 'utf-8')))
            file_handler.close()

        file_name = temp_file_name
        if organisation["image"]:
            if os.path.exists("./app/static/media/images/" + organisation["image"]):
                os.remove("./app/static/media/images/" + organisation["image"])
            else:
                print("The file does not exist/")

    query = """UPDATE organisations 
                SET organisation_image = (%s), organisation_name = (%s), organisation_phone_number = (%s), organisation_email_address = (%s)
                WHERE organisation_id = (%s)
            """    

    value = (file_name, organisation["name"], organisation["phone_number"], organisation["email_address"], organisation_id)

    cursor.execute(query, value)

    connection.commit()

    # account = cursor.fetchone()

    connection.close()
    return Response(json.dumps({"success": "The organisation has been successfully edited."}), mimetype="application/json", status=200)



@organisation.route("/api/login", methods=["POST"])
def login():
    body = request.get_json()
    print(body["username"])
    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()
    query = """SELECT organisation_id, organisation_username, organisation_password, organisation_twitter_token, 
                organisation_twitter_secret_token, role_title, organisation_name, organisation_type, organisation_twitter_id
                FROM organisations
                JOIN roles ON organisations.role_id = roles.role_id
                WHERE organisation_username = (%s)"""
    value = (body["username"], )
    # user = get_users_collection().find_one({"username": body["username"]})
    cursor.execute(query, value)

    organisation = cursor.fetchone()
    connection.close()

    if organisation == None:
        return Response(json.dumps({"error": "Wrong username or password."}), mimetype="application/json", status=401)

    key = RSA.importKey(open("private_key.pem", "r").read())
    cipher = PKCS1_OAEP.new(key, hashAlgo=SHA256)
    decrypted_current_password = cipher.decrypt(b64decode(request.get_json()["password"]))

    organisation_id = organisation["organisation_id"]
    username = organisation["organisation_username"]
    password = organisation["organisation_password"]
    authorised = check_password_hash(password, decrypted_current_password)
    if not authorised:
        return Response(json.dumps({"error": "Wrong password."}), mimetype="application/json", status=401)

    twitter_token = organisation["organisation_twitter_token"]
    twitter_secret_token = organisation["organisation_twitter_secret_token"]

    api = current_app.config["tweepy_api"]
    # organisation_twitter_id = api.get_user(organisation["organisation_twitter_id"])

    if twitter_token == None or twitter_secret_token == None:
        auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
        url = auth.get_authorization_url()
        return Response(json.dumps({"request_token": auth.request_token, "twitter_login_required": True, "twitter_login_url": url, "identity": {"role": organisation["role_title"], "organisation_id": organisation["organisation_id"], "organisation_name": organisation["organisation_name"], "organisation_type": organisation["organisation_type"], "organisation_twitter_id": organisation["organisation_twitter_id"]}}), mimetype="application/json", status=200)

    expires = datetime.timedelta(days=7)
    access_token = create_access_token(identity=str(organisation_id), expires_delta=expires)
    return Response(json.dumps({"twitter_login_required": False, "token": access_token, "identity": {"role": organisation["role_title"], "organisation_id": organisation["organisation_id"], "organisation_name": organisation["organisation_name"], "organisation_type": organisation["organisation_type"], "organisation_twitter_id": organisation["organisation_twitter_id"]}}), mimetype="application/json", status=200)
    
@organisation.route("/api/twitter_login", methods=["POST"])
def twitter_login():
    try:
        print(current_app.config["CONSUMER_KEY"])
        auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
        auth.request_token = request.get_json()["request_token"]
        pin = request.get_json()["pin"]
        print(pin)
        tokens = auth.get_access_token(verifier = pin)
        print(tokens)
        auth.set_access_token(tokens[0], tokens[1])

        api = tweepy.API(auth)
        print(api.me().id)
        print(request.get_json()["twitter_id"])
        
        if str(api.me().id) != str(request.get_json()["twitter_id"]):
            return Response(json.dumps({"error": "Authorised unsuccessful. Please authorise the app using your organisation's Twitter account."}), mimetype="application/json", status=401)

        connection = establish_connection()
        cursor = connection.cursor()

        organisation_id = request.get_json()["id"]

        with open("aes_key.txt") as file:
            key = bytes(file.readlines()[0], "utf-8")
                # master_key = b'1234567890123456'


        encrypted_tokens = []
        for token in tokens:
            encoder = PKCS7Encoder()
            encoded_token = encoder.encode(str(token))
            iv = Random.new().read( 16 )
            cipher = AES.new(key, AES.MODE_CBC, iv)
            encrypted_token = base64.b64encode(iv + cipher.encrypt(encoded_token.encode("utf-8")))
            encrypted_token = encrypted_token.decode('ascii')
            encrypted_tokens.append(encrypted_token)

        query = "UPDATE organisations SET organisation_twitter_token = (%s), organisation_twitter_secret_token = (%s) WHERE organisation_id = (%s)"
        value = (encrypted_tokens[0], encrypted_tokens[1], organisation_id)

        cursor.execute(query, value)

        connection.commit()

        connection.close()

        logged_in = request.get_json()["logged_in"]
        if logged_in:
            return Response(json.dumps({"message": "Authorised successful. Please try sending the message again."}), mimetype="application/json", status=200)

        expires = datetime.timedelta(days=7)
        access_token = create_access_token(identity=str(organisation_id), expires_delta=expires)
        return Response(json.dumps({"token": access_token}), mimetype="application/json", status=200)

    except tweepy.TweepError as tweep_error:
        print(tweep_error)
        # print(tweep_error.args[0][0]["message"])
        return Response(json.dumps({"error": "Authorised unsuccessful. Invalid PIN Code. Please login again."}), mimetype="application/json", status=401)

@organisation.route("/api/change_password", methods=["POST"])
@jwt_required()
def change_password():
    key = RSA.importKey(open("private_key.pem", "r").read())
    cipher = PKCS1_OAEP.new(key, hashAlgo=SHA256)
    decrypted_current_password = cipher.decrypt(b64decode(request.get_json()["current_password"]))
    decrypted_new_password = cipher.decrypt(b64decode(request.get_json()["new_password"]))

    print(request.get_json())
    organisation_id = get_jwt_identity()

    connection = establish_connection()
    # cursor = connection.cursor(dictionary=True)
    cursor = connection.cursor()

    query = "SELECT organisation_password FROM organisations WHERE organisation_id = (%s)"
    value = (organisation_id, )
    cursor.execute(query, value)

    currentPassword = cursor.fetchone()["organisation_password"]

    authorised = check_password_hash(currentPassword, decrypted_current_password)
    if not authorised:
        return Response(json.dumps({"error": "Wrong current password."}), mimetype="application/json", status=401)

    newPassword = generate_password_hash(decrypted_new_password).decode("utf8")

    query = "UPDATE organisations SET organisation_password = (%s) WHERE organisation_id = (%s)"
    value = (newPassword, organisation_id)

    cursor.execute(query, value)

    connection.commit()
    connection.close()

    return Response(json.dumps({"success": "The password has been successfully changed."}), mimetype="application/json", status=200)
    