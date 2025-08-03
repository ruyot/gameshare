# Simple PowerShell web server for testing
Write-Host "Starting local web server on http://localhost:8080" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Available files:" -ForegroundColor Cyan
Write-Host "- Host (screen sharer): http://localhost:8080/windows_host.html" -ForegroundColor White
Write-Host "- Client (viewer): http://localhost:8080/windows_client.html" -ForegroundColor White
Write-Host ""

# Start Python HTTP server if available
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8080
} else {
    Write-Host "Python not found. Trying with PowerShell built-in server..." -ForegroundColor Yellow
    
    # Use PowerShell's built-in web server capabilities
    $http = [System.Net.HttpListener]::new()
    $http.Prefixes.Add("http://localhost:8080/")
    $http.Start()
    
    Write-Host "Server started at http://localhost:8080/" -ForegroundColor Green
    
    try {
        while ($http.IsListening) {
            $context = $http.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = $request.Url.LocalPath
            if ($localPath -eq "/") {
                $localPath = "/index.html"
            }
            
            $filename = Join-Path $PSScriptRoot $localPath.TrimStart('/')
            
            if (Test-Path $filename) {
                $buffer = [System.IO.File]::ReadAllBytes($filename)
                $response.ContentLength64 = $buffer.Length
                
                # Set content type based on extension
                $ext = [System.IO.Path]::GetExtension($filename)
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html" }
                    ".js" { $response.ContentType = "application/javascript" }
                    ".css" { $response.ContentType = "text/css" }
                    default { $response.ContentType = "application/octet-stream" }
                }
                
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - File not found")
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            
            $response.OutputStream.Close()
        }
    } finally {
        $http.Stop()
    }
}