$ErrorActionPreference = "Continue"
$H = "http://localhost:3001"
$r = Invoke-WebRequest "$H/" -UseBasicParsing
Write-Host "SPA root: $($r.StatusCode) rootDiv=$($r.Content.Contains('id=`"root`"'))"
$r2 = Invoke-WebRequest "$H/links" -UseBasicParsing
Write-Host "SPA /links: $($r2.StatusCode)"
try {
  Invoke-WebRequest "$H/d1000" -MaximumRedirection 0 -ErrorAction Stop | Out-Null
} catch {
  Write-Host "short d1000: $($_.Exception.Response.StatusCode.value__) -> $($_.Exception.Response.Headers.Location)"
}
$login = Invoke-RestMethod "$H/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@linkpulse.dev","password":"admin1234"}'
Write-Host "admin login role=$($login.user.role)"
$ada = Invoke-RestMethod "$H/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"ada@example.com","password":"password123"}'
$A = @{ Authorization = "Bearer $($ada.token)" }
$d = Invoke-RestMethod "$H/api/analytics/dashboard?period=30d" -Headers $A
Write-Host "ada dash: clicks=$($d.totalClicks) uniques=$($d.uniqueVisitors) links=$($d.totalLinks) topLinks=$($d.topLinks.Count) tsPoints=$($d.timeseries.Count)"
try {
  $disabled = Invoke-WebRequest "$H/d1003" -MaximumRedirection 0 -ErrorAction Stop
  Write-Host "disabled d1003 -> $($disabled.StatusCode)"
} catch {
  Write-Host "disabled d1003 -> $($_.Exception.Response.StatusCode.value__)"
}
