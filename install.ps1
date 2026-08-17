<#
dsh-chat-timeline 一键安装脚本（One-click installer）
【中文】自动完成全部安装步骤：复制源码 → 注册到 package.json → pnpm install → 提示重启。
(EN) Automates the whole install: copy source -> register in package.json -> pnpm install -> restart hint.

用法 (Usage):
  - Windows: 双击 install.bat
  - 或命令行: powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1

脚本是幂等的（可重复运行，不会重复安装）。
(EN) The script is idempotent: re-running it is safe.
#>

$ErrorActionPreference = "Stop"

# ---- 1. 定位 DSH 主目录 (locate DSH home) ----
$DSHHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
$pluginName = "dsh-chat-timeline"
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginsDir = Join-Path $DSHHome "plugins"
$target = Join-Path $pluginsDir $pluginName
$webDir = Join-Path $DSHHome "profiles\web"
$webPkg = Join-Path $webDir "package.json"

Write-Host ""
Write-Host "========================================"
Write-Host "  dsh-chat-timeline 一键安装"
Write-Host "  DSH 目录: $DSHHome"
Write-Host "========================================"

# ---- 2. 复制插件源码 (copy plugin source) ----
Write-Host "`n[1/3] 复制插件到 $target"
if ((Split-Path -Parent $src) -eq $pluginsDir) {
  Write-Host "  （源码已在 plugins 目录，跳过复制）"
} else {
  New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
  Copy-Item $src $target -Recurse -Force
  Remove-Item (Join-Path $target ".git") -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host "  复制完成"
}

# ---- 3. 注册到 package.json (register dependency + bundle) ----
if (-not (Test-Path $webPkg)) {
  Write-Host "  [错误] 找不到 $webPkg" -ForegroundColor Red
  Write-Host "  请先至少运行过一次 dsh web 再执行本脚本。" -ForegroundColor Red
  exit 1
}
Write-Host "`n[2/3] 注册到 $webPkg"
$pkg = Get-Content $webPkg -Raw -Encoding UTF8 | ConvertFrom-Json
if ($null -eq $pkg.dependencies -or $null -eq $pkg.dsh -or $null -eq $pkg.dsh.profile) {
  Write-Host "  [错误] package.json 缺少 dependencies/dsh.profile 结构，不是标准 DSH web profile。" -ForegroundColor Red
  exit 1
}
$linkRef = "link:$($target.Replace('\','/'))"
$changed = $false
if (-not ($pkg.dependencies.PSObject.Properties.Name -contains $pluginName)) {
  $pkg.dependencies | Add-Member -NotePropertyName $pluginName -NotePropertyValue $linkRef -Force
  $changed = $true
}
if ($pkg.dsh.profile.bundles -notcontains $pluginName) {
  $pkg.dsh.profile.bundles += $pluginName
  $changed = $true
}
if ($changed) {
  $json = $pkg | ConvertTo-Json -Depth 20
  [System.IO.File]::WriteAllText($webPkg, $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  配置已更新"
} else {
  Write-Host "  已配置过，跳过"
}

# ---- 4. 安装链接 (pnpm install) ----
Write-Host "`n[3/3] 执行 pnpm install"
Push-Location $webDir
try {
  pnpm install
  if ($LASTEXITCODE -ne 0) { throw "pnpm install 失败" }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "================ 安装完成 ================" -ForegroundColor Green
Write-Host "  请重启 dsh web 并刷新浏览器，"
Write-Host "  右侧导航栏即可在任意会话中出现。"
Write-Host ""
Write-Host "  ⭐ 如果觉得好用，求给项目点个 Star 支持一下作者：" -ForegroundColor Yellow
Write-Host "     https://github.com/jjxjjjjiik-bot/dsh-chat-timeline" -ForegroundColor Cyan
Write-Host "=========================================="
