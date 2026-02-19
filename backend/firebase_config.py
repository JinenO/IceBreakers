import firebase_admin
from firebase_admin import credentials, db

def initialize_firebase():
  if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
      'databaseURL': 'https://irisflow-c7dba-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })
  
  print("✅ IRIS FLOW Backend: Connected to Realtime Database")
  