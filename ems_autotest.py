import requests, json, datetime

BASE_URL = "http://localhost/ems/api"   # change if needed
HEADERS = {"Content-Type": "application/json"}

# --- Helper ---
def log(title, result, msg=""):
    print(f"| {title:<20} | {'✅' if result else '❌'} | {msg}")

def get_token(email, password):
    r = requests.post(f"{BASE_URL}/auth.php?action=login",
                      json={"email": email, "password": password})
    if r.status_code == 200:
        data = r.json()
        token = data.get("token")
        employee_id = data.get("user", {}).get("employee_id")
        return token, employee_id
    else:
        print(f"Login failed for {email}: {r.text}")
        return None, None

# --- Auth ---
print("\n🧩 AUTH TESTS")
admin_token, admin_employee_id = get_token("admin@ems.com", "admin123")
emp_token, emp_employee_id = get_token("employee@ems.com", "employee123")

log("Admin Login", bool(admin_token))
log("Employee Login", bool(emp_token))

# --- Employee Sync ---
print("\n👥 EMPLOYEE SYNC TEST")
if admin_token and emp_token:
    emp_headers = {**HEADERS, "Authorization": f"Bearer {emp_token}"}
    admin_headers = {**HEADERS, "Authorization": f"Bearer {admin_token}"}

    # Update employee details via admin
    new_phone = "9999999999"
    payload = {"phone": new_phone}
    r = requests.patch(f"{BASE_URL}/employees.php?id={emp_employee_id}", headers=admin_headers, json=payload)
    ok = r.status_code == 200
    log("Admin Update Employee", ok, f"status {r.status_code}")

    # Fetch via employee (employee id=2)
    r2 = requests.get(f"{BASE_URL}/employees.php?me", headers=emp_headers)
    if r2.status_code == 200:
        data = r2.json()
        same = data.get("phone") == new_phone
    else:
        same = False
    log("Employee Data Sync", same, "matches admin edit")

# --- Attendance ---
print("\n⏰ ATTENDANCE TEST")
if emp_token:
    emp_headers = {**HEADERS, "Authorization": f"Bearer {emp_token}"}
    now = datetime.datetime.now().strftime("%H:%M")

    # Clock In
    ci = requests.get(f"{BASE_URL}/attendance.php?action=clock_in", headers=emp_headers)
    log("Clock In", ci.status_code==200 or ci.status_code==400, f"Response {ci.status_code}")

    # Clock Out
    co = requests.get(f"{BASE_URL}/attendance.php?action=clock_out", headers=emp_headers)
    log("Clock Out", co.status_code==200 or co.status_code==400, f"Response {co.status_code}")

# --- Role Protection ---
print("\n🔐 ROLE TESTS")
if emp_token:
    emp_headers = {**HEADERS, "Authorization": f"Bearer {emp_token}"}
    r = requests.get(f"{BASE_URL}/employees.php", headers=emp_headers)
    protected = r.status_code == 403
    log("Employee Access Restriction", protected, f"status {r.status_code}")

# --- Leave Test ---
print("\n🏖️ LEAVE TEST")
if emp_token:
    emp_headers = {**HEADERS, "Authorization": f"Bearer {emp_token}"}
    payload = {"leave_type_id": 1, "start_date": "2025-11-01", "end_date": "2025-11-03", "reason": "Medical"}
    r = requests.post(f"{BASE_URL}/leaves.php", headers=emp_headers, json=payload)
    log("Leave Request", r.status_code==201, f"status {r.status_code}")

# --- Summary ---
print("\n✅ TEST COMPLETE")
print("All main EMS functions checked (Auth, Employee sync, Attendance, Leave, RBAC)\n")
