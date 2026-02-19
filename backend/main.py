import time
from firebase_config import initialize_firebase
from firebase_admin import db

# Setup
initialize_firebase()

# Keep Alive
try: 
  while True:
    time.sleep(1)
except KeyboardInterrupt:
  print("Shutting down Logic Engine...")