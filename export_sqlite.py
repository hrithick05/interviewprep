import sqlite3
import json

conn = sqlite3.connect('db.sqlite3')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

tables = [
    'django_content_type',
    'auth_permission',
    'auth_group',
    'auth_group_permissions',
    'auth_user',
    'auth_user_groups',
    'auth_user_user_permissions',
    'django_admin_log',
    'django_session',
    'django_migrations',
    'main_question',
    'main_codingquestion',
    'main_submission',
    'main_interviewsubmission',
    'main_hranswer',
]

all_data = {}
for t in tables:
    cur.execute(f'SELECT * FROM "{t}"')
    rows = cur.fetchall()
    all_data[t] = [dict(r) for r in rows]
    print(f'{t}: {len(rows)} rows')

with open('sqlite_export.json', 'w') as f:
    json.dump(all_data, f, indent=2, default=str)

print('\nExported to sqlite_export.json')
conn.close()
