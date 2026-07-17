$ErrorActionPreference = "Stop"

node (Join-Path $PSScriptRoot "checkpoint.mjs") @args
exit $LASTEXITCODE
