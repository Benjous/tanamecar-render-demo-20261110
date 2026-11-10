param(
    [Parameter(Mandatory = $true)]
    [string] $Url,
    [Parameter(Mandatory = $true)]
    [string] $Password
)

$env:RENDER_URL = $Url
$env:DEMO_EMAIL = "demo@tanamecar.test"
$env:DEMO_PASSWORD = $Password

node deploy/render/verify.mjs
exit $LASTEXITCODE
