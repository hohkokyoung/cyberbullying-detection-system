from flask import Blueprint, Response, request, json, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import generate_password_hash, check_password_hash
from app.database import establish_connection
import glob, os, base64, datetime, string, random, tweepy

from pkcs7 import PKCS7Encoder
from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
from base64 import b64decode

account = Blueprint("account", __name__)

@account.route("/api/accounts", methods=["POST"])
@jwt_required()
def get_accounts():
    connection = establish_connection()
    cursor = connection.cursor(dictionary=True)

    organisation_id = request.get_json()["organisation_id"]

    account_id = get_jwt_identity()

    query = "SELECT * FROM accounts WHERE account_id = (%s) AND organisation_id = (%s)"
    value = (account_id, organisation_id)

    cursor.execute(query, value)

    account = cursor.fetchone()

    limit = 7
    own_organisation = True

    if account == None:
        own_organisation = False
        limit = 8

    query = """SELECT *, CONVERT(CEILING(COUNT(*) OVER() / %s), CHAR) AS page_count
                FROM (SELECT account_name AS name, account_image AS image, account_title AS title, account_phone_number AS phone_number, account_email_address AS email_address, role_title AS role, organisation_id FROM accounts JOIN roles ON accounts.role_id = roles.role_id) AS accounts 
                WHERE organisation_id = (%s) AND """

    where_subquery = ""
    search = request.get_json()["search"]
    search_subquery = "name LIKE (%s)"

    search_value = ["%" + search + "%"]

    search_subquery = "(" + search_subquery + ")"

    where_subquery = where_subquery + search_subquery

    query += where_subquery

    query += f" LIMIT {limit} "

    page_number = request.get_json()["page_number"]
    offset = page_number * limit

    query += f"OFFSET {offset}"

    value = tuple([limit] + [organisation_id] + search_value)

    cursor.execute(query, value)
    
    accounts = cursor.fetchall()

    connection.close()
    return Response(json.dumps({"accounts": accounts, "own_organisation": own_organisation}), mimetype="application/json", status=200)

@account.route("/api/add_account", methods=["POST"])
@jwt_required()
def add_account():
    account = request.get_json()["account"]
    image = request.get_json()["file"]
    name = account["name"]
    title = account["title"]
    username = account["username"]
    organisation_id = request.get_json()["organisation_id"]

    connection = establish_connection()
    cursor = connection.cursor(dictionary=True)

    # query = "SELECT * FROM accounts WHERE account_name = (%s)"
    # value = (name, )

    # cursor.execute(query, value)

    # organisation = cursor.fetchone()

    # if (organisation != None):
    #     return Response(json.dumps({"error": "The account has already been registered."}), mimetype="application/json", status=200)

    query = "SELECT * FROM accounts WHERE account_username = (%s)"
    value = (username, )

    cursor.execute(query, value)

    account = cursor.fetchone()

    if (account != None):
        return Response(json.dumps({"error": "The account with the username has already been registered."}), mimetype="application/json", status=200)

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


    query = "INSERT INTO accounts (account_name, account_image, account_title, account_username, account_password, organisation_id, role_id) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    password_characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(password_characters) for i in range(8))

    
    value = (name, file_name, title, username, generate_password_hash(password), organisation_id, 4)

    cursor.execute(query, value)
    
    connection.commit()

    query = "INSERT INTO messages (message_text, role_id, account_id) VALUES (%s, %s, %s)"

    with open("aes_key.txt") as file:
        key = bytes(file.readlines()[0], "utf-8")
    # master_key = b'1234567890123456'

    messages = [{"message": "This is a message for cyberbully", "role_id": 1}, 
                {"message": "This is a message for cybervictim", "role_id": 2}, 
                {"message": "This is a message for cyberbully-victim", "role_id": 3}]

    values = []

    for message in messages:
        encoder = PKCS7Encoder()
        encoded_message = encoder.encode(message["message"])
        iv = Random.new().read( 16 )
        cipher = AES.new(key, AES.MODE_CBC, iv)
        # # return 
        # return cipher
        encoded_message = base64.b64encode(iv + cipher.encrypt(encoded_message.encode("utf-8")))
        encrypted_message = encoded_message.decode('ascii')
        values.append((encrypted_message, message["role_id"], cursor.lastrowid))

    # values = [("This is a message for cyberbully", 1, cursor.lastrowid),
    #         ("This is a message for cybervictim", 2, cursor.lastrowid),
    #         ("This is a message for cyberbully-victim", 3, cursor.lastrowid)]

    cursor.executemany(query, values)

    connection.commit()

    # query = "INSERT INTO accounts (account_name, account_username, account_password, organisation_id, role_id) VALUES (%s, %s, %s, %s, %s)"

    

    # cursor.execute(query, value)
    
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


# @account.route("/api/login", methods=["POST"])
# def login():
#     body = request.get_json()
#     print(body["username"])
#     connection = establish_connection()
#     cursor = connection.cursor(dictionary=True)
#     query = """SELECT account_id, account_username, account_password, account_twitter_token, account_twitter_secret_token,
#                 role_title, organisations.organisation_id, organisations.organisation_name, organisation_type
#                 FROM accounts 
#                 JOIN organisations ON accounts.organisation_id = organisations.organisation_id
#                 JOIN roles ON accounts.role_id = roles.role_id
#                 WHERE account_username = %s"""
#     value = (body["username"], )
#     # user = get_users_collection().find_one({"username": body["username"]})
#     cursor.execute(query, value)

#     account = cursor.fetchone()
#     connection.close()

#     if account == None:
#         return Response(json.dumps({"error": "Wrong username or password."}), mimetype="application/json", status=401)

#     print(account)

#     # user_id = user["_id"]
#     # username = user["username"]
#     # password = user["password"]

#     key = RSA.importKey(open("private_key.pem", "r").read())
#     cipher = PKCS1_OAEP.new(key, hashAlgo=SHA256)
#     decrypted_current_password = cipher.decrypt(b64decode(request.get_json()["password"]))

#     account_id = account["account_id"]
#     print(account_id)
#     username = account["account_username"]
#     password = account["account_password"]
#     authorised = check_password_hash(password, decrypted_current_password)
#     if not authorised:
#         return Response(json.dumps({"error": "Wrong password."}), mimetype="application/json", status=401)

#     twitter_token = account["account_twitter_token"]
#     twitter_secret_token = account["account_twitter_secret_token"]

#     if twitter_token == None or twitter_secret_token == None:
#         auth = tweepy.OAuthHandler(current_app.config["CONSUMER_KEY"], current_app.config["CONSUMER_SECRET_KEY"])
#         return Response(json.dumps({"twitter_login_required": True, "twitter_login_url": auth.get_authorization_url()}), mimetype="application/json", status=200)

#     expires = datetime.timedelta(days=7)
#     access_token = create_access_token(identity=str(account_id), expires_delta=expires)
#     return Response(json.dumps({"twitter_login_required": False, "token": access_token, "identity": {"role": account["role_title"], "organisation_id": account["organisation_id"], "organisation_name": account["organisation_name"], "organisation_type": account["organisation_type"]}}), mimetype="application/json", status=200)


# @account.route("/api/change_password", methods=["POST"])
# @jwt_required()
# def change_password():
#     key = RSA.importKey(open("private_key.pem", "r").read())
#     cipher = PKCS1_OAEP.new(key, hashAlgo=SHA256)
#     decrypted_current_password = cipher.decrypt(b64decode(request.get_json()["current_password"]))
#     decrypted_new_password = cipher.decrypt(b64decode(request.get_json()["new_password"]))
#     # print(decrypted_message)

#     # data = str.encode("wtf")
#     # # data = b64decode("ibirgCQu8TwtJOaKKtMLxw==")
#     # # data = base64.b64encode("wtf bro")
#     # # print("asdqwdSDasd")
#     # # print(data)
#     # master_key = b'1234567890123456' 
#     # encoder = PKCS7Encoder()
#     # raw = encoder.encode("wtf")
#     # iv = Random.new().read( 16 )
#     # cipher = AES.new(master_key, AES.MODE_CBC, iv)
#     # # return 
#     # encoded = base64.b64encode(iv + cipher.encrypt(raw.encode("utf-8")))
#     # data = encoded.decode('ascii') 

#     print(request.get_json())
#     account_id = get_jwt_identity()

#     connection = establish_connection()
#     cursor = connection.cursor(dictionary=True)

#     query = "SELECT account_password FROM accounts WHERE account_id = (%s)"
#     value = (account_id, )
#     cursor.execute(query, value)

#     currentPassword = cursor.fetchone()["account_password"]

#     authorised = check_password_hash(currentPassword, decrypted_current_password)
#     if not authorised:
#         return Response(json.dumps({"error": "Wrong current password."}), mimetype="application/json", status=401)

#     newPassword = generate_password_hash(decrypted_new_password).decode("utf8")

#     query = "UPDATE accounts SET account_password = (%s) WHERE account_id = (%s)"
#     value = (newPassword, account_id)

#     cursor.execute(query, value)

#     connection.commit()
#     connection.close()

#     return Response(json.dumps({"success": "The password has been successfully changed."}), mimetype="application/json", status=200)

@account.route("/api/account", methods=["GET"])
@jwt_required()
def get_account():
    account_id = get_jwt_identity()
    connection = establish_connection()
    cursor = connection.cursor(dictionary=True)

    query = """SELECT account_name AS name, account_image AS image, account_phone_number AS phone_number, account_email_address AS email_address,
                accounts.organisation_id, organisation_name AS organisation, account_title AS title FROM accounts 
                JOIN organisations ON accounts.organisation_id = organisations.organisation_id 
                WHERE account_id = (%s)"""
    value = (account_id, )

    cursor.execute(query, value)

    account = cursor.fetchone()

    connection.close()

    return Response(json.dumps(account), mimetype="application/json", status=200)

@account.route("/api/edit_account", methods=["POST"])
@jwt_required()
def edit_account():
    account_id = get_jwt_identity()
    connection = establish_connection()
    cursor = connection.cursor(dictionary=True)

    image = request.get_json()["file"]

    account = request.get_json()["account"]

    file_name = account["image"]

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
        if account["image"]:
            if os.path.exists("./app/static/media/images/" + account["image"]):
                os.remove("./app/static/media/images/" + account["image"])
            else:
                print("The file does not exist/")

    query = """UPDATE accounts 
                SET account_image = (%s), account_name = (%s), account_title = (%s), account_phone_number = (%s), account_email_address = (%s)
                WHERE account_id = (%s)
            """    

    value = (file_name, account["name"], account["title"], account["phone_number"], account["email_address"], account_id)

    cursor.execute(query, value)

    connection.commit()

    # account = cursor.fetchone()

    connection.close()
    return Response(json.dumps({"success": "The account has been successfully edited."}), mimetype="application/json", status=200)