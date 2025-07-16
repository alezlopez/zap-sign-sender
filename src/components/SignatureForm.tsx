import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  nome: string;
  email: string;
  whatsapp: string;
  arquivo: File | null;
}

const SignatureForm = () => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    whatsapp: '',
    arquivo: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

    if (!formData.whatsapp.trim()) {
      toast({
        title: "Erro de validação",
        description: "WhatsApp é obrigatório",
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
      submitFormData.append('whatsapp', formData.whatsapp);
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
          whatsapp: '',
          arquivo: null
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Envio para Assinatura
          </CardTitle>
          <CardDescription>
            Preencha os dados do signatário e faça upload do documento
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
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignatureForm;