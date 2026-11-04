# Привязка игры к Telegram-боту.
# Токен читается из secrets.json прямо здесь и никуда не выводится.
# Запуск: двойной щелчок по publish-bot.cmd или
#   powershell -ExecutionPolicy Bypass -File publish-bot.ps1 -Url https://ваш-адрес/
param([string]$Url)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$cfgPath = Join-Path $here 'bot-config.json'

if (-not $Url -and (Test-Path $cfgPath)) {
    $Url = (Get-Content $cfgPath -Raw -Encoding UTF8 | ConvertFrom-Json).gameUrl
    Write-Host "Адрес игры из bot-config.json: $Url"
}
if (-not $Url) { $Url = Read-Host 'Вставьте HTTPS-адрес игры' }
$Url = $Url.Trim()
if ($Url -notmatch '^https://') { Write-Host 'Адрес должен начинаться с https://' -ForegroundColor Red; exit 1 }

# secrets.json лежит уровнем выше репозитория (вне git); как запасной вариант — рядом со скриптом
$secretsPath = Join-Path (Split-Path -Parent $here) 'secrets.json'
if (-not (Test-Path $secretsPath)) { $secretsPath = Join-Path $here 'secrets.json' }
if (-not (Test-Path $secretsPath)) { Write-Host 'Не найден secrets.json' -ForegroundColor Red; exit 1 }
$secrets = Get-Content $secretsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$token = $secrets.telegramBotToken
if (-not $token) { Write-Host 'В secrets.json нет поля telegramBotToken' -ForegroundColor Red; exit 1 }
$api = "https://api.telegram.org/bot$token"

function Call($method, $body) {
    $json = $body | ConvertTo-Json -Depth 6 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    try {
        $r = Invoke-RestMethod -Uri "$api/$method" -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8'
        Write-Host ("  {0}: ok" -f $method) -ForegroundColor Green
        return $r
    } catch {
        $msg = $_.ErrorDetails.Message
        if (-not $msg) { $msg = $_.Exception.Message }
        $msg = $msg.Replace($token, '***')
        Write-Host ("  {0}: ошибка — {1}" -f $method, $msg) -ForegroundColor Red
        exit 1
    }
}

Write-Host 'Подключаюсь к боту...'
$me = Call 'getMe' @{}
Write-Host ("Бот: @{0}" -f $me.result.username)

Call 'setChatMenuButton' @{ menu_button = @{ type = 'web_app'; text = 'Играть'; web_app = @{ url = $Url } } } | Out-Null
Call 'setMyShortDescription' @{ short_description = 'Аркадная рыбалка: ныряй глубже, лови больше, стреляй метко!' } | Out-Null
Call 'setMyDescription' @{ description = "Рыбалка Про — аркада прямо в Telegram.`nУворачивайся от рыб на спуске, собирай их на подъёме и сбивай улов в воздухе. Только не по сапогам!`n`nЖми «Играть» внизу." } | Out-Null

@{ gameUrl = $Url } | ConvertTo-Json | Set-Content $cfgPath -Encoding UTF8
Write-Host ''
Write-Host ("Готово. Откройте https://t.me/{0} и нажмите кнопку «Играть»." -f $me.result.username) -ForegroundColor Cyan
