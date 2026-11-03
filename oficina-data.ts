import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as XLSX from "xlsx";

export type TipoAtendimento = "domicilio" | "box" | "pre_compra";

/** Tipos de atendimento: rótulo e forma usada em frases ("ofertado a domicílio"). */
export const TIPOS_ATENDIMENTO: { v: TipoAtendimento; label: string; texto: string }[] = [
  { v: "domicilio", label: "A domicílio", texto: "a domicílio" },
  { v: "box", label: "Box oficina", texto: "no box da oficina" },
  { v: "pre_compra", label: "Avaliação pré-compra", texto: "na avaliação pré-compra" },
];
export const tipoInfo = (t: TipoAtendimento) => TIPOS_ATENDIMENTO.find((x) => x.v === t)!;
export type StatusOrcamento = "rascunho" | "enviado" | "aprovado" | "recusado";
export type StatusOS = "aberta" | "em_execucao" | "concluida";
export type TipoItem = "servico" | "peca";

export interface Item {
  id: string;
  tipo: TipoItem;
  /** Serviço do catálogo (somente itens do tipo "servico"). */
  servicoId?: string;
  descricao: string;
  qtd: number;
  valorUnit: number;
}

export interface Taxas {
  taxaVisita: number;
  custoKm: number;
  custoHoraBox: number;
}

export interface Orcamento {
  id: string;
  data: string;
  cliente: { nome: string; telefone: string; email: string; documento: string; endereco: string };
  veiculo: { marca: string; modelo: string; ano: string; placa: string; km: string };
  tipo: TipoAtendimento;
  kmDeslocamento: number;
  horasBox: number;
  taxas: Taxas;
  itens: Item[];
  observacoes: string;
  status: StatusOrcamento;
  osId?: string;
}

export interface OrdemServico {
  id: string;
  orcamentoId: string;
  abertura: string;
  status: StatusOS;
}

export const STATUS_ORC: Record<StatusOrcamento, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100" },
  enviado: { label: "Enviado", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
  aprovado: { label: "Aprovado", cls: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" },
  recusado: { label: "Recusado", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
};

export const STATUS_OS: Record<StatusOS, { label: string; cls: string }> = {
  aberta: { label: "Aberta", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  em_execucao: { label: "Em execução", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
  concluida: { label: "Concluída", cls: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" },
};

export interface ServicoCatalogo {
  id: string;
  nome: string;
  valor: number;
  ofertadoEm: TipoAtendimento[];
  ativo: boolean;
}

/** Serviços ofertados aos clientes, com valor e onde cada um é atendido. */
export const CATALOGO_PADRAO: ServicoCatalogo[] = [
  { id: "dtc", nome: "Ler/apagar DTCs", valor: 30, ofertadoEm: ["domicilio", "box"], ativo: true },
  { id: "diag-eletrico", nome: "Diagnóstico elétrico básico", valor: 45, ofertadoEm: ["domicilio", "box"], ativo: true },
  { id: "oleo-filtros", nome: "Troca de óleo + filtros", valor: 65, ofertadoEm: ["box"], ativo: true },
  { id: "pastilhas", nome: "Troca de pastilhas", valor: 65, ofertadoEm: ["box"], ativo: true },
  { id: "discos", nome: "Troca de discos", valor: 100, ofertadoEm: ["box"], ativo: true },
  { id: "disco-pastilha", nome: "Troca de disco + pastilha", valor: 120, ofertadoEm: ["box"], ativo: true },
  { id: "amortecedores", nome: "Troca de amortecedores", valor: 200, ofertadoEm: ["box"], ativo: true },
  { id: "avaliacao-pre-compra", nome: "Avaliação pré-compra", valor: 250, ofertadoEm: ["pre_compra"], ativo: true },
];

export const servicoDoCatalogo = (catalogo: ServicoCatalogo[], id?: string) => catalogo.find((c) => c.id === id);

/** Itens de serviço que não são ofertados no tipo de atendimento escolhido. */
export const servicosNaoOfertados = (o: Orcamento, catalogo: ServicoCatalogo[]) =>
  o.itens.filter((i) => i.tipo === "servico" && !servicoDoCatalogo(catalogo, i.servicoId)?.ofertadoEm.includes(o.tipo));

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function calcular(o: Orcamento) {
  const servicos = o.itens.filter((i) => i.tipo === "servico").reduce((s, i) => s + i.qtd * i.valorUnit, 0);
  const pecas = o.itens.filter((i) => i.tipo === "peca").reduce((s, i) => s + i.qtd * i.valorUnit, 0);
  const visita = o.tipo === "domicilio" ? o.taxas.taxaVisita : 0;
  const deslocamento = o.tipo === "domicilio" || o.tipo === "pre_compra" ? o.kmDeslocamento * o.taxas.custoKm : 0;
  const box = o.tipo === "box" ? o.horasBox * o.taxas.custoHoraBox : 0;
  const atendimento = visita + deslocamento + box;
  return { servicos, pecas, visita, deslocamento, box, atendimento, total: servicos + pecas + atendimento };
}

const uid = () => Math.random().toString(36).slice(2, 10);
const it = (tipo: TipoItem, descricao: string, qtd: number, valorUnit: number): Item => ({ id: uid(), tipo, descricao, qtd, valorUnit });
const sv = (servicoId: string, qtd = 1): Item => {
  const c = CATALOGO_PADRAO.find((x) => x.id === servicoId)!;
  return { id: uid(), tipo: "servico", servicoId, descricao: c.nome, qtd, valorUnit: c.valor };
};
const TAXAS_PADRAO: Taxas = { taxaVisita: 80, custoKm: 2.5, custoHoraBox: 45 };

const SEED: Orcamento[] = [
  { id: "ORC-0001", data: "2026-10-20", cliente: { nome: "Mariana Albuquerque", telefone: "(11) 98812-4410", email: "mariana.alb@email.com", documento: "312.554.870-12", endereco: "Rua das Acácias, 155 – Vila Mariana, São Paulo/SP" }, veiculo: { marca: "Volkswagen", modelo: "Polo 1.0 TSI", ano: "2021", placa: "FKT-2D41", km: "48.300" }, tipo: "domicilio", kmDeslocamento: 18, horasBox: 0, taxas: TAXAS_PADRAO, itens: [sv("dtc"), sv("diag-eletrico")], observacoes: "Cliente prefere atendimento pela manhã.", status: "aprovado", osId: "OS-0001" },
  { id: "ORC-0002", data: "2026-10-22", cliente: { nome: "Carlos Henrique Prado", telefone: "(11) 97455-0982", email: "chprado@email.com", documento: "128.903.441-07", endereco: "Av. Jabaquara, 2040 – Saúde, São Paulo/SP" }, veiculo: { marca: "Fiat", modelo: "Toro Freedom 2.0", ano: "2020", placa: "GHJ-8A17", km: "92.150" }, tipo: "box", kmDeslocamento: 0, horasBox: 3, taxas: TAXAS_PADRAO, itens: [sv("disco-pastilha"), it("peca", "Jogo de pastilhas dianteiras", 1, 245), it("peca", "Par de discos de freio", 1, 390), it("peca", "Fluido de freio DOT4 (500 ml)", 2, 36)], observacoes: "", status: "aprovado", osId: "OS-0002" },
  { id: "ORC-0003", data: "2026-10-24", cliente: { nome: "Juliana Torres", telefone: "(11) 99301-7765", email: "ju.torres@email.com", documento: "455.120.338-90", endereco: "Rua Cayowaá, 870 – Perdizes, São Paulo/SP" }, veiculo: { marca: "Honda", modelo: "HR-V EXL", ano: "2019", placa: "EZR-5C02", km: "71.800" }, tipo: "domicilio", kmDeslocamento: 26, horasBox: 0, taxas: TAXAS_PADRAO, itens: [sv("dtc"), sv("diag-eletrico")], observacoes: "Luz de injeção acesa no painel.", status: "enviado" },
  { id: "ORC-0004", data: "2026-10-27", cliente: { nome: "Roberto Siqueira", telefone: "(11) 98120-3344", email: "roberto.sq@email.com", documento: "098.776.512-33", endereco: "Rua Tuim, 410 – Moema, São Paulo/SP" }, veiculo: { marca: "Chevrolet", modelo: "Onix LT 1.0", ano: "2022", placa: "RTA-9F63", km: "33.420" }, tipo: "box", kmDeslocamento: 0, horasBox: 2, taxas: TAXAS_PADRAO, itens: [sv("oleo-filtros"), it("peca", "Óleo 5W30 sintético (L)", 4, 45), it("peca", "Filtro de óleo", 1, 38), it("peca", "Filtro de ar", 1, 52)], observacoes: "", status: "aprovado", osId: "OS-0003" },
  { id: "ORC-0005", data: "2026-10-29", cliente: { nome: "Patrícia Nogueira", telefone: "(11) 96654-2201", email: "pat.nogueira@email.com", documento: "377.402.119-55", endereco: "Rua Apinajés, 1200 – Sumaré, São Paulo/SP" }, veiculo: { marca: "Toyota", modelo: "Corolla XEi 2.0", ano: "2018", placa: "FMP-3B88", km: "104.900" }, tipo: "box", kmDeslocamento: 0, horasBox: 4, taxas: TAXAS_PADRAO, itens: [sv("amortecedores"), it("peca", "Amortecedor dianteiro", 2, 410), it("peca", "Kit batente e coifa", 2, 85)], observacoes: "Aguardando aprovação do cliente.", status: "enviado" },
  { id: "ORC-0006", data: "2026-10-30", cliente: { nome: "André Lacerda", telefone: "(11) 99877-1029", email: "andre.lac@email.com", documento: "201.665.904-21", endereco: "Rua Fradique Coutinho, 95 – Pinheiros, São Paulo/SP" }, veiculo: { marca: "Hyundai", modelo: "HB20 Comfort", ano: "2017", placa: "DLX-4E29", km: "128.000" }, tipo: "domicilio", kmDeslocamento: 12, horasBox: 0, taxas: TAXAS_PADRAO, itens: [sv("diag-eletrico")], observacoes: "", status: "recusado" },
  { id: "ORC-0007", data: "2026-11-01", cliente: { nome: "Fernanda Ribeiro", telefone: "(11) 97012-5583", email: "fe.ribeiro@email.com", documento: "509.338.207-48", endereco: "Rua Vergueiro, 3185 – Vila Mariana, São Paulo/SP" }, veiculo: { marca: "Renault", modelo: "Kwid Zen", ano: "2023", placa: "SBK-1H55", km: "15.600" }, tipo: "box", kmDeslocamento: 0, horasBox: 1.5, taxas: TAXAS_PADRAO, itens: [sv("pastilhas"), it("peca", "Jogo de pastilhas dianteiras", 1, 189)], observacoes: "", status: "rascunho" },
  { id: "ORC-0009", data: "2026-11-03", cliente: { nome: "Bruno Cavalcanti", telefone: "(11) 99560-4128", email: "bruno.cav@email.com", documento: "740.215.663-09", endereco: "Av. Pompeia, 1580 – Pompeia, São Paulo/SP" }, veiculo: { marca: "Volkswagen", modelo: "T-Cross Highline", ano: "2021", placa: "GBR-6J30", km: "61.400" }, tipo: "pre_compra", kmDeslocamento: 22, horasBox: 0, taxas: TAXAS_PADRAO, itens: [sv("avaliacao-pre-compra")], observacoes: "Avaliação no endereço do vendedor antes da compra.", status: "enviado" },
  { id: "ORC-0008", data: "2026-11-02", cliente: { nome: "Lucas Martins", telefone: "(11) 98234-6670", email: "lucas.mts@email.com", documento: "622.814.093-60", endereco: "Rua Guaipá, 320 – Vila Leopoldina, São Paulo/SP" }, veiculo: { marca: "Jeep", modelo: "Renegade Longitude", ano: "2021", placa: "QWE-7G14", km: "56.210" }, tipo: "domicilio", kmDeslocamento: 30, horasBox: 0, taxas: TAXAS_PADRAO, itens: [sv("dtc")], observacoes: "Luz de alerta no painel após troca de bateria.", status: "rascunho" },
];

const SEED_OS: OrdemServico[] = [
  { id: "OS-0001", orcamentoId: "ORC-0001", abertura: "2026-10-21", status: "concluida" },
  { id: "OS-0002", orcamentoId: "ORC-0002", abertura: "2026-10-23", status: "em_execucao" },
  { id: "OS-0003", orcamentoId: "ORC-0004", abertura: "2026-10-28", status: "aberta" },
];

const nextId = (prefix: string, ids: string[]) => {
  const n = ids.reduce((m, id) => Math.max(m, Number(id.split("-")[1]) || 0), 0) + 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
};
const hoje = () => new Date().toISOString().slice(0, 10);

interface OficinaState {
  catalogo: ServicoCatalogo[];
  adicionarServico: (s: Omit<ServicoCatalogo, "id">) => void;
  atualizarServico: (id: string, patch: Partial<Omit<ServicoCatalogo, "id">>) => void;
  removerServico: (id: string) => void;
  orcamentos: Orcamento[];
  ordens: OrdemServico[];
  taxasPadrao: Taxas;
  setTaxasPadrao: (t: Taxas) => void;
  novoOrcamento: () => string;
  atualizar: (id: string, patch: Partial<Orcamento>) => void;
  excluir: (id: string) => void;
  gerarOS: (orcamentoId: string) => string;
  statusOS: (osId: string, status: StatusOS) => void;
}

export const useOficina = create<OficinaState>()(
  persist(
    (set, get) => ({
      catalogo: CATALOGO_PADRAO,
      adicionarServico: (novo) => set((s) => ({ catalogo: [...s.catalogo, { ...novo, id: `srv-${uid()}` }] })),
      atualizarServico: (id, patch) =>
        set((s) => ({ catalogo: s.catalogo.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removerServico: (id) => set((s) => ({ catalogo: s.catalogo.filter((c) => c.id !== id) })),
      orcamentos: SEED,
      ordens: SEED_OS,
      taxasPadrao: TAXAS_PADRAO,
      setTaxasPadrao: (t) => set({ taxasPadrao: t }),
      novoOrcamento: () => {
        const id = nextId("ORC", get().orcamentos.map((o) => o.id));
        const novo: Orcamento = {
          id, data: hoje(),
          cliente: { nome: "", telefone: "", email: "", documento: "", endereco: "" },
          veiculo: { marca: "", modelo: "", ano: "", placa: "", km: "" },
          tipo: "box", kmDeslocamento: 0, horasBox: 1, taxas: { ...get().taxasPadrao },
          itens: [], observacoes: "", status: "rascunho",
        };
        set((s) => ({ orcamentos: [novo, ...s.orcamentos] }));
        return id;
      },
      atualizar: (id, patch) =>
        set((s) => ({ orcamentos: s.orcamentos.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      excluir: (id) =>
        set((s) => ({
          orcamentos: s.orcamentos.filter((o) => o.id !== id),
          ordens: s.ordens.filter((os) => os.orcamentoId !== id),
        })),
      gerarOS: (orcamentoId) => {
        const existente = get().orcamentos.find((o) => o.id === orcamentoId)?.osId;
        if (existente) return existente;
        const id = nextId("OS", get().ordens.map((o) => o.id));
        set((s) => ({
          ordens: [...s.ordens, { id, orcamentoId, abertura: hoje(), status: "aberta" }],
          orcamentos: s.orcamentos.map((o) => (o.id === orcamentoId ? { ...o, osId: id, status: "aprovado" } : o)),
        }));
        return id;
      },
      statusOS: (osId, status) =>
        set((s) => ({ ordens: s.ordens.map((o) => (o.id === osId ? { ...o, status } : o)) })),
    }),
    {
      name: "oficina-orcamentos-os-v2",
      version: 1,
      // Dados salvos antes do atendimento de avaliação pré-compra: inclui o novo serviço no catálogo.
      migrate: (persisted, version) => {
        const st = persisted as Partial<OficinaState>;
        if (version < 1 && st.catalogo && !st.catalogo.some((c) => c.id === "avaliacao-pre-compra")) {
          st.catalogo = [...st.catalogo, CATALOGO_PADRAO.find((c) => c.id === "avaliacao-pre-compra")!];
        }
        return st as OficinaState;
      },
    },
  ),
);

export const novoItem = (tipo: TipoItem): Item => it(tipo, "", 1, 0);
export const itemDoCatalogo = (c: ServicoCatalogo): Item => ({ id: uid(), tipo: "servico", servicoId: c.id, descricao: c.nome, qtd: 1, valorUnit: c.valor });

/** Link do orçamento dentro do app, usado nas planilhas de OS. */
export function linkOrcamento(id: string) {
  return `${window.location.origin}${window.location.pathname}?orcamento=${encodeURIComponent(id)}`;
}

const fmtData = (d: string) => d.split("-").reverse().join("/");
const tipoLabel = (t: TipoAtendimento) => tipoInfo(t).label;

export function exportarOS(os: OrdemServico, o: Orcamento) {
  const c = calcular(o);
  const link = linkOrcamento(o.id);
  const rows: (string | number)[][] = [
    ["ORDEM DE SERVIÇO", os.id],
    ["Orçamento vinculado", o.id],
    ["Link do orçamento", link],
    ["Abertura", fmtData(os.abertura)],
    ["Status da OS", STATUS_OS[os.status].label],
    [],
    ["CLIENTE"],
    ["Nome", o.cliente.nome], ["CPF/CNPJ", o.cliente.documento], ["Telefone", o.cliente.telefone], ["E-mail", o.cliente.email], ["Endereço", o.cliente.endereco],
    [],
    ["VEÍCULO"],
    ["Marca/Modelo", `${o.veiculo.marca} ${o.veiculo.modelo}`.trim()], ["Ano", o.veiculo.ano], ["Placa", o.veiculo.placa], ["Quilometragem", o.veiculo.km],
    [],
    ["ATENDIMENTO", tipoLabel(o.tipo)],
    ...(o.tipo === "domicilio"
      ? [["Taxa de visita", c.visita], [`Deslocamento (${o.kmDeslocamento} km × ${brl(o.taxas.custoKm)})`, c.deslocamento]]
      : o.tipo === "pre_compra"
        ? [[`Deslocamento (${o.kmDeslocamento} km × ${brl(o.taxas.custoKm)})`, c.deslocamento]]
        : [[`Aluguel do box (${o.horasBox} h × ${brl(o.taxas.custoHoraBox)})`, c.box]]),
    [],
    ["ITENS", "Tipo", "Qtd", "Valor unit.", "Subtotal"],
    ...o.itens.map((i) => [i.descricao, i.tipo === "servico" ? "Serviço" : "Peça", i.qtd, i.valorUnit, i.qtd * i.valorUnit]),
    [],
    ["Serviços", c.servicos], ["Peças", c.pecas], ["Atendimento", c.atendimento], ["TOTAL", c.total],
    [],
    ["Observações", o.observacoes],
    [],
    ["Assinatura do cliente", ""], ["Assinatura do responsável", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["B2"].l = { Target: link, Tooltip: "Abrir orçamento" };
  ws["B3"].l = { Target: link, Tooltip: "Abrir orçamento" };
  ws["!cols"] = [{ wch: 42 }, { wch: 22 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, os.id);
  XLSX.writeFile(wb, `${os.id}_${o.id}.xlsx`);
}

export function exportarTodasOS(ordens: OrdemServico[], orcamentos: Orcamento[]) {
  const header = ["OS", "Abertura", "Status OS", "Orçamento", "Link do orçamento", "Cliente", "Telefone", "Veículo", "Placa", "Atendimento", "Serviços", "Peças", "Atendimento (R$)", "Total"];
  const body = ordens.map((os) => {
    const o = orcamentos.find((x) => x.id === os.orcamentoId);
    if (!o) return [os.id, fmtData(os.abertura), STATUS_OS[os.status].label, os.orcamentoId];
    const c = calcular(o);
    return [os.id, fmtData(os.abertura), STATUS_OS[os.status].label, o.id, linkOrcamento(o.id), o.cliente.nome, o.cliente.telefone, `${o.veiculo.marca} ${o.veiculo.modelo}`, o.veiculo.placa, tipoLabel(o.tipo), c.servicos, c.pecas, c.atendimento, c.total];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  body.forEach((r, i) => {
    const cell = ws[XLSX.utils.encode_cell({ r: i + 1, c: 4 })];
    if (cell && typeof r[4] === "string") cell.l = { Target: r[4], Tooltip: "Abrir orçamento" };
  });
  ws["!cols"] = header.map((h) => ({ wch: Math.max(12, h.length + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ordens de Serviço");
  XLSX.writeFile(wb, `ordens-de-servico_${hoje()}.xlsx`);
}
