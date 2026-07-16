const fs = require('fs');
let authCode = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

authCode = authCode.replace(
  "const logout = async () => {\n    console.log(\"Executando Logout Geral...\");\n    sessionStorage.clear(); // Limpa todo o estado da sessão\n    localStorage.removeItem('session_expires_at'); // Limpa o timer de sessão\n    await signOut(auth);\n    setUser(null);\n  };",
  "const logout = async () => {\n    console.log(\"Executando Logout Geral...\");\n    sessionStorage.clear();\n    localStorage.clear();\n    try {\n      await signOut(auth);\n    } catch(e) {\n      console.error('Erro no signOut:', e);\n    }\n    setUser(null);\n    // Force clear indexedDB firebase local storage just in case\n    try {\n      indexedDB.deleteDatabase('firebaseLocalStorageDb');\n    } catch(e) {}\n  };"
);

fs.writeFileSync('src/contexts/AuthContext.tsx', authCode);

let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  "const handleLogout = async () => {\n    await contextLogout();\n    navigate('/login');\n  };",
  "const handleLogout = async () => {\n    try { await contextLogout(); } catch(e) {}\n    window.location.href = '/login';\n  };"
);
fs.writeFileSync('src/components/Layout.tsx', layoutCode);
