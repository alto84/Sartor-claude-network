schtasks /create /tn "SartorHeartbeat" /tr "python C:\Users\alto8\Sartor-claude-network\sartor\heartbeat.py" /sc MINUTE /mo 30 /f
