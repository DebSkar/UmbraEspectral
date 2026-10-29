param([int]$port = 8123)

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    Write-Host "El puerto $port ya está en uso o requiere permisos. Intentando en 8124..." -ForegroundColor Yellow
    $port = 8124
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "  Umbra Espectral - Servidor Local Iniciado   " -ForegroundColor Cyan
Write-Host "  Abierto en: http://localhost:$port/        " -ForegroundColor Green
Write-Host "  (Presiona Ctrl + C para detener el servidor)" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Magenta

Start-Process "http://localhost:$port/"

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".mp3"   = "audio/mpeg"
    ".wav"   = "audio/wav"
    ".ogg"   = "audio/ogg"
    ".webm"  = "video/webm"
    ".woff2" = "font/woff2"
    ".woff"  = "font/woff"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".svg"   = "image/svg+xml"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = "index.html" }
        $urlPath = [System.Uri]::UnescapeDataString($urlPath)

        $filePath = Join-Path $root $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime
            
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
