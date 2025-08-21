import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StudentTypeSelector from './StudentTypeSelector';
import StudentSearchForm from './StudentSearchForm';

interface FormData {
  nome: string;
  email: string;
  whatsapp: string;
  codigoAluno: string;
  nomeAluno: string;
  cpfResponsavel: string;
  arquivo: File | null;
}

interface StudentData {
  codigoAluno: string;
  nomeAluno: string;
  responsavelData: {
    nome: string;
    email: string;
    whatsapp: string;
    cpf: string;
  };
}

type FlowStep = 'selector' | 'search' | 'form';

const SignatureForm = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('selector');
  const [studentType, setStudentType] = useState<'novo' | 'rematricula' | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    whatsapp: '+55 ',
    codigoAluno: '',
    nomeAluno: '',
    cpfResponsavel: '',
    arquivo: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const formatWhatsAppInput = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Se começar com 55, remove para evitar duplicação
    const cleanNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
    
    // Limita a 11 dígitos (2 DDD + 9 número)
    const limitedNumbers = cleanNumbers.slice(0, 11);
    
    // Formata: +55 (XX) XXXXX-XXXX
    if (limitedNumbers.length === 0) return '+55 ';
    if (limitedNumbers.length <= 2) return `+55 (${limitedNumbers}`;
    if (limitedNumbers.length <= 7) return `+55 (${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    return `+55 (${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  };

  const formatWhatsAppForSubmit = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Se já tem 55 no início, usa como está, senão adiciona
    if (numbers.startsWith('55') && numbers.length >= 13) {
      return numbers.slice(0, 13);
    }
    
    // Adiciona 55 e limita a 13 dígitos total
    const withCountryCode = '55' + numbers;
    return withCountryCode.slice(0, 13);
  };

  const formatCPFInput = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Formata: XXX.XXX.XXX-XX
    if (limitedNumbers.length <= 3) return limitedNumbers;
    if (limitedNumbers.length <= 6) return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
    if (limitedNumbers.length <= 9) return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`;
    return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9)}`;
  };

  const handleTypeSelection = (type: 'novo' | 'rematricula') => {
    setStudentType(type);
    if (type === 'novo') {
      setCurrentStep('form');
    } else {
      setCurrentStep('search');
    }
  };

  const handleStudentFound = (studentData: StudentData) => {
    setFormData(prev => ({
      ...prev,
      nome: studentData.responsavelData.nome,
      email: studentData.responsavelData.email,
      whatsapp: studentData.responsavelData.whatsapp,
      codigoAluno: studentData.codigoAluno,
      nomeAluno: studentData.nomeAluno,
      cpfResponsavel: studentData.responsavelData.cpf,
    }));
    setCurrentStep('form');
  };

  const handleBackToSelector = () => {
    setCurrentStep('selector');
    setStudentType(null);
    // Reset form when going back to selector
    setFormData({
      nome: '',
      email: '',
      whatsapp: '+55 ',
      codigoAluno: '',
      nomeAluno: '',
      cpfResponsavel: '',
      arquivo: null
    });
  };

  const handleBackToSearch = () => {
    setCurrentStep('search');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'whatsapp') {
      const formattedValue = formatWhatsAppInput(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else if (field === 'cpfResponsavel') {
      const formattedValue = formatCPFInput(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      arquivo: file
    }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        arquivo: file
      }));
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do signatário é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Erro de validação",
        description: "Email válido é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    const whatsappNumbers = formData.whatsapp.replace(/\D/g, '');
    if (!formData.whatsapp.trim() || whatsappNumbers.length < 11) {
      toast({
        title: "Erro de validação",
        description: "WhatsApp deve ter DDD + 9 dígitos (ex: +55 (11) 99999-9999)",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.codigoAluno.trim()) {
      toast({
        title: "Erro de validação",
        description: "Código do aluno é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.nomeAluno.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do aluno é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    const cpfNumbers = formData.cpfResponsavel.replace(/\D/g, '');
    if (!formData.cpfResponsavel.trim() || cpfNumbers.length !== 11) {
      toast({
        title: "Erro de validação",
        description: "CPF deve conter 11 dígitos",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.arquivo) {
      toast({
        title: "Erro de validação",
        description: "Arquivo é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append('nome', formData.nome);
      submitFormData.append('email', formData.email);
      submitFormData.append('whatsapp', formatWhatsAppForSubmit(formData.whatsapp));
      submitFormData.append('codigoAluno', formData.codigoAluno);
      submitFormData.append('nomeAluno', formData.nomeAluno);
      submitFormData.append('cpfResponsavel', formData.cpfResponsavel.replace(/\D/g, ''));
      if (formData.arquivo) {
        submitFormData.append('arquivo', formData.arquivo);
      }

      const response = await fetch('https://n8n.colegiozampieri.com/webhook/zapsign', {
        method: 'POST',
        body: submitFormData,
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Formulário enviado com sucesso para processamento.",
        });
        
        // Reset form
        setFormData({
          nome: '',
          email: '',
          whatsapp: '+55 ',
          codigoAluno: '',
          nomeAluno: '',
          cpfResponsavel: '',
          arquivo: null
        });
        
        // Volta para o seletor
        setCurrentStep('selector');
        setStudentType(null);
      } else {
        throw new Error('Falha no envio');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar o formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStep === 'selector') {
    return <StudentTypeSelector onSelectType={handleTypeSelection} />;
  }

  if (currentStep === 'search') {
    return (
      <StudentSearchForm 
        onBack={handleBackToSelector}
        onStudentFound={handleStudentFound}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Envio para Assinatura
          </CardTitle>
          <CardDescription>
            {studentType === 'novo' ? 'Preencha os dados do aluno novo' : 'Dados pré-preenchidos da rematrícula'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome do Signatário
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email do Signatário
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite o email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium">
                WhatsApp do Signatário
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+55 (11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigoAluno" className="text-sm font-medium">
                Código do Aluno
              </Label>
              <Input
                id="codigoAluno"
                type="text"
                placeholder="Digite o código do aluno"
                value={formData.codigoAluno}
                onChange={(e) => handleInputChange('codigoAluno', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeAluno" className="text-sm font-medium">
                Nome do Aluno
              </Label>
              <Input
                id="nomeAluno"
                type="text"
                placeholder="Digite o nome do aluno"
                value={formData.nomeAluno}
                onChange={(e) => handleInputChange('nomeAluno', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfResponsavel" className="text-sm font-medium">
                CPF do Responsável
              </Label>
              <Input
                id="cpfResponsavel"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpfResponsavel}
                onChange={(e) => handleInputChange('cpfResponsavel', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Arquivo para Assinatura</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                
                {formData.arquivo ? (
                  <div className="flex items-center justify-center space-x-2 text-success">
                    <FileText size={20} />
                    <span className="text-sm font-medium">
                      {formData.arquivo.name}
                    </span>
                    <CheckCircle size={16} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique ou arraste o arquivo aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX até 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send size={16} />
                    <span>Enviar para Assinatura</span>
                  </div>
                )}
              </Button>

              {studentType === 'rematricula' && (
                <Button 
                  type="button"
                  onClick={handleBackToSearch}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Buscar Outro Aluno
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignatureForm;
