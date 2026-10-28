# --- CONFIGURATION ---
$TotalRuns = 100
$Model = "nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b#thinking"

# Read the entire prompt from a .md file (raw formatting preserved)
$Prompt = Get-Content -Path "_scratchpad/prompt-1.md" -Raw

for ($i = 1; $i -le $TotalRuns; $i++) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "👉 Iteration $i of $TotalRuns (Build Agent | Fresh Context)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan

    # Runs OpenCode passing the prompt loaded from the file
    opencode run --agent build --auto --model $Model $Prompt

    # Brief delay between process exits and re-spawns
    Start-Sleep -Seconds 2
}

Write-Host "🎉 Finished all $TotalRuns iterations successfully!" -ForegroundColor Yellow