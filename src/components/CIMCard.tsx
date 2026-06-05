import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CIMCardProps {
  nome: string;
  grau: string;
  loja: string;
  oriente: string;
  potencia: string;
  matricula: string;
  qrCodeSequence?: string;
  photoUrl?: string;
  downloadable?: boolean;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  estadoCivil?: string;
  esposa?: string;
  cargo?: string;
  rito?: string;
}

export const CIMCard: React.FC<CIMCardProps> = ({ 
  nome, 
  grau, 
  loja, 
  oriente, 
  potencia, 
  matricula, 
  qrCodeSequence, 
  photoUrl, 
  downloadable,
  cpf,
  dataNascimento,
  telefone,
  estadoCivil,
  esposa,
  cargo,
  rito
}) => {
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  
  const [frontBg, setFrontBg] = useState('/frente.png');
  const [backBg, setBackBg] = useState('/verso.png');

  // CPF with digits only for QR Code value (as requested)
  const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
  const qrCodeValue = cleanCpf || qrCodeSequence || matricula || '---';
  const validationCode = qrCodeSequence || matricula || '---';

  const downloadSide = async (elementRef: React.RefObject<HTMLDivElement | null>, sideName: string) => {
    if (!elementRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    
    try {
      const canvas = await html2canvas(elementRef.current, { 
        scale: 2, // 2x scale for print quality (1600x1010)
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `CIM_${sideName}_${nome.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch(err) {
      console.error(`Erro ao baixar ${sideName}:`, err);
      alert(`Não foi possível gerar a imagem do ${sideName}. Tente recarregar a página.`);
    }
  };

  const formatDateForDisplay = (dateStr?: string) => {
    if (!dateStr) return '---';
    const cleanStr = dateStr.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) return cleanStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return cleanStr;
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col xl:flex-row gap-8 items-center justify-center w-full">
        
        {/* FRENTE CARD VIEW */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Frente (Anverso)</span>
          <div 
            className="relative overflow-hidden shadow-2xl rounded-2xl bg-[#0F172A] border border-[#D4AF37]/20"
            style={{ width: '400px', height: '253px' }}
          >
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <div 
                ref={frontCardRef} 
                className="bg-white relative overflow-hidden" 
                style={{ width: '800px', height: '505px' }}
              >
                  {/* Template Background */}
                  <img 
                    id="front-cim-bg"
                    src={frontBg} 
                    onError={() => {
                      if (frontBg === '/frente.png') {
                        setFrontBg('/template_cim.png');
                      }
                    }}
                    alt="Template Frente" 
                    crossOrigin="anonymous" 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                  />
                  
                  {/* Photo Box */}
                  <div className="absolute z-10 overflow-hidden rounded-[15px] bg-gray-100 border border-gray-300 flex items-center justify-center" style={{ left: '50px', top: '168px', width: '210px', height: '272px' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Foto" crossOrigin="anonymous" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-400 font-bold uppercase text-xs text-center p-2">Sem Foto</div>
                    )}
                  </div>

                  {/* Text Overlay Section - Frente */}
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '235px' }}>
                      {nome || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '272px' }}>
                      {grau || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '308px' }}>
                      {loja || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '346px' }}>
                      {oriente || '---'}
                  </div>
                  <div className="absolute z-10 font-bold text-gray-900 text-[18px] font-sans whitespace-nowrap" style={{ left: '460px', top: '383px' }}>
                      {potencia || 'GOMAU'}
                  </div>

                  {/* Matricula Bottom Line */}
                  <div className="absolute z-10 flex items-center justify-center" style={{ left: '460px', top: '416px', width: '265px' }}>
                       <span className="font-bold text-[#D4AF37] text-[18px] tracking-widest">{matricula || '---'}</span>
                  </div>

                  {/* QR Code - Encode CPF raw digits */}
                  <div className="absolute z-10 flex flex-col items-center justify-center bg-white p-1 rounded-md shadow-sm" style={{ right: '43px', top: '190px' }}>
                      <QRCodeSVG value={qrCodeValue} size={156} level="H" includeMargin={false} />
                  </div>
                  
                  {/* Validation sequence */}
                  <div className="absolute z-10 flex items-center justify-center" style={{ right: '35px', top: '365px', width: '170px' }}>
                       <span className="font-bold text-[#D4AF37] text-[16px] tracking-widest text-center">{validationCode}</span>
                  </div>
              </div>
            </div>
          </div>
          
          {downloadable && (
            <button 
              onClick={() => downloadSide(frontCardRef, 'Frente')}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-[#D4AF37]/10"
            >
              Baixar Frente (Anverso)
            </button>
          )}
        </div>

        {/* VERSO CARD VIEW */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-widest text-[#D4AF37]">Verso (Reverso)</span>
          <div 
            className="relative overflow-hidden shadow-2xl rounded-2xl bg-[#0F172A] border border-[#D4AF37]/20"
            style={{ width: '400px', height: '253px' }}
          >
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
              <div 
                ref={backCardRef} 
                className="bg-white relative overflow-hidden" 
                style={{ width: '800px', height: '505px' }}
              >
                  {/* Template Background */}
                  <img 
                    id="back-cim-bg"
                    src={backBg} 
                    onError={() => {
                      if (backBg === '/verso.png') {
                        setBackBg('/carteira.png');
                      }
                    }}
                    alt="Template Verso" 
                    crossOrigin="anonymous" 
                    className="absolute inset-0 w-full h-full object-cover z-0" 
                  />
                  
                  {/* Card Values Overlay - Absolute positioned on Verso template lines */}
                  {/* Column 1 - Left fields */}
                  <div className="absolute z-10 flex flex-col gap-[14px]" style={{ left: '60px', top: '50px', width: '450px' }}>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CIM (Matrícula)</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{matricula || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CPF / Cadastro</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{cpf || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nascimento</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{formatDateForDisplay(dataNascimento)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estado Civil</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{estadoCivil || '---'}</span>
                    </div>
                    {esposa && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cônjuge (Esposa)</span>
                        <span className="font-bold text-gray-900 text-[16px] leading-tight truncate">{esposa}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ritualística / Rito</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{rito || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cargo Atual</span>
                      <span className="font-bold text-gray-900 text-[16px] leading-tight">{cargo || 'Membro'}</span>
                    </div>
                  </div>

                  {/* QR Code section - Right columns */}
                  <div className="absolute z-10 flex flex-col items-center justify-center bg-white p-1 rounded-md shadow-sm" style={{ right: '60px', top: '150px' }}>
                      <QRCodeSVG value={qrCodeValue} size={156} level="H" includeMargin={false} />
                  </div>

                  <div className="absolute z-10 text-center" style={{ right: '50px', top: '325px', width: '180px' }}>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Validador de Segurança</span>
                    <span className="font-bold text-[#D4AF37] text-[15px] block font-mono tracking-widest leading-none mt-1">{validationCode}</span>
                  </div>

                  <div className="absolute z-10 text-center text-gray-900 font-bold text-[12px]" style={{ right: '50px', top: '420px', width: '180px' }}>
                     <div className="border-t border-gray-400 pt-1">
                       <span>GRÃO-MESTRE GOMAU</span>
                     </div>
                  </div>
              </div>
            </div>
          </div>
          
          {downloadable && (
            <button 
              onClick={() => downloadSide(backCardRef, 'Verso')}
              className="bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-[#D4AF37]/10"
            >
              Baixar Verso (Reverso)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

