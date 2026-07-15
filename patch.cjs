const fs = require('fs');
let code = fs.readFileSync('src/components/gestor/TelemetryView.tsx', 'utf8');

const regex = /if \(!key\) return;[\s\S]*?const formattedChartData = Object.entries\(dailyCounts\)\.map/m;
const replacement = `        // 3. Buscar Ranking de Engajamento por Tempo de Tela (userMetrics)
        const metricsQuery = query(
          collection(db, "userMetrics"),
          orderBy("totalStudyTime", "desc"),
          limit(10)
        );
        const metricsSnap = await getDocs(metricsQuery);
        
        const sortedUsers = [];
        metricsSnap.forEach(doc => {
          const data = doc.data();
          sortedUsers.push({
            nome: data.nome,
            cim: data.cim,
            totalStudyTime: data.totalStudyTime,
            monthlyStudyTime: data.monthlyStudyTime,
            lastAccess: data.lastActive?.toDate ? data.lastActive.toDate() : new Date()
          });
        });
        
        const formattedChartData = Object.entries(dailyCounts).map`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/gestor/TelemetryView.tsx', code);
