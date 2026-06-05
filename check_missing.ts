import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Mock config for script (requires actual env vars or config file)
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMissingMembers() {
  try {
    // 1. Read Excel
    const file = fs.readFileSync('./public/validado.xlsx');
    const workbook = XLSX.read(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet) as any[];
    
    const excelEmails = excelData.map(row => (row['Email Vinculado'] || row['Email'] || '').toLowerCase().trim()).filter(e => e !== '');
    const excelNames = excelData.map(row => (row['Nome'] || '').trim());

    // 2. Read Firestore
    const querySnapshot = await getDocs(collection(db, 'users'));
    const firestoreEmails = querySnapshot.docs.map(doc => (doc.data().email || '').toLowerCase().trim());

    console.log("--- RESULTADOS DA ANALISE ---");
    console.log(`Membros no Excel: ${excelData.length}`);
    console.log(`Membros no Firestore: ${querySnapshot.size}`);

    const missing = excelData.filter(row => {
      const email = (row['Email Vinculado'] || row['Email'] || '').toLowerCase().trim();
      return !firestoreEmails.includes(email);
    });

    if (missing.length > 0) {
      console.log(`\n⚠️ ENCONTRADOS ${missing.length} MEMBROS NO EXCEL QUE NÃO ESTÃO NO SISTEMA:`);
      missing.forEach(m => console.log(`- Nome: ${m['Nome']} | E-mail: ${m['Email Vinculado']}`));
    } else {
      console.log("\n✅ Todos os membros do Excel estão presentes no Firestore.");
    }

  } catch (e) {
    console.error("Erro na análise:", e.message);
  }
}

checkMissingMembers();
