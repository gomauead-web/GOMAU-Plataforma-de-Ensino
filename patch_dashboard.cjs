const fs = require('fs');
let code = fs.readFileSync('src/pages/gestor/GestorDashboard.tsx', 'utf8');

code = code.replace(
  /const loadRequests = async \(\) => {[\s\S]*?console\.error\(err\);\n    }\n  };/,
  "const loadRequests = () => {};"
);

code = code.replace(
  `  useEffect(() => {
    loadContents();
    loadCourses();
    loadRequests();
    loadEvents();
    loadEvolutionRules();
    seedInitialSecurity();
    loadExcelEmails();

    // Listener em tempo real para accessLogs`,
  `  useEffect(() => {
    loadContents();
    loadCourses();
    loadEvents();
    loadEvolutionRules();
    seedInitialSecurity();
    loadExcelEmails();

    // Listener em tempo real para solicitações
    const unsubRequests = onSnapshot(query(collection(db, "requests"), where("status", "==", "pendente")), (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      if (isRestrictedFaltas) {
        data = data.filter((d) => d.tipo === "Justificativa de Falta");
      }
      setRequests(data);
    }, (err) => console.error("Erro real-time requests:", err));

    // Listener em tempo real para accessLogs`
);

code = code.replace(
  `    return () => {
      unsubscribeLogs();
    };
  }, [isRestrictedFaltas]);`,
  `    return () => {
      unsubscribeLogs();
      unsubRequests();
    };
  }, [isRestrictedFaltas]);`
);

code = code.replace(/loadRequests\(\);\n      setEvaluatingRequest\(null\);/g, "setEvaluatingRequest(null);");

fs.writeFileSync('src/pages/gestor/GestorDashboard.tsx', code);
