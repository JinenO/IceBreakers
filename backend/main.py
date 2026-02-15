import time
from firebase_config import initialize_firebase
from alert_handler import process_new_alert
from firebase_admin import db

# Setup
initialize_firebase()

# Start Listening
print("🚀 IRIS FLOW Logic Engine is running...")
alerts_ref = db.reference('alerts')
alerts_ref.listen(process_new_alert)

# Keep Alive
try: 
  while True:
    time.sleep(1)
except KeyboardInterrupt:
  print("Shutting down Logic Engine...")