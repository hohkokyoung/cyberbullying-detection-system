from flask import Blueprint, Response, request, json
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import generate_password_hash, check_password_hash
# from app.database import get_users_collection
from app.database import establish_connection
import datetime

import base64
# from base64 import b64encode
from pkcs7 import PKCS7Encoder
from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
from base64 import b64decode

user = Blueprint("user", __name__)

# @user.route("/api/register", methods=["POST"])
# def register():
#     body = request.get_json()
#     username = body["username"]
#     password = generate_password_hash(body["password"]).decode("utf8")
#     # user_id = get_users_collection().insert({"username": username, "password": password})
#     connection = establish_connection()
#     cursor = connection.cursor()
#     query = "INSERT INTO users (user_username, user_password) VALUES (%s, %s)"
#     value = (username, password)
#     cursor.execute(query, value)
#     connection.commit()
#     connection.close()
#     return Response("sdfs", mimetype="application/json", status=200)

# @user.route("/api/login", methods=["POST"])
# def login():
#     body = request.get_json()
#     print(body["username"])
#     connection = establish_connection()
#     cursor = connection.cursor()
#     query = "SELECT account_id, account_username, account_password FROM accounts WHERE account_username = %s"
#     value = (body["username"], )
#     # user = get_users_collection().find_one({"username": body["username"]})
#     cursor.execute(query, value)

#     account = cursor.fetchone()
#     connection.close()

#     if account == None:
#         return Response(json.dumps({"error": "Invalid username or password."}), mimetype="application/json", status=401)

#     print(account)

#     # user_id = user["_id"]
#     # username = user["username"]
#     # password = user["password"]

#     key = RSA.importKey(open("private_key.pem", "r").read())
#     cipher = PKCS1_OAEP.new(key, hashAlgo=SHA256)
#     decrypted_current_password = cipher.decrypt(b64decode(request.get_json()["password"]))

#     account_id = account[0]
#     print(account_id)
#     username = account[1]
#     password = account[2]
#     authorised = check_password_hash(password, decrypted_current_password)
#     if not authorised:
#         return Response(json.dumps({"error": "Wrong password."}), mimetype="application/json", status=401)

#     expires = datetime.timedelta(days=7)
#     access_token = create_access_token(identity=str(account_id), expires_delta=expires)
#     return Response(json.dumps({"token": access_token, "account_id": account_id}), mimetype="application/json", status=200)

# @user.route("/api/change_password", methods=["POST"])
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