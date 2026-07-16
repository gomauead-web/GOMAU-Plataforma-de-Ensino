const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

// Initialize mock app using config project id
admin.initializeApp({
  projectId: serviceAccount.projectId
});

// Mock firestore using fetch directly
const projectId = serviceAccount.projectId;
async function fetchDocs() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/requests`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data.documents || [];
  console.log("Total requests:", docs.length);
  docs.forEach(doc => {
    const fields = doc.fields || {};
    const tipo = fields.tipo ? fields.tipo.stringValue : 'N/A';
    const status = fields.status ? fields.status.stringValue : 'N/A';
    const userId = fields.userId ? fields.userId.stringValue : 'N/A';
    console.log(doc.name, "=>", tipo, "Status:", status, userId);
  });
}
fetchDocs().catch(console.error);
