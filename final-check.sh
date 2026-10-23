#!/bin/bash
PASS=0; FAIL=0
ok()   { echo "✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "❌ $1"; FAIL=$((FAIL+1)); }
warn() { echo "⚠️  $1"; }
ROOT=~/hospital-management-system
cd "$ROOT" || { echo "❌ project folder not found"; exit 1; }

echo "===== 1. Tools ====="
command -v node >/dev/null && ok "node $(node -v)" || bad "node missing"
command -v npm >/dev/null && ok "npm $(npm -v)" || bad "npm missing"
command -v git >/dev/null && ok "git present" || bad "git missing"

echo "===== 2. Structure ====="
[ -d client ] && ok "client/ exists" || bad "client/ missing"
[ -d server ] && ok "server/ exists" || bad "server/ missing"
[ -f server/server.js ] && ok "server/server.js exists" || bad "server/server.js missing"
[ -f server/routes/otpAuth.js ] && ok "routes/otpAuth.js exists" || bad "otpAuth.js missing"
[ -f client/src/App.jsx ] && ok "client/src/App.jsx exists" || bad "App.jsx missing"
[ -f client/package.json ] && ok "client package.json exists" || bad "client package.json missing"
[ -f server/package.json ] && ok "server package.json exists" || bad "server package.json missing"

echo "===== 3. Git safety (secrets) ====="
if git ls-files | grep -qE '(^|/)\.env$'; then bad ".env is TRACKED in git — remove it!"; else ok ".env not tracked"; fi
grep -q "^\.env$" .gitignore 2>/dev/null && ok ".gitignore has .env" || warn ".gitignore missing .env"
grep -q "node_modules" .gitignore 2>/dev/null && ok ".gitignore has node_modules" || warn ".gitignore missing node_modules"
[ -f server/.env.example ] || [ -f .env.example ] && ok ".env.example exists" || warn ".env.example missing"

echo "===== 4. server/.env vars ====="
for v in MONGO_URI JWT_SECRET EMAIL_USER EMAIL_PASS PORT; do
  grep -q "^$v=" server/.env 2>/dev/null && ok "$v set" || bad "$v missing in server/.env"
done

echo "===== 5. Dependencies ====="
[ -d server/node_modules ] && ok "server deps installed" || bad "run: cd server && npm install"
[ -d client/node_modules ] && ok "client deps installed" || bad "run: cd client && npm install"

echo "===== 6. Port 5000 ====="
if (ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null) | grep -q ':5000'; then warn "port 5000 busy — kill: pkill -f 'node index.js'"; else ok "port 5000 free"; fi

echo "===== 7. Syntax check (server JS) ====="
SYNTAX_FAIL=0
for f in $(find server/routes server/models server/seed server/server.js -name '*.js' 2>/dev/null); do
  node --check "$f" >/dev/null 2>&1 || { echo "   syntax error: $f"; SYNTAX_FAIL=1; }
done
[ $SYNTAX_FAIL -eq 0 ] && ok "all server JS syntax OK" || bad "syntax errors found above"

echo "===== 8. MongoDB connection ====="
cd server
timeout 25 node -e "const m=require('mongoose');require('dotenv').config();m.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:9000}).then(()=>{console.log('MONGO_OK');process.exit(0)}).catch(e=>{console.log('MONGO_FAIL:'+e.message);process.exit(1)});" 2>/dev/null | grep -q MONGO_OK && ok "MongoDB reachable" || bad "MongoDB connection failed"
cd "$ROOT"

echo "===== 9. Client build ====="
if [ "$1" = "--build" ]; then
  cd client && npm run build >/tmp/build.log 2>&1 && ok "client build OK" || { bad "client build failed — tail of /tmp/build.log:"; tail -20 /tmp/build.log; }
  cd "$ROOT"
else
  warn "skipped (run with --build to test)"
fi

echo ""
echo "=============================="
echo "RESULT: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "🎉 ALL CLEAR — ready for next step" || echo "🔧 Fix the ❌ items above first"
