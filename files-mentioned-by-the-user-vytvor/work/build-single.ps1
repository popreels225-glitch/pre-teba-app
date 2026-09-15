$html = Get-Content -Raw -Encoding UTF8 -LiteralPath 'index.html'
$css = Get-Content -Raw -Encoding UTF8 -LiteralPath 'styles.css'
$js = Get-Content -Raw -Encoding UTF8 -LiteralPath 'app.js'
$html = $html -replace '<link rel="stylesheet" href="styles.css" />', "<style>`n$css`n</style>"
$html = $html -replace '<script src="app.js"></script>', "<script>`n$js`n</script>"
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'outputs\pre-teba-mobilna-aplikacia.html'), $html, [System.Text.UTF8Encoding]::new($false))
