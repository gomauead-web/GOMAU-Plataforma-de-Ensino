const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
code = code.replace(
  "await logout();\n                navigate('/login');",
  "try { await logout(); } catch(e) {}\n                window.location.href = '/login';"
);
fs.writeFileSync('src/pages/Dashboard.tsx', code);

let profileCode = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');
profileCode = profileCode.replace(
  "await logout();\n                navigate('/login');",
  "try { await logout(); } catch(e) {}\n                window.location.href = '/login';"
);
fs.writeFileSync('src/pages/ProfilePage.tsx', profileCode);
