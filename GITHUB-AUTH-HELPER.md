# GitHub Authentication - Quick Guide

## You Have 3 Options:

### Option 1: Personal Access Token (EASIEST - 2 minutes)

**Steps:**
1. Open: https://github.com/settings/tokens
2. Click: "Generate new token (classic)"
3. Name: "Sartor Claude Network"
4. Check ONLY: ☑️ `repo` (full control of private repositories)
5. Click: "Generate token" (bottom of page)
6. **COPY THE TOKEN** (green text) - you won't see it again!

**Then in your terminal:**
```bash
cd /home/alton/vayu-learning-project
git push origin main

# When prompted:
Username: alto84
Password: <paste your token here>
```

---

### Option 2: GitHub CLI (Best long-term)

**Install:**
```bash
# Run these commands in your terminal:
sudo apt update
sudo apt install gh -y

# Then authenticate:
gh auth login
# Choose: GitHub.com → HTTPS → Yes → Login with a web browser
# It will give you a code, paste it in the browser
```

**Then push:**
```bash
git push origin main
```

---

### Option 3: SSH Key (One-time setup, then forever easy)

**Generate key:**
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter 3 times (default location, no passphrase)

# Copy your public key:
cat ~/.ssh/id_ed25519.pub
```

**Add to GitHub:**
1. Copy the output
2. Go to: https://github.com/settings/keys
3. Click: "New SSH key"
4. Paste and save

**Update git remote:**
```bash
cd /home/alton/vayu-learning-project
git remote set-url origin git@github.com:alto84/Sartor-claude-network.git
git push origin main
```

---

## Recommended: Option 1 (Personal Access Token)

It's the fastest. Takes 2 minutes. Just:
1. Create token at https://github.com/settings/tokens
2. Run: `git push origin main`
3. Paste token when asked for password

**That's it!** 🚀
