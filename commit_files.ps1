# Reset local commit state to the .gitignore commit (138778e) without losing working files
Write-Host "Resetting local branch to initial commit..."
git reset 138778e

# Force push to reset the remote GitHub repository branch
Write-Host "Resetting remote GitHub branch..."
git push origin main --force

# Get git status porcelain output WITH -u to get individual untracked files
$status = git status -u --porcelain

$files = @()
foreach ($line in $status) {
    if ($line -match '^..\s+(.+)$') {
        $files += $Matches[1]
    }
}

Write-Host "Found $($files.Count) individual file(s) to commit."

$count = 0
foreach ($file in $files) {
    if (-not $file) { continue }
    $count++
    Write-Host "[$count/$($files.Count)] Staging: $file"
    git add "$file"
    
    # Get just the file name for a clean commit message
    $filename = Split-Path -Leaf $file
    $commitMsg = "feat: Add $filename ($file)"
    
    Write-Host "Committing: $commitMsg"
    git commit -m $commitMsg
    
    Write-Host "Pushing to GitHub..."
    git push origin main
    
    Write-Host "Done with $file"
    Write-Host "----------------------------------------"
}

Write-Host "All files have been committed and pushed individually!"
