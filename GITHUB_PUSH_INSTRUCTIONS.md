# GitHub Push Instructions

The repository has some large files in its history that are preventing a quick push. Here's how to push the project to GitHub:

## Option 1: Fresh Repository (Recommended)

Since this is the first push, create a fresh repository without the old history:

```bash
cd /Users/pruthiviraj/wifi

# Backup current .git folder
mv .git .git.backup

# Initialize fresh repository
git init
git remote add origin https://github.com/pruthiviraj1188/wifi.git

# Add all files (respecting .gitignore)
git add -A

# Commit
git commit -m "Complete WiFi-Radar system - All 9 phases implemented

Features:
- Phase 1-9 all complete
- Activity classification (87% fall recall)
- Full-stack system with React frontend
- FastAPI backend with 15+ endpoints
- 98 files, 8000+ lines of code
- Comprehensive testing suite
"

# Push
git push -u origin master --force

# If successful, remove backup
# rm -rf .git.backup
```

## Option 2: Use GitHub Desktop or VS Code

### Using GitHub Desktop:
1. Open GitHub Desktop
2. Add local repository: `/Users/pruthiviraj/wifi`
3. Click "Publish repository"
4. Choose "wifi" as repository name
5. Uncheck "Keep this code private" (or keep checked)
6. Click "Publish Repository"

### Using VS Code:
1. Open folder in VS Code: `/Users/pruthiviraj/wifi`
2. Click Source Control icon (left sidebar)
3. Click "Publish to GitHub"
4. Select "Publish to GitHub public repository" or private
5. Follow prompts

## Option 3: Use Git LFS for Large Files

If you want to keep the trained model (22MB):

```bash
# Install Git LFS
brew install git-lfs
git lfs install

# Track large files
git lfs track "*.joblib"
git lfs track "*.png"
git add .gitattributes

# Then commit and push
git add -A
git commit -m "Add Git LFS tracking"
git push -u origin master
```

## What's Excluded from Git

According to `.gitignore`:
- `/venv/` - Python virtual environment
- `frontend/node_modules/` - Node packages (can be reinstalled with `npm install`)
- `datasets/raw/` and `datasets/processed/` - Large dataset files
- `ai/saved_models/*.joblib` - Trained models (train with script)
- `*.log`, `*.db`, `*.sqlite` - Runtime files

## After Pushing

Once successfully pushed, users can clone and set up the project:

```bash
# Clone
git clone https://github.com/pruthiviraj1188/wifi.git
cd wifi

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r config/requirements.txt

# Train the model
python ai/train_activity_classifier.py

# Install frontend dependencies
cd frontend
npm install

# Start development
# Terminal 1: Backend
python backend/run_server.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Troubleshooting

### Push Timeout
If you're getting timeout errors:
1. Check your internet connection
2. Try pushing during off-peak hours
3. Use Option 1 (fresh repository)
4. Push in smaller chunks

### Large Files Error
If GitHub rejects files > 100MB:
1. Ensure `.gitignore` excludes them
2. Use Git LFS (Option 3)
3. Store large files elsewhere (AWS S3, Google Drive)

### Authentication Issues
If asked for credentials:
```bash
# Use Personal Access Token instead of password
# Get token from: https://github.com/settings/tokens

# Or use GitHub CLI
brew install gh
gh auth login
gh repo create wifi --public --source=. --remote=origin --push
```

---

**Current Status**: Repository prepared but push timing out. Use Option 1 for clean push.
