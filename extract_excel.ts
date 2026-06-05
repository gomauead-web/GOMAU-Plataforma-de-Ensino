import * as XLSX from 'xlsx';
import * as fs from 'fs';

try {
  const file = fs.readFileSync('./public/validado.xlsx');
  const workbook = XLSX.read(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log("COLUNAS_ENCONTRADAS:", Object.keys(data[0] || {}));
  console.log("TOTAL_LINHAS:", data.length);
  
  const results = data.map((row: any) => ({
    nome: row['Nome'] || row['NOME'] || row['nome'],
    email: row['Email Vinculado'] || row['EMAIL'] || row['Email'] || row['email'],
    cpf: row['CPF'] || row['Cpf'] || row['cpf']
  }));
  
  console.log("LISTA_MEMBROS:", JSON.stringify(results, null, 2));
} catch (e) {
  console.error("ERRO_AO_LER_EXCEL:", e.message);
}
