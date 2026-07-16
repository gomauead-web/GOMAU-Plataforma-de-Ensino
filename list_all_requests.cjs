const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const projectId = serviceAccount.projectId;
const dbId = 'ai-studio-4947e18d-5e04-42f7-b67e-418dc87b0705';

async function fetchDocs() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/requests`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data.documents || [];
  console.log("Total requests:", docs.length);
  docs.forEach(doc => {
    const fields = doc.fields || {};
    const tipo = fields.tipo ? fields.tipo.stringValue : 'N/A';
    const status = fields.status ? fields.status.stringValue : 'N/A';
    const userId = fields.userId ? fields.userId.stringValue : 'N/A';
    console.log(doc.name.split('/').pop(), "=>", tipo, "Status:", status, "UserID:", userId);
  });
}
fetchDocs().catch(console.error);
