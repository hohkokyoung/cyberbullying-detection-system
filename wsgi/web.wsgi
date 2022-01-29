import sys
import os

sys.path.insert(0, 'C:\\cyberbullying_detection_web_app\\back_end')
sys.path.insert(0, 'C:\\cyberbullying_detection_web_app\\back_end\\app\\resources')
sys.path.insert(0, 'C:\\cyberbullying_detection_web_app\\back_end\\env\\lib\\site-packages')
os.environ['ENV_FILE_LOCATION'] = './.env'

from app.app import app as application