param (
    [string]$Token = "",
    [string]$SiteId = ""
)

# Enable TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ErrorActionPreference = "Continue"
$projectDir = $PSScriptRoot
$configFile = Join-Path $projectDir "netlify_config.json"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   NETLIFY AUTO-DEPLOY: COSTCOHEALTH USA" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Load config
$loadedToken = $Token
$loadedSiteId = $SiteId

if (Test-Path $configFile) {
    try {
        $config = Get-Content -Raw $configFile | ConvertFrom-Json
        if (-not $loadedToken -and $config.NETLIFY_AUTH_TOKEN) { $loadedToken = $config.NETLIFY_AUTH_TOKEN }
        if (-not $loadedSiteId -and $config.NETLIFY_SITE_ID) { $loadedSiteId = $config.NETLIFY_SITE_ID }
    } catch {}
}

if (-not $loadedToken -or $loadedToken.Trim() -eq "" -or $loadedToken -like "*DÁN_TOKEN*") {
    Write-Host "[-] Chua co Token moi! Vui long mo file netlify_config.json va dan Token moi vao." -ForegroundColor Red
    pause
    exit
}
$loadedToken = $loadedToken.Trim()

$headers = @{
    "Authorization" = "Bearer $loadedToken"
}

# 2. Query Netlify to find target site
Write-Host "[1/3] Dang kiem tra tai khoan Netlify..." -ForegroundColor Cyan
$targetSite = $null
$siteName = ""
$siteUuid = $loadedSiteId

try {
    $sites = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" -Method Get -Headers $headers
    $siteList = @($sites)
    Write-Host "[+] Da ket noi Netlify! Tim thay $($siteList.Count) website:" -ForegroundColor Green
    
    foreach ($s in $siteList) {
        $dom = if ($s.custom_domain) { $s.custom_domain } else { $s.name }
        Write-Host "    - Ten: $($s.name) | Domain: $dom | ID: $($s.id)" -ForegroundColor DarkGray
    }

    # Match site
    $targetSite = $siteList | Where-Object {
        ($_.id -eq $loadedSiteId) -or
        ($_.custom_domain -and $_.custom_domain -like "*hangmyxachtay*") -or
        ($_.name -and $_.name -like "*hangmyxachtay*") -or
        ($_.name -and $_.name -like "*costco*")
    } | Select-Object -First 1

    if (-not $targetSite -and $siteList.Count -gt 0) {
        $targetSite = $siteList[0]
    }

    if ($targetSite) {
        $siteUuid = $targetSite.id
        $siteName = $targetSite.name
        $dom = if ($targetSite.custom_domain) { $targetSite.custom_domain } else { $targetSite.name }
        Write-Host "[+] Website muc tieu: $dom (ID: $siteUuid, Name: $siteName)" -ForegroundColor Green
    }
} catch {
    Write-Host "[-] Canh bao khi doc danh sach site: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3. Packaging website files
Write-Host ""
Write-Host "[2/3] Dang dong goi toan bo ma nguon va thu muc anh..." -ForegroundColor Cyan
$tempZip = Join-Path $env:TEMP ("costco_deploy_" + [System.IO.Path]::GetRandomFileName() + ".zip")
$tempStage = Join-Path $env:TEMP ("costco_stage_" + [System.IO.Path]::GetRandomFileName())
try {
    New-Item -ItemType Directory -Path $tempStage -Force | Out-Null
    # Copy root assets (tat ca cac trang HTML, CSS, JS, JSON, _redirects)
    Get-ChildItem -Path $projectDir -File | Where-Object {
        $ext = $_.Extension.ToLower()
        ($ext -in @('.html', '.css', '.js', '.json', '.jpg', '.png', '.webp', '.svg', '.ico')) -or ($_.Name -in @('_redirects', 'robots.txt'))
    } | Where-Object {
        $_.Name -notin @('deploy.js', 'deploy.ps1', 'netlify_config.json', 'go_domain_cu.bat', 'deploy_vercel.bat', 'deploy.bat', 'tao_brain_db.bat')
    } | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $tempStage -Force
    }

    # Inline CSS and JS into index.html for 100% fail-safe standalone rendering (never unstyled)
    try {
        $stageHtml = Join-Path $tempStage "index.html"
        $cssFile = Join-Path $projectDir "styles.css"
        $jsFile = Join-Path $projectDir "script.js"
        if ((Test-Path $stageHtml) -and (Test-Path $cssFile)) {
            $cssText = [System.IO.File]::ReadAllText($cssFile, [System.Text.Encoding]::UTF8)
            $htmlText = [System.IO.File]::ReadAllText($stageHtml, [System.Text.Encoding]::UTF8)
            if (-not $htmlText.Contains("<style>")) {
                $styleTag = "<style>`n$cssText`n</style>"
                $htmlText = $htmlText.Replace('<link rel="stylesheet" href="styles.css">', "$styleTag`n<link rel=`"stylesheet`" href=`"styles.css`">")
            }
            if ((Test-Path $jsFile) -and (-not $htmlText.Contains("handleFormSubmit(event)"))) {
                $jsText = [System.IO.File]::ReadAllText($jsFile, [System.Text.Encoding]::UTF8)
                $scriptTag = "<script>`n$jsText`n</script>"
                $htmlText = $htmlText.Replace('</body>', "$scriptTag`n</body>")
            }
            [System.IO.File]::WriteAllText($stageHtml, $htmlText, [System.Text.Encoding]::UTF8)
            $localHtml = Join-Path $projectDir "index.html"
            [System.IO.File]::WriteAllText($localHtml, $htmlText, [System.Text.Encoding]::UTF8)
        }
    } catch {}

    # Copy images folder
    $imagesDir = Join-Path $projectDir "images"
    if (Test-Path $imagesDir) {
        $stageImages = Join-Path $tempStage "images"
        New-Item -ItemType Directory -Path $stageImages -Force | Out-Null
        
        # Ensure variations exist
        1..6 | ForEach-Object {
            $p1 = Join-Path $imagesDir "product$_.jpg"
            $p2 = Join-Path $imagesDir "product-$_.jpg"
            if ((Test-Path $p1) -and (-not (Test-Path $p2))) { Copy-Item -Path $p1 -Destination $p2 -Force }
            if ((Test-Path $p2) -and (-not (Test-Path $p1))) { Copy-Item -Path $p2 -Destination $p1 -Force }
        }
        $h1 = Join-Path $imagesDir "hero.jpg"
        $h2 = Join-Path $imagesDir "Hero.jpg"
        if ((Test-Path $h1) -and (-not (Test-Path $h2))) { Copy-Item -Path $h1 -Destination $h2 -Force }

        # Copy all image files into stage/images
        Get-ChildItem -Path $imagesDir -File | ForEach-Object {
            Copy-Item -Path $_.FullName -Destination $stageImages -Force
            # Also copy to root so both /images/x.jpg and /x.jpg work
            Copy-Item -Path $_.FullName -Destination $tempStage -Force
        }
    }

    # Create zip file using .NET ZipFile
    if (Test-Path $tempZip) { Remove-Item -Path $tempZip -Force }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempStage, $tempZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

    $fileCount = (Get-ChildItem -Path $tempStage -Recurse -File).Count
    $zipKb = [math]::Round(((Get-Item $tempZip).Length / 1KB), 1)
    Write-Host "[+] Dong goi thanh cong $fileCount files ($zipKb KB)" -ForegroundColor Green

    # 4. Upload to Netlify
    Write-Host ""
    Write-Host "[3/3] Dang tai goi ZIP len Netlify..." -ForegroundColor Cyan

    $curlPath = "C:\Windows\System32\curl.exe"
    if (-not (Test-Path $curlPath)) { $curlPath = "curl.exe" }

    # Candidate IDs to try in order
    $idCandidates = @()
    if ($siteUuid) { $idCandidates += $siteUuid }
    if ($siteName -and -not ($idCandidates -contains $siteName)) { $idCandidates += $siteName }
    if ($loadedSiteId -and -not ($idCandidates -contains $loadedSiteId)) { $idCandidates += $loadedSiteId }
    if ($idCandidates.Count -eq 0) { $idCandidates += "" }

    $deploySuccess = $false
    $responseJson = $null

    foreach ($candidate in $idCandidates) {
        $apiUrl = if ($candidate) { "https://api.netlify.com/api/v1/sites/$candidate/deploys" } else { "https://api.netlify.com/api/v1/sites" }
        Write-Host "    -> Thu upload vao endpoint: $apiUrl" -ForegroundColor DarkGray

        # Method A: curl.exe (Sends Content-Length explicitly, NO chunked encoding bug)
        try {
            $curlArgs = @(
                "-s",
                "-X", "POST",
                "$apiUrl",
                "-H", "Authorization: Bearer $loadedToken",
                "-H", "Content-Type: application/zip",
                "--data-binary", "@$tempZip"
            )
            $rawResult = & $curlPath $curlArgs
            if ($rawResult -and ($rawResult -like "*`"id`":*" -or $rawResult -like "*`"site_id`":*")) {
                $responseJson = $rawResult | ConvertFrom-Json
                if ($responseJson.id -or $responseJson.site_id) {
                    $deploySuccess = $true
                    Write-Host "[+] Upload thanh cong qua curl vao ID: $candidate!" -ForegroundColor Green
                    break
                }
            } else {
                Write-Host "    [-] Phan hoi curl: $rawResult" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "    [-] curl loi: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Method B: HttpClient with ByteArrayContent (Native .NET fallback)
        if (-not $deploySuccess) {
            try {
                Add-Type -AssemblyName System.Net.Http
                $httpClient = New-Object System.Net.Http.HttpClient
                $httpClient.Timeout = [TimeSpan]::FromMinutes(3)
                $httpClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $loadedToken)
                
                $fileBytes = [System.IO.File]::ReadAllBytes($tempZip)
                $byteContent = New-Object System.Net.Http.ByteArrayContent($fileBytes)
                $byteContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue("application/zip")
                
                $httpResponse = $httpClient.PostAsync($apiUrl, $byteContent).Result
                $responseBody = $httpResponse.Content.ReadAsStringAsync().Result

                if ($httpResponse.IsSuccessStatusCode) {
                    $responseJson = $responseBody | ConvertFrom-Json
                    $deploySuccess = $true
                    Write-Host "[+] Upload thanh cong qua HttpClient vao ID: $candidate!" -ForegroundColor Green
                    break
                } else {
                    Write-Host "    [-] HttpClient status $($httpResponse.StatusCode): $responseBody" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "    [-] HttpClient loi: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }

    if ($deploySuccess -and $responseJson) {
        $deployId = $responseJson.id
        $sid = if ($responseJson.site_id) { $responseJson.site_id } else { $siteUuid }
        
        Write-Host ""
        Write-Host "[4/4] Dang kich hoat Deploy nay len Production Domain..." -ForegroundColor Cyan
        
        # Wait for Netlify to finish unzipping and processing
        $deployState = $responseJson.state
        for ($i = 0; $i -lt 8; $i++) {
            if ($deployState -eq "ready") { break }
            Start-Sleep -Seconds 2
            try {
                $statusCheck = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$sid/deploys/$deployId" -Method Get -Headers $headers
                $deployState = $statusCheck.state
                Write-Host "    Trang thai xu ly: $deployState..." -ForegroundColor DarkGray
            } catch {}
        }

        # Force publish to production domain
        try {
            $restoreUrl = "https://api.netlify.com/api/v1/sites/$sid/deploys/$deployId/restore"
            $restoreResp = Invoke-RestMethod -Uri $restoreUrl -Method Post -Headers $headers
            Write-Host "[+] Da xuat ban thanh cong (Published to Production)!" -ForegroundColor Green
            $deployState = "ready/published"
        } catch {
            Write-Host "    [i] Deploy trang thai: $deployState" -ForegroundColor DarkGray
        }

        $liveUrl = $responseJson.ssl_url
        if (-not $liveUrl) { $liveUrl = $responseJson.url }
        if (-not $liveUrl) { $liveUrl = "https://hangmyxachtay.info.vn" }

        Write-Host ""
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "  DEPLOY THANH CONG! WEBSITE DA DUOC CAP NHAT 100%!" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "  Link Truc Tiep: $liveUrl" -ForegroundColor Yellow
        Write-Host "  Domain:         https://hangmyxachtay.info.vn/" -ForegroundColor Yellow
        Write-Host "  Trang Thai:     $deployState" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host ""

        # Update config
        $configObj = [PSCustomObject]@{
            NETLIFY_AUTH_TOKEN = $loadedToken
            NETLIFY_SITE_ID = $sid
        }
        $configObj | ConvertTo-Json | Set-Content -Path $configFile -Encoding UTF8
    } else {
        Write-Host ""
        Write-Host "[-] KHONG THE UPLOAD QUA API DEPLOY!" -ForegroundColor Red
        Write-Host ""
        Write-Host ">>> PHUONG AN KEO THA 1 GIAY QUA TRINH DUYET NETLIFY <<<" -ForegroundColor Yellow
        Write-Host "1. Tren trinh duyet Chrome cua ban, chuyen sang tab Netlify dang mo san." -ForegroundColor White
        Write-Host "2. Keo ca thu muc 'costco-landing-page' tha vao o Deploys cua Netlify." -ForegroundColor White
        Write-Host "Website se cap nhat day du anh ngay lap tuc!" -ForegroundColor Green
        Write-Host ""
    }

} catch {
    Write-Host ""
    Write-Host "[-] ERROR: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $tempStage -Recurse -Force -ErrorAction SilentlyContinue
}
