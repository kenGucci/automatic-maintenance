#!/usr/bin/env python3
"""Update X API credentials in .env file"""

import os

env_path = '/Users/gucci/Q0der/automatic-maintenance/.env'

print("=" * 50)
print("Update X API Credentials")
print("=" * 50)
print()

api_key = input("Enter API Key: ").strip()
api_secret = input("Enter API Key Secret: ").strip()
access_token = input("Enter Access Token: ").strip()
access_token_secret = input("Enter Access Token Secret: ").strip()

# Read the file
with open(env_path, 'r') as f:
    lines = f.readlines()

# Update the lines
new_lines = []
for line in lines:
    if line.startswith('X_API_KEY='):
        new_lines.append(f'X_API_KEY={api_key}\n')
    elif line.startswith('X_API_KEY_SECRET='):
        new_lines.append(f'X_API_KEY_SECRET={api_secret}\n')
    elif line.startswith('X_ACCESS_TOKEN='):
        new_lines.append(f'X_ACCESS_TOKEN={access_token}\n')
    elif line.startswith('X_ACCESS_TOKEN_SECRET='):
        new_lines.append(f'X_ACCESS_TOKEN_SECRET={access_token_secret}\n')
    else:
        new_lines.append(line)

# Write back
with open(env_path, 'w') as f:
    f.writelines(new_lines)

print()
print("✅ Credentials updated successfully!")
print(f"File: {env_path}")
print()
print("Now run: python3 x_bot.py")
