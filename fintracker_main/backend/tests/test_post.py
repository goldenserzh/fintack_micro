import requests

data = {'name': 'string', 'email': 'user@example.com', 'password': '12345678'}
response = requests.post('http://127.0.0.1:8000/users/%7Buser_id%7D', json=data)
print('Status:', response.status_code)
print('Response:', response.text)