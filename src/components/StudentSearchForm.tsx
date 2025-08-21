
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface StudentSearchFormProps {
  onBack: () => void;
  onStudentFound: (data: StudentData) => void;
}

const StudentSearchForm = ({ onBack, onStudentFound }: StudentSearchFormProps) => {
  const [codigoAluno, setCodigoAluno] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatWhatsApp = (whatsapp: string): string => {
    if (!whatsapp) return '+55 ';
    
    // Remove todos os caracteres não numéricos
    const numbers = whatsapp.replace(/\D/g, '');
    
    // Se já tem 55 no início, usa como está, senão adiciona
    const withCountryCode = numbers.startsWith('55') ? numbers : '55' + numbers;
    
    // Limita a 13 dígitos total
    const limitedNumbers = withCountryCode.slice(0, 13);
    
    // Formata: +55 (XX) XXXXX-XXXX
    if (limitedNumbers.length <= 2) return '+55 ';
    if (limitedNumbers.length <= 4) return `+55 (${limitedNumbers.slice(2)}`;
    if (limitedNumbers.length <= 9) return `+55 (${limitedNumbers.slice(2, 4)}) ${limitedNumbers.slice(4)}`;
    return `+55 (${limitedNumbers.slice(2, 4)}) ${limitedNumbers.slice(4, 9)}-${limitedNumbers.slice(9)}`;
  };

  const formatCPF = (cpf: string): string => {
    if (!cpf) return '';
    
    // Remove todos os caracteres não numéricos
    const numbers = cpf.replace(/\D/g, '');
    
    // Formata: XXX.XXX.XXX-XX
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const getCompletedFieldsCount = (nome: string, email: string, telefone: string, cpf: string): number => {
    let count = 0;
    if (nome && nome.trim()) count++;
    if (email && email.trim()) count++;
    if (telefone && telefone.trim()) count++;
    if (cpf && cpf.trim()) count++;
    return count;
  };

  const handleSearch = async () => {
    if (!codigoAluno.trim()) {
      toast({
        title: "Erro",
        description: "Digite o código do aluno",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Primeiro verifica se o aluno existe em alunosIntegraSae
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunosIntegraSae')
        .select('codigo_aluno, aluno, nome_responsavel, email_resp, whatsapp_fin, CPF_resp_fin')
        .eq('codigo_aluno', parseInt(codigoAluno))
        .maybeSingle();

      if (alunosError) {
        console.error('Erro ao buscar aluno:', alunosError);
        toast({
          title: "Erro",
          description: "Erro ao buscar dados do aluno",
          variant: "destructive",
        });
        return;
      }

      if (!alunosData) {
        toast({
          title: "Aluno não encontrado",
          description: "Código do aluno não encontrado no sistema",
          variant: "destructive",
        });
        return;
      }

      // Busca dados de rematrícula usando a função
      const { data: rematriculaData, error: rematriculaError } = await supabase
        .rpc('rematricula_by_codigo_aluno', { 
          p_cod_aluno: parseInt(codigoAluno) 
        });

      if (rematriculaError) {
        console.error('Erro ao buscar dados de rematrícula:', rematriculaError);
      }

      const rematriculaRecord = rematriculaData?.[0];

      // Lógica inteligente para escolher o responsável
      let responsavelData;
      
      if (rematriculaRecord) {
        const respFinanceiro = rematriculaRecord["Resp. Financeiro"] || '';
        
        // Verifica se "Resp. Financeiro" indica preferência
        if (respFinanceiro.toLowerCase().includes('pai')) {
          responsavelData = {
            nome: rematriculaRecord["Nome do Pai"] || '',
            email: rematriculaRecord["Email do Pai"] || '',
            whatsapp: formatWhatsApp(rematriculaRecord["Telefone do Pai"] || ''),
            cpf: formatCPF(rematriculaRecord["CPF do Pai"] || ''),
          };
        } else if (respFinanceiro.toLowerCase().includes('mãe') || respFinanceiro.toLowerCase().includes('mae')) {
          responsavelData = {
            nome: rematriculaRecord["Nome da mãe"] || '',
            email: rematriculaRecord["Email da Mãe"] || '',
            whatsapp: formatWhatsApp(rematriculaRecord["Telefone da Mãe"] || ''),
            cpf: formatCPF(rematriculaRecord["CPF da mãe"] || ''),
          };
        } else {
          // Não há preferência clara, escolher quem tem mais dados completos
          const paiFields = getCompletedFieldsCount(
            rematriculaRecord["Nome do Pai"] || '',
            rematriculaRecord["Email do Pai"] || '',
            rematriculaRecord["Telefone do Pai"] || '',
            rematriculaRecord["CPF do Pai"] || ''
          );
          
          const maeFields = getCompletedFieldsCount(
            rematriculaRecord["Nome da mãe"] || '',
            rematriculaRecord["Email da Mãe"] || '',
            rematriculaRecord["Telefone da Mãe"] || '',
            rematriculaRecord["CPF da mãe"] || ''
          );

          if (paiFields > maeFields) {
            responsavelData = {
              nome: rematriculaRecord["Nome do Pai"] || '',
              email: rematriculaRecord["Email do Pai"] || '',
              whatsapp: formatWhatsApp(rematriculaRecord["Telefone do Pai"] || ''),
              cpf: formatCPF(rematriculaRecord["CPF do Pai"] || ''),
            };
          } else if (maeFields > paiFields) {
            responsavelData = {
              nome: rematriculaRecord["Nome da mãe"] || '',
              email: rematriculaRecord["Email da Mãe"] || '',
              whatsapp: formatWhatsApp(rematriculaRecord["Telefone da Mãe"] || ''),
              cpf: formatCPF(rematriculaRecord["CPF da mãe"] || ''),
            };
          } else {
            // Empate ou ambos vazios, usar dados de alunosIntegraSae como fallback
            responsavelData = {
              nome: alunosData.nome_responsavel || '',
              email: alunosData.email_resp || '',
              whatsapp: formatWhatsApp(alunosData.whatsapp_fin || ''),
              cpf: formatCPF(alunosData.CPF_resp_fin || ''),
            };
          }
        }
      } else {
        // Não há dados de rematrícula, usar apenas alunosIntegraSae
        responsavelData = {
          nome: alunosData.nome_responsavel || '',
          email: alunosData.email_resp || '',
          whatsapp: formatWhatsApp(alunosData.whatsapp_fin || ''),
          cpf: formatCPF(alunosData.CPF_resp_fin || ''),
        };
      }

      const studentData: StudentData = {
        codigoAluno: codigoAluno,
        nomeAluno: rematriculaRecord?.["Nome do Aluno"] || alunosData.aluno || '',
        responsavelData
      };

      onStudentFound(studentData);
      
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao buscar dados do aluno",
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
            Buscar Aluno
          </CardTitle>
          <CardDescription>
            Digite o código do aluno para rematrícula
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="codigo" className="text-sm font-medium">
              Código do Aluno
            </Label>
            <Input
              id="codigo"
              type="number"
              placeholder="Digite o código do aluno"
              value={codigoAluno}
              onChange={(e) => setCodigoAluno(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSearch}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Buscando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search size={16} />
                  <span>Buscar Aluno</span>
                </div>
              )}
            </Button>

            <Button 
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSearchForm;
