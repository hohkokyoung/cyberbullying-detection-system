# import mysql.connector
import MySQLdb
import MySQLdb.cursors

# db = None
# users = None
# profiles = None;
# incidents = None;

# def initialise_database(client):
#     global db, users, profiles, incidents
#     db = client.database
#     users = db.users
#     profiles = db.profiles
#     incidents = db.incidents

# def get_users_collection():
#     return users

# def get_profiles_collection():
#     return profiles

# def get_incidents_collection():
#     return incidents

# database = None

def establish_connection():
    # global database
    database = MySQLdb.connect(
        host="localhost",
        user="root",
        password="root",
        database="database",
        cursorclass=MySQLdb.cursors.DictCursor
    )
    return database

    
# def get_database():
#     return database