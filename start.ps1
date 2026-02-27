# start.ps1
$portPid = (
	netstat -ano |
	findstr :5000 |
	Select-String "LISTENING" |
	ForEach-Object { ($_ -split '\s+')[-1] } |
	Select-Object -First 1
)

if ($portPid) {
	taskkill /PID $portPid /F | Out-Null
}

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\Users\Gigabyte\covercraft-bd\apps\server; pnpm dev'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd C:\Users\Gigabyte\covercraft-bd\apps\web; pnpm dev'
