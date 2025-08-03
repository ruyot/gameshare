# Quick Fix for Network Access

The web server isn't accessible from your Mac because:
1. The Python server might not be binding to all interfaces
2. Windows Firewall might be blocking it

## Solution: Use a Different Port

Let's use port 8888 instead and ensure it's accessible:

### 1. Start the server on port 8888

```bash
python -m http.server 8888 --bind 0.0.0.0
```

### 2. From your Mac, access:

```
http://10.0.0.105:8888
```

### 3. Alternative: Use ngrok for easy access

If local network access doesn't work, you can use ngrok:

1. Download ngrok from https://ngrok.com/
2. Run: `ngrok http 8080`
3. Use the provided HTTPS URL from any device

## The Issue

The previous Python server was only accepting connections from localhost (127.0.0.1), not from other devices on your network. The TIME_WAIT connections indicate the server crashed or wasn't binding correctly.

## Windows Firewall

If it still doesn't work, temporarily disable Windows Firewall:
1. Windows Security > Firewall & network protection
2. Turn off firewall for Private network (temporarily)
3. Test again
4. Re-enable firewall when done