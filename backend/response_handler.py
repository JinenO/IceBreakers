from firebase_admin import db

def approve_request(alert_key):
  """
  Simulates a caregiver approving a request from the mobile app. 
  Updates the status so the Frontend can move to the next screen.
  """
  alert_path = f'alerts/{alert_key}'
  db.reference(alert_path).update({
    'status': 'ready_to_interact'
  })
  print(f"✅ Request {alert_key} approved. Web App notified.")

def send_response_to_frontend(alert_key):
  """
  Updates the database to tell the Frontend the caregiver is ready.
  """
  try:
    alert_ref = db.reference(f'alerts/{alert_key}')
    alert_ref.update({
      'status': 'ready_to_interact'
    })
    print(f"✅ Success: Alert {alert_key} set to ready_to_interact.")
  except Exception as e:
    print(f"❌ Error updating response: {e}")