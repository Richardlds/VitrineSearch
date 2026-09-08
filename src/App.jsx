import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, Filter, Download, Phone, Globe, MapPinned, ExternalLink, 
  CheckCircle2, History, Star, MessageSquare, Map, LayoutList, ChevronLeft, 
  ChevronRight, Activity, Handshake, ThumbsDown, Megaphone, Target, Wand2, 
  X, Send, Brain, Save, AlignLeft, Clock, Calendar, Ban, CalendarClock,
  SlidersHorizontal, ChevronDown, Copy, Check, Sparkles, Plus, RotateCcw
} from 'lucide-react';
import { supabase } from './lib/supabase';

const STATUS_CONFIG = {
  'Novo': { label: 'Novo', color: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400', icon: Target },
  'Contactado': { label: 'Contactado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400', icon: MessageSquare },
  'Sem Resposta': { label: 'Sem Resposta', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400', icon: Clock },
  'Retorno Futuro': { label: 'Retorno Futuro', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-400', icon: CalendarClock },
  'Agendado': { label: 'Reunião Agendada', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400', icon: Calendar },
  'Em Negociação': { label: 'Em Negociação', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400', icon: Activity },
  'Ganho': { label: 'Fechado / Ganho', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', icon: Handshake },
  'Ja Possui Site': { label: 'Já Possui Site', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400', icon: Globe },
  'Desqualificado': { label: 'Fora de Perfil', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400', icon: Ban },
  'Perdido': { label: 'Perdido', color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400', icon: ThumbsDown },
};

const NOTE_PRESETS = [
  'Sem resposta',
  'Pediu retorno',
  'Contato via Whats',
  'Sem interesse',
  'Fechamento em andamento'
];

const LeadCard = ({ lead, activeTab, updateLeadStatus, openMessageModal }) => {
  const [notesText, setNotesText] = useState(lead.observacoes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(lead.observacoes));
  const [copiedPhone, setCopiedPhone] = useState(false);

  const statusInfo = STATUS_CONFIG[lead.status || 'Novo'] || STATUS_CONFIG['Novo'];
  const StatusIcon = statusInfo.icon;

  const getGoogleMapsLink = (lead) => {
    const query = encodeURIComponent(`${lead.nome_empresa} ${lead.endereco || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await supabase.from('leads').update({ observacoes: notesText }).eq('id', lead.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error("Erro ao salvar observação", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setNotesText(prev => {
      if (!prev) return preset;
      if (prev.includes(preset)) return prev;
      return `${prev} | ${preset}`;
    });
  };

  const cleanPhone = lead.telefone ? lead.telefone.replace(/\D/g, '') : null;

  const handleCopyPhone = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (lead.telefone) {
      navigator.clipboard.writeText(lead.telefone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div className="card hover:border-slate-500/80 transition-all duration-200 group flex flex-col gap-3 sm:gap-4 bg-surface/90 border border-slate-700/60 shadow-lg">
      
      {/* Top Section: Responsive Layout (Stacked on Mobile, Side-by-Side on Desktop) */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 items-start lg:items-center justify-between">
        
        {/* Info Column */}
        <div className="flex-1 min-w-0 w-full">
          
          {/* Header row: Company name & badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-primary transition-colors break-words leading-snug">
              {lead.nome_empresa}
            </h3>

            <div className="flex items-center gap-1.5 flex-wrap">
              {lead.website && lead.telefone && (
                <span title="Lead com alto potencial de conversão" className="inline-flex items-center bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/25 whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Alto Potencial
                </span>
              )}

              <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border whitespace-nowrap ${statusInfo.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Details Row: Rating, Phone, Address, Search Keyword */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-slate-400">
            {lead.rating ? (
              <div className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 text-xs">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 flex-shrink-0" />
                <span>{lead.rating}</span>
              </div>
            ) : (
              <span className="text-[11px] sm:text-xs text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                Sem avaliações
              </span>
            )}

            {lead.telefone ? (
              <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5">
                <a
                  href={`tel:${cleanPhone}`}
                  title="Ligar para o lead"
                  className="font-medium text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span>{lead.telefone}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  title="Copiar telefone"
                  className="text-slate-400 hover:text-white ml-0.5 p-0.5 transition-colors"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ) : (
              <span className="text-[11px] sm:text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
                Sem telefone
              </span>
            )}

            <div className="inline-flex items-center gap-1 text-slate-400 min-w-0 max-w-full text-xs">
              <MapPinned className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={lead.endereco}>
                {lead.endereco || 'Endereço não disponível'}
              </span>
            </div>

            {lead.keyword_buscada && activeTab !== 'search' && (
              <div className="text-[10px] sm:text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 capitalize inline-flex items-center gap-1">
                <Search className="w-2.5 h-2.5 text-slate-500" />
                <span className="truncate max-w-[150px]">{lead.keyword_buscada}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel: Responsive (Full width on Mobile, Compact on Desktop) */}
        <div className="w-full lg:w-auto flex-shrink-0 flex flex-col gap-2 bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-800">
          
          {/* Status Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Etapa:
            </span>
            <div className="relative flex-1 lg:flex-initial">
              <select
                className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg pl-2.5 pr-7 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer transition-colors appearance-none"
                value={lead.status || 'Novo'}
                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
              >
                {Object.keys(STATUS_CONFIG).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons: WhatsApp, Maps, Site */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              onClick={() => openMessageModal(lead)}
              disabled={!lead.telefone}
              title={lead.telefone ? "Abrir mensagem para WhatsApp" : "Sem telefone cadastrado"}
              className={`text-xs py-2 px-2 sm:px-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 border select-none ${
                lead.telefone
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-800/30 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>

            <a
              href={getGoogleMapsLink(lead)}
              target="_blank"
              rel="noreferrer"
              title="Ver localização no Google Maps"
              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 py-2 px-2 sm:px-3 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 active:scale-95 text-center"
            >
              <Map className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Maps</span>
            </a>

            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                title={lead.website}
                className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 py-2 px-2 sm:px-3 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 active:scale-95 text-center"
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Site</span>
              </a>
            ) : (
              <div
                title="Sem website cadastrado"
                className="text-xs bg-slate-800/30 text-slate-600 border border-slate-800/60 py-2 px-2 sm:px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 cursor-not-allowed select-none text-center"
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Sem site</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRM Notes Accordion */}
      <div className="pt-2 sm:pt-3 border-t border-slate-800 mt-0.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <AlignLeft className="w-3.5 h-3.5 text-primary" />
            <span>Observações do CRM</span>
            {notesText && !showNotes && (
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showNotes ? 'rotate-180' : ''}`} />
          </button>

          {showNotes && (
            <button
              onClick={handleSaveNotes}
              disabled={isSaving}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 border active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isSaving ? (
                <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
              ) : saveSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{saveSuccess ? 'Salvo' : 'Salvar'}</span>
            </button>
          )}
        </div>

        {showNotes && (
          <div className="mt-2 space-y-2 animate-in fade-in duration-200">
            {/* Quick Note Presets for Fast Mobile Tapping */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase whitespace-nowrap">Atalhos:</span>
              {NOTE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-[11px] px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700/60 whitespace-nowrap transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              className="input-field w-full min-h-[64px] sm:min-h-[72px] text-xs sm:text-sm resize-y bg-slate-900/90 border-slate-700 rounded-lg p-2.5 focus:border-primary"
              placeholder="Ex: Cliente pediu retorno na terça às 15h, só atende por WhatsApp..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('search');

  // Search State
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // History & CRM State
  const [savedLeads, setSavedLeads] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState('');
  const HISTORY_PAGE_SIZE = 20;

  // Filtros Globais
  const [websiteFilter, setWebsiteFilter] = useState('any'); // any, has_website, no_website, instagram
  const [filterPhone, setFilterPhone] = useState(false);
  const [filterHighPotential, setFilterHighPotential] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [crmStatusFilter, setCrmStatusFilter] = useState('Todos');

  // Mobile Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal State
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState(null);
  const [modalMessageText, setModalMessageText] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // RAG / Knowledge Base State
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved'
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // API Usage State
  const [apiUsage, setApiUsage] = useState({ used: 0, total: 2500 });

  // Contagem de Filtros Ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (websiteFilter !== 'any') count++;
    if (filterPhone) count++;
    if (filterHighPotential) count++;
    if (minRating > 0) count++;
    if (activeTab === 'crm' && crmStatusFilter !== 'Todos') count++;
    return count;
  }, [websiteFilter, filterPhone, filterHighPotential, minRating, activeTab, crmStatusFilter]);

  // Carregar Base de Conhecimento
  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('knowledge_base').eq('id', 1).single();
        if (data && !error && data.knowledge_base) {
          setAiKnowledgeBase(data.knowledge_base);
        }
      } catch (e) {
        console.error("Erro ao carregar base de conhecimento", e);
      } finally {
        setIsInitialLoad(false);
      }
    };
    fetchKnowledge();
  }, []);

  // Salvar Base de Conhecimento (Debounce 1s)
  useEffect(() => {
    if (isInitialLoad) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await supabase.from('settings').update({ knowledge_base: aiKnowledgeBase }).eq('id', 1);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (e) {
        console.error("Erro ao salvar base de conhecimento", e);
        setSaveStatus('');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [aiKnowledgeBase, isInitialLoad]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHistorySearch(historySearch), 500);
    return () => clearTimeout(timer);
  }, [historySearch]);

  const loadRecentSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('last_searched_at', { ascending: false })
        .limit(10);
      if (data && !error) setRecentSearches(data);
    } catch (e) {
      console.error("Erro ao carregar buscas recentes", e);
    }
  };

  const loadApiUsage = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .gte('last_searched_at', startOfMonth.toISOString());

      if (!error && count !== null) {
        const dbUsed = count * 3;
        const offset = parseInt(localStorage.getItem('api_usage_offset') || '0', 10);
        setApiUsage({ used: dbUsed + offset, total: 2500, dbUsed });
      }
    } catch (e) {
      console.error("Erro ao carregar uso da API", e);
    }
  };

  const calibrateApiUsage = () => {
    const currentBalanceStr = prompt("Qual é o saldo restante exato no seu painel Serper.dev?", (apiUsage.total - apiUsage.used).toString());
    if (currentBalanceStr !== null) {
      const currentBalance = parseInt(currentBalanceStr.replace(/\D/g, ''), 10);
      if (!isNaN(currentBalance)) {
        const realUsed = 2500 - currentBalance;
        const newOffset = realUsed - (apiUsage.dbUsed || 0);
        localStorage.setItem('api_usage_offset', newOffset.toString());
        setApiUsage(prev => ({ ...prev, used: realUsed }));
      }
    }
  };

  const loadSavedLeads = useCallback(async (page = 0) => {
    setLoadingHistory(true);
    try {
      let query = supabase.from('leads').select('*', { count: 'exact' });

      if (activeTab === 'history') {
        query = query.eq('status', 'Novo');
      } else if (activeTab === 'followup') {
        query = query.eq('status', 'Retorno Futuro');
      } else if (activeTab === 'crm') {
        if (crmStatusFilter === 'Todos') {
          query = query.neq('status', 'Novo');
        } else {
          query = query.eq('status', crmStatusFilter);
        }
      }

      if (debouncedHistorySearch) {
        query = query.or(`nome_empresa.ilike.%${debouncedHistorySearch}%,keyword_buscada.ilike.%${debouncedHistorySearch}%,location_buscada.ilike.%${debouncedHistorySearch}%,telefone.ilike.%${debouncedHistorySearch}%,website.ilike.%${debouncedHistorySearch}%`);
      }

      if (websiteFilter === 'has_website' || filterHighPotential) query = query.not('website', 'is', null);
      if (websiteFilter === 'no_website') query = query.is('website', null);
      if (websiteFilter === 'instagram') query = query.ilike('website', '%instagram.com%');

      if (filterPhone || filterHighPotential) query = query.not('telefone', 'is', null);
      if (minRating > 0) query = query.gte('rating', minRating);

      const from = page * HISTORY_PAGE_SIZE;
      const to = from + HISTORY_PAGE_SIZE - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;

      if (!error && data) {
        setSavedLeads(data);
        if (count !== null) setHistoryTotal(count);
      }
    } catch (e) {
      console.error("Erro ao carregar leads salvos", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [debouncedHistorySearch, websiteFilter, filterPhone, filterHighPotential, minRating, activeTab, crmStatusFilter]);

  useEffect(() => {
    loadRecentSearches();
    loadApiUsage();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'crm' || activeTab === 'followup') {
      loadSavedLeads(historyPage);
    }
  }, [activeTab, historyPage, loadSavedLeads]);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'crm' || activeTab === 'followup') {
      setHistoryPage(0);
    }
  }, [debouncedHistorySearch, websiteFilter, filterPhone, filterHighPotential, minRating, activeTab, crmStatusFilter]);

  const handleSearch = async (e, forceKeyword = keyword, forceLocation = location) => {
    if (e) e.preventDefault();
    if (!forceKeyword || !forceLocation) {
      alert("Preencha a palavra-chave e a localização!");
      return;
    }

    setKeyword(forceKeyword);
    setLocation(forceLocation);
    setLoading(true);
    setActiveTab('search');
    setIsMobileFilterOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('search-leads', {
        body: { keyword: forceKeyword, location: forceLocation }
      });
      if (error) throw error;
      if (data && data.leads) {
        setLeads(data.leads);
        loadRecentSearches();
        loadApiUsage();
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Ocorreu um erro ao buscar os leads.');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
      if (error) throw error;

      if (activeTab === 'search') {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      } else {
        if (activeTab === 'history' && newStatus !== 'Novo') {
          setSavedLeads(prev => prev.filter(l => l.id !== leadId));
        } else if (activeTab === 'followup' && newStatus !== 'Retorno Futuro') {
          setSavedLeads(prev => prev.filter(l => l.id !== leadId));
        } else {
          setSavedLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        }
      }
    } catch (e) {
      console.error("Erro ao atualizar status", e);
    }
  };

  const filteredSearchLeads = useMemo(() => {
    if (activeTab !== 'search') return [];
    return leads.filter(lead => {
      if (websiteFilter === 'has_website' && !lead.website) return false;
      if (websiteFilter === 'no_website' && lead.website) return false;
      if (websiteFilter === 'instagram' && (!lead.website || !lead.website.toLowerCase().includes('instagram.com'))) return false;

      if (filterPhone && !lead.telefone) return false;
      if (filterHighPotential && !(lead.website && lead.telefone)) return false;
      if (minRating > 0 && (lead.rating || 0) < minRating) return false;
      return true;
    });
  }, [leads, websiteFilter, filterPhone, filterHighPotential, minRating, activeTab]);

  const displayedLeads = activeTab === 'search' ? filteredSearchLeads : savedLeads;
  const totalLeadsDisplayedCount = activeTab === 'search' ? filteredSearchLeads.length : historyTotal;
  const totalPages = Math.ceil(historyTotal / HISTORY_PAGE_SIZE);

  // Modal Functions
  const openMessageModal = (lead) => {
    setSelectedLeadForMessage(lead);
    setCopiedMessage(false);
    setModalMessageText(`Olá ${lead.nome_empresa}! Vi o perfil de vocês no Google Maps e gostaria de apresentar uma oportunidade para aumentarem o faturamento.`);
  };

  const closeMessageModal = () => {
    setSelectedLeadForMessage(null);
    setModalMessageText('');
    setCopiedMessage(false);
  };

  const generateAIMessage = async () => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: {
          keyword: selectedLeadForMessage.keyword_buscada || keyword,
          nome_empresa: selectedLeadForMessage.nome_empresa,
          endereco: selectedLeadForMessage.endereco,
          rating: selectedLeadForMessage.rating,
          knowledgeBase: aiKnowledgeBase
        }
      });
      if (error) throw error;
      if (data && data.message) {
        setModalMessageText(data.message);
      }
    } catch (error) {
      console.error('Erro na IA:', error);
      alert('Ocorreu um erro ao gerar a mensagem com IA.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCopyModalMessage = () => {
    if (modalMessageText) {
      navigator.clipboard.writeText(modalMessageText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedLeadForMessage || !selectedLeadForMessage.telefone) return;
    const cleanPhone = selectedLeadForMessage.telefone.replace(/\D/g, '');

    if (selectedLeadForMessage.status === 'Novo' || !selectedLeadForMessage.status) {
      updateLeadStatus(selectedLeadForMessage.id, 'Contactado');
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(modalMessageText)}`, '_blank');
    closeMessageModal();
  };

  // Exportar Leads para CSV
  const handleExportCSV = () => {
    if (!displayedLeads || displayedLeads.length === 0) return;
    const headers = ['Nome da Empresa', 'Telefone', 'Website', 'Endereço', 'Avaliação', 'Status', 'Observações'];
    const rows = displayedLeads.map(l => [
      `"${(l.nome_empresa || '').replace(/"/g, '""')}"`,
      `"${(l.telefone || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.endereco || '').replace(/"/g, '""')}"`,
      `"${l.rating || ''}"`,
      `"${(l.status || 'Novo').replace(/"/g, '""')}"`,
      `"${(l.observacoes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vitrine_leads_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAllFilters = () => {
    setWebsiteFilter('any');
    setFilterPhone(false);
    setFilterHighPotential(false);
    setMinRating(0);
    setCrmStatusFilter('Todos');
  };

  // Componente de Conteúdo da Barra Lateral (Desktop & Drawer Mobile)
  const FilterSidebarContent = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* API Usage Card */}
      <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Uso da API (Serper)
          </h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            Mensal
          </span>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1.5">
            <button
              type="button"
              className="cursor-pointer hover:text-white transition-colors flex items-center gap-1 border-b border-dashed border-slate-500 pb-0.5"
              onClick={calibrateApiUsage}
              title="Clique para sincronizar com o Serper.dev"
            >
              {apiUsage.total - apiUsage.used} restantes ✏️
            </button>
            <span>{apiUsage.total} max</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                apiUsage.used / apiUsage.total > 0.9 ? 'bg-red-500' :
                apiUsage.used / apiUsage.total > 0.7 ? 'bg-amber-400' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((apiUsage.used / apiUsage.total) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Estimativa baseada no histórico do mês.
          </p>
        </div>
      </div>

      {/* Search Criteria Form (Desktop) */}
      <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Critérios de Captação
          </h2>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              title="Limpar todos os filtros"
              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Limpar ({activeFiltersCount})
            </button>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSearch}>
          <div className={activeTab !== 'search' ? 'hidden lg:block' : 'block'}>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">Nicho / Palavra-chave</label>
              <input
                type="text"
                placeholder="ex: Clínica de Estética"
                className="input-field"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5">Localização Alvo</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ex: São Paulo, SP"
                  className="input-field pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/50 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Filtros Avançados
            </span>

            {activeTab === 'crm' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-primary">Filtrar por Status (CRM)</label>
                <select
                  className="input-field text-xs sm:text-sm bg-slate-800 border-primary/50 focus:ring-1 focus:ring-primary cursor-pointer text-white font-medium"
                  value={crmStatusFilter}
                  onChange={(e) => setCrmStatusFilter(e.target.value)}
                >
                  <option value="Todos">Mostrar Todos</option>
                  {Object.keys(STATUS_CONFIG).filter(s => s !== 'Novo').map(status => (
                    <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm text-slate-300">Presença Digital (Site)</label>
              <select
                className="input-field text-xs sm:text-sm bg-slate-800 border-slate-600 focus:ring-1 focus:ring-primary cursor-pointer"
                value={websiteFilter}
                onChange={(e) => setWebsiteFilter(e.target.value)}
              >
                <option value="any">Qualquer (Com ou Sem Site)</option>
                <option value="has_website">Exigir Website Ativo</option>
                <option value="no_website">Sem Website (Oportunidade)</option>
                <option value="instagram">Apenas Instagram</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 text-primary focus:ring-primary bg-slate-800 cursor-pointer"
                checked={filterPhone}
                onChange={(e) => setFilterPhone(e.target.checked)}
              />
              <span className="text-xs sm:text-sm text-slate-300">Exigir Telefone</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800 cursor-pointer"
                checked={filterHighPotential}
                onChange={(e) => setFilterHighPotential(e.target.checked)}
              />
              <span className="text-xs sm:text-sm text-emerald-400 font-medium">Apenas Alto Potencial</span>
            </label>

            <div className="pt-2">
              <div className="flex justify-between items-center text-xs sm:text-sm text-slate-300 mb-1.5">
                <span>Nota Mínima (Google)</span>
                <span className="font-semibold text-amber-400">
                  {minRating > 0 ? `${minRating}+ Estrelas` : 'Qualquer'}
                </span>
              </div>
              <input
                type="range"
                min="0" max="5" step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {activeTab === 'search' && (
            <div className="pt-3">
              <button type="submit" className="btn-primary w-full shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Iniciar Varredura</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Saved Searches Shortcuts */}
      {activeTab === 'search' && (
        <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm p-4 sm:p-5">
          <h2 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2 text-slate-300">
            <LayoutList className="w-4 h-4 text-slate-400" />
            Consultas Salvas (Atalhos)
          </h2>

          {recentSearches.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-700/50 rounded-lg bg-slate-800/20">
              Nenhuma busca salva ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {recentSearches.map((item, i) => (
                <button
                  key={item.id || i}
                  onClick={() => {
                    handleSearch(null, item.keyword, item.location);
                    setIsMobileFilterOpen(false);
                  }}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-600 text-xs sm:text-sm cursor-pointer"
                >
                  <div className="font-medium text-white line-clamp-1 capitalize">{item.keyword}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1 capitalize">
                    <MapPin className="w-3 h-3" /> {item.location}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-safe-nav lg:pb-12 relative text-slate-100 selection:bg-primary/30 selection:text-white">
      
      {/* Top Header: Sticky with Glassmorphism */}
      <header className="border-b border-slate-800/90 bg-surface/80 backdrop-blur-xl sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Mobile Serper Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0 text-white">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                VitrineSearch
              </span>
            </div>
          </div>

          {/* Desktop Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'search' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Nova Busca</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history' ? 'bg-slate-800 text-white shadow border border-slate-700/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Leads Brutos</span>
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'crm' ? 'bg-slate-800 text-white shadow border-b-2 border-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-primary" />
              <span>CRM</span>
            </button>
            <button
              onClick={() => setActiveTab('followup')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'followup' ? 'bg-slate-800 text-white shadow border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarClock className="w-4 h-4 text-cyan-400" />
              <span>Retorno</span>
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'training' ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Treinamento IA</span>
            </button>
          </nav>

          {/* Right Header Actions: API Balance Pill & Mobile Filter Button */}
          <div className="flex items-center gap-2">
            {/* Quick Serper API Badge */}
            <button
              type="button"
              onClick={calibrateApiUsage}
              title="Saldo Serper.dev (Clique para calibrar)"
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="hidden xs:inline">Saldo:</span>
              <span className="text-white font-bold">{apiUsage.total - apiUsage.used}</span>
            </button>

            {/* Mobile Filter Toggle Button */}
            {activeTab !== 'training' && (
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-5 sm:gap-6 lg:gap-8">

        {activeTab === 'training' ? (
          /* Training IA Screen */
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                <Brain className="w-6 h-6 text-indigo-400" />
                Treinamento da IA (Base de Conhecimento)
              </h1>
              <p className="text-slate-400 mt-1.5 text-xs sm:text-sm leading-relaxed">
                Adicione aqui tudo o que a IA precisa saber sobre o seu negócio: serviços prestados, valores médios, diferenciais competitivos e orientações de abordagem no WhatsApp.
              </p>
            </div>

            <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Conhecimento Estratégico para Vendas
                </label>
                {saveStatus === 'saving' && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando alterações...</span>
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvo na nuvem</span>
                  </div>
                )}
              </div>

              <textarea
                className="input-field w-full min-h-[350px] sm:min-h-[480px] text-xs sm:text-sm leading-relaxed resize-y bg-slate-900 border-slate-700 shadow-inner p-4 font-mono text-slate-300"
                value={aiKnowledgeBase}
                onChange={(e) => setAiKnowledgeBase(e.target.value)}
                placeholder="Exemplo:&#10;&#10;NOME DA EMPRESA: Agência Alpha&#10;SERVIÇOS: Sites institucionais, Landing Pages de alta conversão, Gestão de Tráfego.&#10;PREÇOS: A partir de R$ 997,00 em até 12x.&#10;DIFERENCIAL: Entrega em 7 dias, suporte contínuo e foco em captação de clientes.&#10;TOM DE VOZ: Profissional, direto ao ponto e consultivo.&#10;COMO ABORDAR: Elogie a empresa, mencione que encontrou no Google Maps e convide para uma avaliação gratuita de 10 minutos."
              />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Persistent Sidebar (>= 1024px) */}
            <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-20 self-start">
              <FilterSidebarContent />
            </aside>

            {/* Mobile / Tablet Filter Drawer */}
            {isMobileFilterOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
                <div 
                  className="fixed inset-0"
                  onClick={() => setIsMobileFilterOpen(false)}
                />
                <div className="relative bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 shadow-2xl flex flex-col z-10">
                  
                  {/* Drawer Drag Pill & Header */}
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3"></div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 sticky top-0 bg-slate-900 z-20">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-base text-white">Filtros & Critérios</h3>
                    </div>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <FilterSidebarContent />

                  <div className="pt-4 border-t border-slate-800 mt-4 sticky bottom-0 bg-slate-900 z-20 flex gap-2">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={resetAllFilters}
                        className="w-1/3 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-semibold text-xs text-center"
                      >
                        Limpar
                      </button>
                    )}
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="btn-primary flex-1 py-2.5 font-semibold text-xs sm:text-sm"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* MOBILE ONLY: Quick Search Card in "Nova Busca" tab (eliminates friction) */}
              {activeTab === 'search' && (
                <div className="lg:hidden card bg-surface/90 border-slate-700/80 p-4 mb-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Varredura de Leads
                    </h2>
                    {recentSearches.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        {recentSearches.length} recentes
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSearch} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Nicho (ex: Clínicas de Estética)"
                        className="input-field py-2 text-sm"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Localização (ex: São Paulo, SP)"
                        className="input-field pl-9 py-2 text-sm"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-primary/25"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Buscar Leads</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Quick Recent Search Badges on Mobile */}
                  {recentSearches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase whitespace-nowrap">Recentes:</span>
                      {recentSearches.slice(0, 4).map((item, i) => (
                        <button
                          key={item.id || i}
                          type="button"
                          onClick={() => handleSearch(null, item.keyword, item.location)}
                          className="text-[11px] px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 whitespace-nowrap"
                        >
                          {item.keyword}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feed Header: Title, Total Count, Search Bar, CSV Export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                    {activeTab === 'search' && 'Resultados da Varredura'}
                    {activeTab === 'history' && 'Leads Brutos Recentes'}
                    {activeTab === 'crm' && 'Monitoramento (CRM)'}
                    {activeTab === 'followup' && 'Retorno Futuro (Follow-up)'}

                    {(activeTab === 'history' || activeTab === 'crm' || activeTab === 'followup') && loadingHistory && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    <span className="font-semibold text-slate-200">{totalLeadsDisplayedCount}</span> leads em foco
                  </p>
                </div>

                {/* Search & Export Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {(activeTab === 'history' || activeTab === 'crm' || activeTab === 'followup') && (
                    <div className="relative flex-1 sm:w-60">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar leads..."
                        className="input-field pl-9 py-1.5 text-xs sm:text-sm bg-slate-900 border-slate-700 shadow-inner"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                    </div>
                  )}

                  {displayedLeads.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      title="Exportar lista atual para CSV"
                      className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all border border-slate-700 flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CRM Horizontal Funnel Chips (Instant mobile & desktop navigation across stages) */}
              {activeTab === 'crm' && (
                <div className="mb-3.5 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
                  <div className="flex items-center gap-1.5 min-w-max">
                    <button
                      type="button"
                      onClick={() => setCrmStatusFilter('Todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                        crmStatusFilter === 'Todos'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'
                      }`}
                    >
                      Todos
                    </button>
                    {Object.keys(STATUS_CONFIG).filter(s => s !== 'Novo').map(status => {
                      const cfg = STATUS_CONFIG[status];
                      const isSelected = crmStatusFilter === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setCrmStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-slate-800 text-white border-slate-600 shadow'
                              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800/80'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Horizontal Filter Chips (Touch Friendly Carousel) */}
              <div className="mb-4 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-1.5 min-w-max">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-primary" /> Filtros:
                  </span>

                  {/* Website Filter Toggle Chips */}
                  <button
                    type="button"
                    onClick={() => setWebsiteFilter(f => f === 'has_website' ? 'any' : 'has_website')}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      websiteFilter === 'has_website'
                        ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Com Site</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWebsiteFilter(f => f === 'no_website' ? 'any' : 'no_website')}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      websiteFilter === 'no_website'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>Sem Site (Oportunidade)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWebsiteFilter(f => f === 'instagram' ? 'any' : 'instagram')}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      websiteFilter === 'instagram'
                        ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 font-semibold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>Instagram</span>
                  </button>

                  {/* Phone Filter Chip */}
                  <button
                    type="button"
                    onClick={() => setFilterPhone(f => !f)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      filterPhone
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>Com Telefone</span>
                  </button>

                  {/* High Potential Chip */}
                  <button
                    type="button"
                    onClick={() => setFilterHighPotential(f => !f)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      filterHighPotential
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Alto Potencial</span>
                  </button>

                  {/* 4+ Stars Chip */}
                  <button
                    type="button"
                    onClick={() => setMinRating(r => r === 4 ? 0 : 4)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      minRating === 4
                        ? 'bg-amber-400/20 text-amber-400 border-amber-400/40 font-semibold'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>★ 4.0+</span>
                  </button>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-xs px-2 py-1 text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Feed Content: Cards List or Empty States */}
              {(activeTab === 'search' && leads.length === 0 && !loading) ? (
                <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none py-12 px-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-slate-200">Pronto para prospectar</p>
                  <p className="text-slate-400 mt-1 text-xs sm:text-sm max-w-sm">
                    Preencha o nicho e a localização para iniciar a varredura automática de empresas no Google Maps.
                  </p>
                </div>
              ) : (activeTab === 'history' && savedLeads.length === 0 && !loadingHistory && !debouncedHistorySearch && websiteFilter === 'any' && !filterPhone && minRating === 0) ? (
                <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none py-12 px-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
                    <History className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600" />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-slate-200">Seu histórico está vazio</p>
                  <p className="text-slate-400 mt-1 text-xs sm:text-sm max-w-sm">
                    Faça sua primeira busca na aba "Busca" para popular seu banco de leads brutos.
                  </p>
                </div>
              ) : (activeTab === 'crm' && savedLeads.length === 0 && !loadingHistory && !debouncedHistorySearch) ? (
                <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none py-12 px-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
                    <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-slate-200">Nenhum lead nesta etapa</p>
                  <p className="text-slate-400 mt-1 text-xs sm:text-sm max-w-sm">
                    Altere o status de qualquer lead para incluí-lo no funil de vendas do CRM.
                  </p>
                </div>
              ) : (activeTab === 'followup' && savedLeads.length === 0 && !loadingHistory && !debouncedHistorySearch) ? (
                <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none py-12 px-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50 shadow-inner">
                    <CalendarClock className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-slate-200">Nenhum retorno futuro agendado</p>
                  <p className="text-slate-400 mt-1 text-xs sm:text-sm max-w-sm">
                    Defina o status de um lead como "Retorno Futuro" para acompanhá-lo aqui.
                  </p>
                </div>
              ) : ((activeTab === 'history' || activeTab === 'crm' || activeTab === 'followup') && savedLeads.length === 0 && !loadingHistory) ? (
                <div className="p-8 text-center text-slate-400 bg-surface rounded-xl border border-slate-700">
                  Nenhum lead encontrado com a sua pesquisa ou filtros atuais.
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="grid gap-3 sm:gap-4 flex-1">
                    {displayedLeads.map((lead, i) => (
                      <LeadCard
                        key={lead.id || i}
                        lead={lead}
                        activeTab={activeTab}
                        updateLeadStatus={updateLeadStatus}
                        openMessageModal={openMessageModal}
                      />
                    ))}
                  </div>

                  {/* Responsive Pagination Controls */}
                  {(activeTab === 'history' || activeTab === 'crm' || activeTab === 'followup') && totalPages > 1 && (
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-5">
                      <span className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
                        Página <span className="font-semibold text-white">{historyPage + 1}</span> de <span className="font-semibold text-white">{totalPages}</span>
                      </span>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                          disabled={historyPage === 0 || loadingHistory}
                          className="px-3.5 py-2 rounded-lg border border-slate-700 bg-surface text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Anterior</span>
                        </button>

                        {/* Desktop Numeric Pages */}
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = historyPage - 2 + i;
                            if (historyPage < 2) pageNum = i;
                            if (historyPage > totalPages - 3) pageNum = totalPages - 5 + i;
                            if (pageNum < 0 || pageNum >= totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setHistoryPage(pageNum)}
                                disabled={loadingHistory}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                  historyPage === pageNum
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                    : 'border-slate-700/80 bg-surface text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          })}
                        </div>

                        {/* Mobile Compact Page Display */}
                        <div className="sm:hidden text-xs font-bold text-slate-300 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                          {historyPage + 1} / {totalPages}
                        </div>

                        <button
                          onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={historyPage === totalPages - 1 || loadingHistory}
                          className="px-3.5 py-2 rounded-lg border border-slate-700 bg-surface text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <span>Próxima</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for thumb-friendly app feel) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-1 py-1.5 pb-safe shadow-2xl">
        <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'text-primary font-bold bg-primary/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-[11px] tracking-tight">Busca</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'text-white font-bold bg-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-[11px] tracking-tight">Brutos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'crm'
                ? 'text-primary font-bold bg-primary/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-[11px] tracking-tight">CRM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('followup')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'followup'
                ? 'text-cyan-400 font-bold bg-cyan-400/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-[11px] tracking-tight">Retorno</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('training')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'training'
                ? 'text-indigo-400 font-bold bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-[11px] tracking-tight">Treinar IA</span>
          </button>
        </div>
      </nav>

      {/* Responsive WhatsApp Message Modal (Bottom Sheet on Mobile, Centered Modal on Desktop) */}
      {selectedLeadForMessage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] shadow-2xl overflow-hidden flex flex-col">

            {/* Mobile Drag Pill */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-2.5 mb-1"></div>

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/90 sticky top-0 z-10">
              <div className="min-w-0 pr-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                  <MessageSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{selectedLeadForMessage.nome_empresa}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-400">
                  {selectedLeadForMessage.telefone && (
                    <span className="text-emerald-400 font-medium">{selectedLeadForMessage.telefone}</span>
                  )}
                  {selectedLeadForMessage.rating && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {selectedLeadForMessage.rating}
                    </span>
                  )}
                  {selectedLeadForMessage.endereco && (
                    <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400" title={selectedLeadForMessage.endereco}>
                      {selectedLeadForMessage.endereco}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={closeMessageModal}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors flex-shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 bg-surface overflow-y-auto flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-300">
                  Mensagem Personalizada de Abordagem
                </label>
                <button
                  type="button"
                  onClick={generateAIMessage}
                  disabled={generatingAI}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/25 disabled:opacity-60 cursor-pointer"
                >
                  {generatingAI ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{generatingAI ? 'Criando mensagem...' : 'Gerar com IA'}</span>
                </button>
              </div>

              <textarea
                className="input-field w-full min-h-[140px] sm:min-h-[180px] text-sm leading-relaxed resize-none bg-slate-900/95 border-slate-700/90 p-3 text-slate-100"
                value={modalMessageText}
                onChange={(e) => setModalMessageText(e.target.value)}
                placeholder="Escreva sua abordagem aqui ou gere com a IA..."
              />
              <p className="text-[11px] text-slate-400">
                Ao enviar, o lead será automaticamente marcado como <span className="text-blue-400 font-semibold">"Contactado"</span> no seu CRM.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 sticky bottom-0 pb-safe">
              <button
                onClick={closeMessageModal}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-center cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCopyModalMessage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMessage ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
