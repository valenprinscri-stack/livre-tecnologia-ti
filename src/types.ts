export type ID = string;

export type ChamadoStatus = 'Aberto' | 'Em Atendimento' | 'Aguardando Peça' | 'Concluído';
export type ChamadoPrioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type ChamadoCategoria = 'Redes' | 'Hardware' | 'Servidores' | 'Suporte ao Usuário' | 'Cabeamento' | 'Internet/Wi-Fi' | 'Computador/Hardware' | 'Impressora' | 'Outros';

export interface NotaAtendimento {
  id: ID;
  data: string;
  tecnico: string;
  texto: string;
}

export interface Chamado {
  id: ID;
  clienteId: ID;
  titulo: string;
  categoria: ChamadoCategoria;
  prioridade: ChamadoPrioridade;
  status: ChamadoStatus;
  descricao: string;
  tecnico: string;
  dataAbertura: string;
  notas: NotaAtendimento[];
}

export type ContratoStatus = 'Ativo' | 'Suspenso' | 'Cancelado';

export interface Contrato {
  id: ID;
  clienteId: ID;
  valorMensal: number;
  diaVencimento: number;
  dataInicio: string;
  dataTermino: string;
  escopo: string;
  chamadosFranquia: number; // 0 = ilimitado
  status: ContratoStatus;
}

export type ContaStatus = 'Pendente' | 'Pago' | 'Atrasado';
export type ContaTipo = 'Receber' | 'Pagar';

export interface Conta {
  id: ID;
  tipo: ContaTipo;
  descricao: string;
  clienteId?: ID;
  fornecedor: string;
  valor: number;
  vencimento: string;
  categoria: string;
  status: ContaStatus;
  origem?: 'contrato' | 'orcamento' | 'manual';
  orcamentoId?: ID;
  contratoId?: ID;
}

export type OrcamentoStatus = 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado';

export interface OrcamentoItem {
  id: ID;
  tipo: 'Material' | 'Serviço';
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Orcamento {
  id: ID;
  clienteId: ID;
  itens: OrcamentoItem[];
  desconto: number;
  prazo: string;
  formaPagamento: string;
  status: OrcamentoStatus;
  data: string;
  observacoes: string;
}

export interface Cliente {
  id: ID;
  tipo: 'PJ' | 'PF';
  nome: string;
  documento: string; // CNPJ or CPF
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  observacoes: string;
}

export interface Produto {
  id: ID;
  nome: string;
  custoCompra: number;
  precoVenda: number;
  estoque: number;
}

export interface Servico {
  id: ID;
  nome: string;
  descricao: string;
  valor: number;
}

export interface ConfigEmpresa {
  nome: string;
  cnpj: string;
  whatsapp: string;
  email: string;
  endereco: string;
  chavePix: string;
  termosGarantia: string;
}

export interface AppData {
  clientes: Cliente[];
  chamados: Chamado[];
  contratos: Contrato[];
  contas: Conta[];
  orcamentos: Orcamento[];
  produtos: Produto[];
  servicos: Servico[];
  config: ConfigEmpresa;
}
