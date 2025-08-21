
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, RotateCcw } from 'lucide-react';

interface StudentTypeSelectorProps {
  onSelectType: (type: 'novo' | 'rematricula') => void;
}

const StudentTypeSelector = ({ onSelectType }: StudentTypeSelectorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Tipo de Matrícula
          </CardTitle>
          <CardDescription>
            Selecione se é um aluno novo ou rematrícula
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={() => onSelectType('novo')}
            className="w-full h-16 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
          >
            <UserPlus className="mr-3 h-6 w-6" />
            Aluno Novo
          </Button>
          
          <Button 
            onClick={() => onSelectType('rematricula')}
            variant="outline"
            className="w-full h-16 text-lg border-primary text-primary hover:bg-primary/10"
          >
            <RotateCcw className="mr-3 h-6 w-6" />
            Rematrícula
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTypeSelector;
