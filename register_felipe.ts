import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function registerMember() {
  const email = "felipe.hilgert@gmail.com"; // E-mail base sugerido
  const userId = email.replace(/[^a-zA-Z0-9]/g, '_');

  const memberData = {
    nome: "Felipe Nodir Caetano Hilgert",
    email: email,
    cpf: "016.278.981-58",
    dataNascimento: "1997-12-06",
    telefone: "(66) 99250-2624",
    cidade: "Primavera do Leste",
    uf: "MT",
    cep: "78850-000",
    rua: "rua sorriso",
    numero: "1940",
    bairro: "poncho verde 3",
    grau: "Aprendiz",
    cargo: "Aspirante",
    esposa: "Tailessa de arruda pirai Hilgert",
    emergencia: "Tailessa de arruda pirai Hilgert",
    foneEmergencia: "(66) 99929-4229",
    qtdFilhos: 0,
    estadoCivil: "Casado/a",
    loja: "Jus Veritas 33",
    rito: "Emulação",
    role: "member",
    status: "ativo",
    dataCadastro: "2026-05-15",
    createdAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'users', userId), memberData);
    console.log("✅ Membro Felipe Nodir cadastrado com sucesso no Firestore!");
  } catch (e) {
    console.error("❌ Erro ao cadastrar:", e.message);
  }
}

registerMember();
