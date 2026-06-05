export type GenState = {
  activeMode: 'auto' | 'manual' | 'config';
  courseTitle: string;
  selectedGrau: string;
  manualProgram: string;
  status: string;
  streamingText: string;
  loading: boolean;
  generatedCourse: any;
};

type Listener = (state: GenState) => void;

class GeneratorState {
  private state: GenState = {
    activeMode: 'auto',
    courseTitle: '',
    selectedGrau: 'Aprendiz',
    manualProgram: '',
    status: '',
    streamingText: '',
    loading: false,
    generatedCourse: null,
  };
  private listeners: Set<Listener> = new Set();
  
  getState() {
    return this.state;
  }
  
  setState(newState: Partial<GenState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }
  
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify() {
    this.listeners.forEach(l => l(this.state));
  }
  
  // Funções helper para gerenciar log do que foi feito
  logGeneration(logData: any) {
    console.log("Log de Geração:", logData);
    // Aqui poderiamos salvar no firebase o progresso "parcial" se quisessemos
  }
}

export const generatorStore = new GeneratorState();
