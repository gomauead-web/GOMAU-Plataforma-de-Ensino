const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const projectId = serviceAccount.projectId;
const dbId = 'ai-studio-4947e18d-5e04-42f7-b67e-418dc87b0705';

async function fetchDocs() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/users`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data.documents || [];
  console.log("Total users:", docs.length);
}
fetchDocs().catch(console.error);
