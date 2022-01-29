# from flask import json
# import tweepy, pymongo
# # from app.database import get_incidents_collection, get_profiles_collection

# api = tweepy.API(auth)

# client = pymongo.MongoClient('mongodb://admin:admin@localhost:27017/cyberbullying?authSource=admin')

# db = client.cyberbullying
# profiles = db.profiles

# # test_db = client.test
# # test_data = test_db.test_data 

# class StreamListener(tweepy.StreamListener):
#     def on_status(self, data):
#         print(json.dumps(data._json))
#         # get_incidents_collection.insert({'message': data.text, 'date': data.created_at})
#         # for cybervictim in data.user_mentions:
#         #     print(api.get_status(cybervictim.id))
#             # get_profiles_collection.insert({''})
#         profile_id = profiles.insert({'username': data.user.screen_name, 'image': data.user.profile_image_url, 'role': 'cyberbully'})
#         print(profile_id)
#         # if 'RT @' not in status.text:
#             # print(status)
#             # test_data.insert({'test': status.text})

# streamListener = StreamListener()
# stream = tweepy.Stream(auth=auth, listener=streamListener)
# # tags = ["lewll"]
# follow = ["1346168138212077569"]
# # stream.filter(locations=[100.085756871, 0.773131415201, 119.181903925, 6.92805288332], is_async=True)
# stream.filter(locations=[101.669627, 3.153263, 101.717005, 3.162176], is_async=True)
# # stream.filter(track=tags, is_async=True)
# stream.filter(follow=follow, is_async=True)