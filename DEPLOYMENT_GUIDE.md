# 🚀 DEPLOYMENT GUIDE - DataFlow Agent

Complete guide to deploying all components of the DataFlow Agent system.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **Prerequisites**
- [ ] Node.js 18+ installed
- [ ] Docker Desktop installed and running
- [ ] Git configured
- [ ] Vercel account created
- [ ] GitHub repository created
- [ ] All environment variables configured

---

## 1️⃣ **DEPLOY CLINE CLI**

### **Local Installation**
```bash
cd dataflow-agent
npm install
npm link  # Makes 'dataflow' command available globally
```

### **Test CLI**
```bash
dataflow  # or: npm run cli
# Follow prompts to generate a workflow
```

### **Publish to npm (Optional)**
```bash
npm login
npm publish
```

**Expected Result:** ✅ CLI generates valid Kestra YAML files

---

## 2️⃣ **DEPLOY KESTRA WORKFLOW**

### **Option A: Docker Compose (Recommended)**
```bash
cd kestra
docker-compose up -d

# Wait 30-60 seconds for startup
docker-compose logs -f kestra  # Check logs
```

### **Access Kestra UI**
- URL: http://localhost:8080
- No authentication required (development mode)

### **Deploy Workflow**
1. Open http://localhost:8080
2. Click "Flows" → "Create"
3. Copy contents from `kestra/workflow-template.yml`
4. Paste and click "Save"
5. Click "Execute" to run

### **Configure Secrets**
```bash
# In Kestra UI, go to Settings → Secrets
# Add the following secrets:
- API_ENDPOINT
- API_TOKEN
- CSV_ENDPOINT
- WEBHOOK_URL
- THIRD_PARTY_API
- THIRD_PARTY_KEY
- DECISION_WEBHOOK_URL
```

### **Option B: Kestra Cloud**
```bash
# Sign up at https://kestra.io
# Create new flow
# Paste workflow-template.yml
# Configure secrets in cloud UI
# Execute and monitor
```

**Expected Result:** ✅ Workflow executes every 5 minutes, logs visible in UI

---

## 3️⃣ **DEPLOY VERCEL FRONTEND**

### **Local Development**
```bash
cd vercel-frontend
npm install
npm run dev

# Open: http://localhost:3000
```

### **Deploy to Vercel (CLI)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd vercel-frontend
vercel

# Production deployment
vercel --prod
```

### **Deploy to Vercel (GitHub Integration)**
1. Push code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Select `vercel-frontend` as root directory
6. Click "Deploy"

### **Configure Environment Variables**
In Vercel dashboard:
```
KESTRA_API_URL=https://your-kestra-instance.com
```

### **Run Lighthouse Audit**
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=https://your-vercel-app.vercel.app
```

**Expected Result:** ✅ Dashboard live at your-app.vercel.app, Lighthouse 95+

---

## 4️⃣ **SETUP OUMI TRAINING**

### **Install Oumi**
```bash
pip install oumi
```

### **Prepare Dataset**
```bash
cd oumi/training/dataset

# Create training data in JSONL format
# Each line: {"input": "raw data", "output": "expected summary"}
```

### **Run Training**
```bash
cd oumi/training
oumi train --config training_config.yaml

# Monitor with TensorBoard
tensorboard --logdir ./models/dataflow-llama2-finetuned/logs
```

### **Evaluate Model**
```bash
oumi evaluate \
  --model ./models/dataflow-llama2-finetuned \
  --config ../evaluation/benchmarks.yaml
```

**Expected Result:** ✅ 20%+ improvement over baseline on all metrics

---

## 5️⃣ **SETUP CI/CD**

### **GitHub Actions**
```bash
# Push code to GitHub
git add .
git commit -m "feat: complete DataFlow Agent implementation"
git push origin main

# GitHub Actions will automatically:
# - Run tests
# - Security audit
# - Build CLI
# - Build frontend
# - Deploy to Vercel (on main branch)
```

### **Enable CodeRabbit**
1. Go to https://coderabbit.ai
2. Install CodeRabbit GitHub App
3. Select your repository
4. CodeRabbit will review all PRs automatically

**Expected Result:** ✅ CI/CD pipeline passes, CodeRabbit reviews PRs

---

## 6️⃣ **VERIFICATION CHECKLIST**

### **CLI Verification**
- [ ] CLI runs without errors
- [ ] Generates valid YAML
- [ ] Input validation works
- [ ] Error messages are clear

### **Kestra Verification**
- [ ] Workflow deploys successfully
- [ ] Executes on schedule
- [ ] All 5 data sources fetch
- [ ] All 6 AI agents run
- [ ] Decisions logged correctly
- [ ] No errors in execution logs

### **Vercel Verification**
- [ ] Dashboard loads in < 1 second
- [ ] Real-time updates work
- [ ] Dark mode toggles
- [ ] Mobile responsive
- [ ] Lighthouse score 95+
- [ ] All API routes return data

### **Oumi Verification**
- [ ] Model trains successfully
- [ ] 20%+ improvement on BLEU
- [ ] 20%+ improvement on ROUGE
- [ ] 95%+ JSON validity
- [ ] Results documented

### **CI/CD Verification**
- [ ] All tests pass
- [ ] Security audit passes
- [ ] Builds complete
- [ ] Deployments succeed
- [ ] CodeRabbit reviews PRs

---

## 🎯 **POST-DEPLOYMENT**

### **Monitor Performance**
- **Kestra**: http://localhost:8080 → Executions
- **Vercel**: https://vercel.com/dashboard → Analytics
- **GitHub**: Actions tab → Workflow runs

### **Collect Metrics**
```bash
# Kestra execution count
# Vercel page views
# Lighthouse scores
# Test coverage percentage
# Security audit results
```

### **Create Demo Video**
Record 2-minute video showing:
1. CLI generating workflow (30 sec)
2. Kestra executing workflow (30 sec)
3. Vercel dashboard displaying results (30 sec)
4. Oumi training results (30 sec)

---

## 🏆 **SUBMISSION CHECKLIST**

- [ ] All components deployed and working
- [ ] Demo video recorded
- [ ] README updated with deployment URLs
- [ ] Screenshots added to README
- [ ] All 5 award forms filled out
- [ ] GitHub repository public
- [ ] Vercel deployment live
- [ ] Submit before deadline!

---

## 🚨 **TROUBLESHOOTING**

### **Kestra won't start**
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f kestra
```

### **Vercel build fails**
```bash
# Check build logs in Vercel dashboard
# Ensure all dependencies in package.json
# Verify Node.js version compatibility
```

### **Tests failing**
```bash
npm test -- --verbose
# Check error messages
# Fix failing tests
# Re-run
```

---

## ✅ **SUCCESS CRITERIA**

- ✅ CLI generates workflows
- ✅ Kestra executes workflows
- ✅ Vercel dashboard displays data
- ✅ Oumi shows 20%+ improvement
- ✅ CI/CD pipeline passes
- ✅ All tests passing
- ✅ Lighthouse 95+
- ✅ Zero security vulnerabilities

**Status:** 🟢 **READY FOR SUBMISSION!**
