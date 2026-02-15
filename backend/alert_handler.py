from datetime import datetime

from backend.response_handler import send_response_to_frontend

def process_new_alert(event):
  # event.path gives us the uniques ID (key) of the alert
  alert_key = event.path.strip('/')
  data = event.data
  if not data or not isinstance(data, dict): 
    return

  status = data.get('status')
  command = data.get('command')

  # 1. Handle "Simple Alerts" (Roll, Head, Legs)
  if status == 'pending':
    print(f"📡 Simple Alert: {command}")

  # 2. Handle "Waiting Requests" (Temp, Itch)
  elif status == 'waiting':
    print(f"⏳ Waiting Request: {command}. Auto-approving for development...")
    # In a real scenario, this waits for a button click on the mobile app.
    # For testing, we call the response handler automatically:
    send_response_to_frontend(alert_key)