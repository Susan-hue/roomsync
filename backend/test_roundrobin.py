import requests

BASE_URL = 'http://localhost:8000/api'

def register(email, full_name, role, password='testpass123'):
    res = requests.post(f'{BASE_URL}/auth/register/', json={
        'email': email,
        'full_name': full_name,
        'role': role,
        'password': password
    })
    print(f'REGISTER {full_name} ({role}): {res.status_code}')
    return res.json()

def login(email, password='testpass123'):
    res = requests.post(f'{BASE_URL}/auth/login/', json={
        'email': email,
        'password': password
    })
    print(f'LOGIN {email}: {res.status_code}')
    return res.json()

def create_room(token, name, room_type, capacity, location, hourly_rate):
    res = requests.post(f'{BASE_URL}/rooms/create/', json={
        'name': name,
        'room_type': room_type,
        'capacity': capacity,
        'location': location,
        'amenities': ['wifi', 'projector'],
        'hourly_rate': hourly_rate
    }, headers={'Authorization': f'Bearer {token}'})
    print(f'CREATE ROOM {name}: {res.status_code}')
    return res.json()

def book_room(token, room_id, date, start_time, end_time, purpose, user_name=''):
    res = requests.post(f'{BASE_URL}/bookings/create/', json={
        'room': room_id,
        'date': date,
        'start_time': start_time,
        'end_time': end_time,
        'purpose': purpose
    }, headers={'Authorization': f'Bearer {token}'})
    print(f'BOOK by {user_name}: {res.status_code} - {res.json().get("error", "SUCCESS")}')
    return res.json()

def list_bookings(token, user_name=''):
    res = requests.get(f'{BASE_URL}/bookings/', headers={
        'Authorization': f'Bearer {token}'
    })
    print(f'BOOKINGS for {user_name}: {len(res.json())} booking(s)')
    return res.json()


print('=' * 60)
print('ROOMSYNC ROUND-ROBIN TEST')
print('=' * 60)

# Step 1 — Register users
print('\n--- STEP 1: Register users ---')
student1 = register('student1@test.com', 'Student One', 'student')
student2 = register('student2@test.com', 'Student Two', 'student')
lecturer1 = register('lecturer1@test.com', 'Dr. Lecturer', 'lecturer')

# Step 2 — Login all users
print('\n--- STEP 2: Login all users ---')
s1_tokens = login('student1@test.com')
s2_tokens = login('student2@test.com')
l1_tokens = login('lecturer1@test.com')

s1_token = s1_tokens['access']
s2_token = s2_tokens['access']
l1_token = l1_tokens['access']

# Step 3 — Login as admin and create a room
print('\n--- STEP 3: Login as admin and create room ---')
admin_tokens = login('admin@roomsync.com', 'Admin1234!')
admin_token = admin_tokens['access']

room = create_room(admin_token, 'Lab A', 'lab', 30, 'Engineering Building Floor 2', 500.00)
room_id = room['id']
print(f'Room ID: {room_id}')

# Step 4 — Student 1 books Lab A (should succeed)
print('\n--- STEP 4: Student 1 books Lab A ---')
book_room(s1_token, room_id, '2026-06-15', '08:00', '10:00', 'Morning study', 'Student One')

# Step 5 — Student 2 books Lab A same day different time (should succeed)
print('\n--- STEP 5: Student 2 books Lab A different time ---')
book_room(s2_token, room_id, '2026-06-15', '10:00', '12:00', 'Group project', 'Student Two')

# Step 6 — Student 1 tries to book Lab A AGAIN same day (should succeed - different time, first booking)
print('\n--- STEP 6: Student 1 books Lab A again different time ---')
book_room(s1_token, room_id, '2026-06-15', '14:00', '16:00', 'Afternoon study', 'Student One')

# Step 7 — Student 1 tries AGAIN (has 2 bookings, Student 2 has 1 — round-robin should block)
print('\n--- STEP 7: Student 1 tries third booking (round-robin test) ---')
book_room(s1_token, room_id, '2026-06-16', '08:00', '10:00', 'Next day study', 'Student One')

# Step 8 — Student 2 books again (has 1 booking, should succeed)
print('\n--- STEP 8: Student 2 books again (should succeed) ---')
book_room(s2_token, room_id, '2026-06-16', '08:00', '10:00', 'Next day project', 'Student Two')

# Step 9 — Lecturer tries to book same slot as student (lecturer priority)
print('\n--- STEP 9: Lecturer books different slot ---')
book_room(l1_token, room_id, '2026-06-16', '10:00', '12:00', 'Lecture prep', 'Dr. Lecturer')

# Step 10 — Conflict test: Student 2 tries exact same slot as existing booking
print('\n--- STEP 10: Student 2 tries already booked slot (conflict test) ---')
book_room(s2_token, room_id, '2026-06-15', '08:00', '10:00', 'Conflict test', 'Student Two')

# Step 11 — Check all bookings
print('\n--- STEP 11: Check booking counts ---')
list_bookings(s1_token, 'Student One')
list_bookings(s2_token, 'Student Two')
list_bookings(l1_token, 'Dr. Lecturer')

print('\n' + '=' * 60)
print('TEST COMPLETE')
print('=' * 60)
