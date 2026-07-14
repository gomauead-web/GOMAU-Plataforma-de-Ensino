import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import {
  Heart,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Coins,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

// Standard CRC-CCITT (0x1021) for valid Pix QR codes
function crc16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      const bit = ((code >> (7 - j)) & 1) === 1;
      const c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (bit !== c15) {
        crc ^= polynomial;
      }
    }
  }
  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Generate static Pix Copia e Cola payload
export function generatePixPayload(
  pixKey: string,
  merchantName: string,
  amount: number,
  merchantCity: string = "RIO DE JANEIRO"
) {
  const cleanKey = pixKey.trim();
  const cleanName = merchantName
    .substring(0, 25)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "");
  const cleanCity = merchantCity
    .substring(0, 15)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "");

  const parts: string[] = [];

  // 00: Payload Format Indicator
  parts.push("000201");

  // 26: Merchant Account Info
  const gui = "0014br.gov.bcb.pix";
  const keyTag = "01" + String(cleanKey.length).padStart(2, "0") + cleanKey;
  const merchantAccountInfo =
    "26" +
    String(gui.length + keyTag.length).padStart(2, "0") +
    gui +
    keyTag;
  parts.push(merchantAccountInfo);

  // 52: Merchant Category Code (0000)
  parts.push("52040000");

  // 53: Currency (986 for BRL)
  parts.push("5303986");

  // 54: Transaction Amount
  if (amount > 0) {
    const amtStr = amount.toFixed(2);
    parts.push("54" + String(amtStr.length).padStart(2, "0") + amtStr);
  }

  // 58: Country Code (BR)
  parts.push("5802BR");

  // 59: Merchant Name
  parts.push("59" + String(cleanName.length).padStart(2, "0") + cleanName);

  // 60: Merchant City
  parts.push("60" + String(cleanCity.length).padStart(2, "0") + cleanCity);

  // 62: Additional Data Field (Reference tag)
  const txId = "***";
  const additionalData = "05" + String(txId.length).padStart(2, "0") + txId;
  parts.push(
    "62" + String(additionalData.length).padStart(2, "0") + additionalData
  );

  // 63: CRC16
  const incompletePayload = parts.join("") + "6304";
  const crc = crc16(incompletePayload);
  return incompletePayload + crc;
}

export function TroncoBeneficencia() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [sacolaLimpaAtivada, setSacolaLimpaAtivada] = useState<boolean>(false);

  const pixKey = "contato@faculdademaconicamg.com.br";
  const pixName = "Darlan Martins da Silva";
  const currentLoja = user?.loja || "GOMAU EAD";

  // Generate open-amount Pix payload (amount = 0 allows the user to type any value in their bank app)
  const pixPayload = generatePixPayload(pixKey, pixName, 0, "BELO HORIZONTE");

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success("Chave Pix copiada com sucesso!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePassSacolaLimpa = async () => {
    try {
      // Simple anonymous tracking for stats
      await addDoc(collection(db, "tronco_doacoes"), {
        amount: 0,
        loja: currentLoja,
        isSacolaLimpa: true,
        timestamp: serverTimestamp(),
        status: "sacola_limpa",
      });

      setSacolaLimpaAtivada(true);
      toast.success("A Sacola correu limpa sob o manto do sigilo.");
    } catch (err) {
      console.error("Erro ao passar de sacola limpa:", err);
      setSacolaLimpaAtivada(true);
    }
  };

  return (
    <div className="bg-[#0F172A] border border-[#1e293b] rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background masonic aesthetics */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-full pointer-events-none" />

      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4 mb-5">
        <div className="p-2.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_10px_rgba(212,175,55,0.15)] animate-pulse">
          <Coins size={22} />
        </div>
        <div>
          <h3 className="font-bold text-gray-100 uppercase tracking-wide text-sm font-sans flex items-center gap-2">
            Tronco de Beneficência Digital
            <span className="text-[9px] font-extrabold bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/20 uppercase tracking-widest">
              Anônimo
            </span>
          </h3>
          <p className="text-[10px] text-gray-500 font-sans mt-0.5">
            A caridade rituálica sob o selo do mais absoluto sigilo.
          </p>
        </div>
      </div>

      {/* Warning for perfect anonymity guarantee */}
      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-3 flex items-start gap-2.5 mb-5">
        <ShieldAlert className="text-[#D4AF37] shrink-0 mt-0.5" size={15} />
        <p className="text-[10px] text-[#D4AF37]/90 leading-normal font-sans">
          <strong>SIGILO INICIÁTICO:</strong> O óbolo é depositado diretamente na conta da instituição. O sistema não vincula dados pessoais a esta ação.
        </p>
      </div>

      {!sacolaLimpaAtivada ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* QR Code Column */}
          <div className="md:col-span-4 flex flex-col items-center justify-center bg-[#0A0E1A] p-4 rounded-xl border border-[#1e293b]">
            <div className="bg-white p-2.5 rounded-lg shadow-inner mb-2">
              <QRCodeSVG value={pixPayload} size={130} />
            </div>
            <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">
              Escaneie para doar qualquer valor
            </span>
          </div>

          {/* Key and Info Column */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
                Chave PIX Oficial
              </span>
              <div className="flex items-center gap-2">
                <div className="bg-[#0A0E1A] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#D4AF37] font-mono font-bold flex-1 select-all truncate">
                  {pixKey}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="p-2.5 bg-[#1e293b] text-gray-300 rounded-lg border border-[#1e293b] hover:border-[#D4AF37]/50 hover:text-white transition-all shadow-md"
                  title="Copiar Chave Pix"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
              <span className="text-[10px] text-gray-500 font-sans mt-1 block pl-1">
                Favorecido: <strong className="text-gray-300">{pixName}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handlePassSacolaLimpa}
                className="flex-1 min-w-[150px] bg-black/40 text-gray-400 border border-dashed border-[#1e293b] py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
                title="Cumprir o gesto ritualístico sem realizar transação financeira."
              >
                Passar de Sacola Limpa
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-950/30 border border-green-500/30 flex items-center justify-center text-green-400 animate-bounce">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-100 uppercase tracking-wider">
                A Sacola Correu Limpa!
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed max-w-md mt-2 font-sans italic">
                "O gesto ritualístico foi registrado. Que o G:.A:.D:.U:. multiplique vossas forças na jornada reta. O sigilo do seu gesto está resguardado sob a abóbada celeste."
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setSacolaLimpaAtivada(false)}
              className="bg-[#1e293b] text-xs text-gray-300 px-4 py-2 rounded-lg border border-[#1e293b] hover:text-white hover:border-[#D4AF37]/30 transition-all font-medium"
            >
              Exibir Chave Pix novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
