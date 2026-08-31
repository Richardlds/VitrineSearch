import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, Download, Phone, Globe, MapPinned, ExternalLink, CheckCircle2, History, Star, MessageSquare, Map, LayoutList, ChevronLeft, ChevronRight, Activity, Handshake, ThumbsDown, Megaphone, Target, Wand2, X, Send, Brain, Save, AlignLeft } from 'lucide-react';
import { supabase } from './lib/supabase';

const STATUS_CONFIG = {
  'Novo': { label: 'Novo', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: Target },
  'Contactado': { label: 'Contactado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: MessageSquare },
  'Em Negociação': { label: 'Em Negociação', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Activity },
  'Ganho': { label: 'Fechado / Ganho', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Handshake },
  'Perdido': { label: 'Perdido', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: ThumbsDown },
};

const LeadCard = ({ lead, activeTab, updateLeadStatus, openMessageModal }) => {
  const [notesText, setNotesText] = useState(lead.observacoes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const statusInfo = STATUS_CONFIG[lead.status || 'Novo'];
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

  return (
    <div className="card p-5 hover:border-slate-500 transition-all group flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row gap-5 items-start xl:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{lead.nome_empresa}</h3>
            {lead.website && lead.telefone && (
              <span title="Lead Alto Potencial" className="flex items-center bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Alto
              </span>
            )}
            
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {lead.rating ? (
              <div className="flex items-center gap-1 text-sm font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {lead.rating}
              </div>
            ) : (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Sem avaliações</span>
            )}
            
            <div className="flex items-start gap-1.5 text-sm text-slate-400">
              <MapPinned className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1 max-w-md">{lead.endereco || 'Endereço não disponível'}</span>
            </div>

            {lead.telefone && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                <Phone className="w-3.5 h-3.5" />
                {lead.telefone}
              </div>
            )}
            
            {lead.keyword_buscada && activeTab !== 'search' && (
              <div className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50 ml-auto capitalize flex items-center gap-1">
                 <Search className="w-3 h-3" /> {lead.keyword_buscada} em {lead.location_buscada}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full xl:w-auto min-w-[280px] bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status (Funil)</span>
            <select 
              className="bg-slate-800 border border-slate-600 text-xs text-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
              value={lead.status || 'Novo'}
              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
            >
              {Object.keys(STATUS_CONFIG).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-1">
              <button 
                onClick={() => openMessageModal(lead)}
                disabled={!lead.telefone}
                className={`text-xs px-3 py-2 rounded transition-colors font-medium flex items-center justify-center gap-1.5 border ${
                  lead.telefone 
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </button>

              <a 
                href={getGoogleMapsLink(lead)} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded transition-colors font-medium flex items-center justify-center gap-1.5 border border-blue-500/20"
              >
                <Map className="w-3.5 h-3.5" />
                Maps
              </a>
          </div>

          <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Globe className={`w-4 h-4 ${lead.website ? 'text-primary' : 'text-slate-600'}`} />
              <span className={lead.website ? 'font-medium text-white line-clamp-1 max-w-[150px]' : 'text-slate-500 italic'}>
                {lead.website ? lead.website.replace(/^https?:\/\/(www\.)?/, '') : 'Sem website'}
              </span>
            </div>
            {lead.website && (
              <a 
                href={lead.website} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Abrir site"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Área de Observações do CRM */}
      <div className="pt-3 border-t border-slate-700/50 mt-1">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <AlignLeft className="w-3.5 h-3.5" /> Observações do CRM
          </label>
          <button 
            onClick={handleSaveNotes}
            disabled={isSaving}
            className={`text-xs px-2.5 py-1 rounded transition-colors font-medium flex items-center gap-1.5 border ${
              saveSuccess 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
            }`}
          >
            {isSaving ? (
              <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveSuccess ? 'Salvo' : 'Salvar'}
          </button>
        </div>
        <textarea 
          className="input-field w-full min-h-[60px] text-sm resize-y bg-slate-900/50 border-slate-700"
          placeholder="Ex: Cliente pediu para retornar sexta-feira..."
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
        />
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

  // Modal State
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState(null);
  const [modalMessageText, setModalMessageText] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // RAG / Knowledge Base State
  const [aiKnowledgeBase, setAiKnowledgeBase] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved'
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Carregar do Banco de Dados
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

  // Salvar no Banco de Dados (com Debounce de 1 segundo)
  useEffect(() => {
    if (isInitialLoad) return;
    
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await supabase.from('settings').update({ knowledge_base: aiKnowledgeBase }).eq('id', 1);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000); // Esconde o aviso depois de 3s
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

  const loadSavedLeads = useCallback(async (page = 0) => {
    setLoadingHistory(true);
    try {
      let query = supabase.from('leads').select('*', { count: 'exact' });
      
      if (activeTab === 'history') {
        query = query.eq('status', 'Novo');
      } else if (activeTab === 'crm') {
        query = query.neq('status', 'Novo');
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
  }, [debouncedHistorySearch, websiteFilter, filterPhone, filterHighPotential, minRating, activeTab]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'crm') {
      loadSavedLeads(historyPage);
    }
  }, [activeTab, historyPage, loadSavedLeads]);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'crm') {
      setHistoryPage(0);
    }
  }, [debouncedHistorySearch, websiteFilter, filterPhone, filterHighPotential, minRating, activeTab]);

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
    
    try {
      const { data, error } = await supabase.functions.invoke('search-leads', {
        body: { keyword: forceKeyword, location: forceLocation }
      });
      if (error) throw error;
      if (data && data.leads) {
        setLeads(data.leads);
        loadRecentSearches();
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

  // Funções do Modal
  const openMessageModal = (lead) => {
    setSelectedLeadForMessage(lead);
    setModalMessageText(`Olá ${lead.nome_empresa}! Vi o perfil de vocês no Google Maps e gostaria de apresentar uma oportunidade para aumentarem o faturamento.`);
  };

  const closeMessageModal = () => {
    setSelectedLeadForMessage(null);
    setModalMessageText('');
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

  const handleSendWhatsApp = () => {
    if (!selectedLeadForMessage || !selectedLeadForMessage.telefone) return;
    const cleanPhone = selectedLeadForMessage.telefone.replace(/\D/g, '');
    
    // Automação: Mover para CRM
    if (selectedLeadForMessage.status === 'Novo' || !selectedLeadForMessage.status) {
      updateLeadStatus(selectedLeadForMessage.id, 'Contactado');
    }
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(modalMessageText)}`, '_blank');
    closeMessageModal();
  };

  return (
    <div className="min-h-screen bg-background pb-12 relative">
      {/* Header */}
      <header className="border-b border-slate-800 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VitrineSearch
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'search' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              Nova Busca
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Leads Brutos
            </button>
            <button 
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'crm' ? 'bg-slate-700 text-white shadow border-b-2 border-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              Monitoramento (CRM)
            </button>
            <button 
              onClick={() => setActiveTab('training')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'training' ? 'bg-slate-700 text-white shadow border-b-2 border-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              Treinamento IA
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {activeTab === 'training' ? (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Brain className="w-6 h-6 text-indigo-400" />
                Treinamento da IA (Base de Conhecimento)
              </h1>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                Cole aqui tudo o que a IA precisa saber sobre a sua empresa para vender melhor. 
                <br/>Inclua seus diferenciais, os serviços que você presta, os preços, e scripts que você sabe que funcionam. A IA vai ler isso toda vez que for criar uma mensagem para um lead.
              </p>
            </div>
            
            <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm p-6 relative">
              {saveStatus === 'saving' && (
                <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div> Salvando...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 fade-in duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Salvo na nuvem
                </div>
              )}
              <label className="block text-sm font-semibold text-slate-300 mb-3">O "Cérebro" da sua IA de Vendas</label>
              <textarea 
                className="input-field w-full min-h-[400px] text-base leading-relaxed resize-y bg-slate-900 border-slate-700 shadow-inner p-4 font-mono text-sm text-slate-300"
                value={aiKnowledgeBase}
                onChange={(e) => setAiKnowledgeBase(e.target.value)}
                placeholder="Exemplo:&#10;&#10;NOME DA EMPRESA: Agência XYZ&#10;O QUE VENDEMOS: Criação de sites institucionais e gestão de tráfego.&#10;PREÇO: Sites a partir de R$ 997,00.&#10;DIFERENCIAL: Entregamos em 7 dias e damos 1 mês de hospedagem grátis.&#10;TOM DE VOZ: Amigável, direto ao ponto.&#10;COMO ABORDAR: Nunca fale o preço de cara. Primeiro, elogie o negócio do cliente, diga que percebeu que eles não têm site ou têm um site antigo, e ofereça uma consultoria rápida de 10 minutos."
              />
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar / Form */}
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
          <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
              <Filter className="w-5 h-5 text-primary" />
              Critérios de Captação
            </h2>
            
            <form className="space-y-5" onSubmit={handleSearch}>
              
              <div className={activeTab !== 'search' ? 'hidden lg:block' : 'block'}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nicho / Palavra-chave</label>
                  <input 
                    type="text" 
                    placeholder="ex: Clínica de Estética" 
                    className="input-field"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Localização Alvo</label>
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

              <div className="pt-2 lg:border-t lg:border-slate-700/50 space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Filtros (Aplicam em todas as telas)
                </span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-300">Presença Digital (Site)</label>
                  <select 
                    className="input-field text-sm bg-slate-800 border-slate-600 focus:ring-1 focus:ring-primary cursor-pointer"
                    value={websiteFilter}
                    onChange={(e) => setWebsiteFilter(e.target.value)}
                  >
                    <option value="any">Qualquer (Com ou Sem Site)</option>
                    <option value="has_website">Exigir Website Ativo</option>
                    <option value="no_website">Sem Website (Oportunidade)</option>
                    <option value="instagram">Apenas Instagram</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
                    checked={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.checked)}
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Exigir Telefone</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                    checked={filterHighPotential}
                    onChange={(e) => setFilterHighPotential(e.target.checked)}
                  />
                  <span className="text-sm text-emerald-400 font-medium group-hover:text-emerald-300 transition-colors">Apenas Alto Potencial</span>
                </label>

                <div className="pt-2">
                  <label className="block text-sm text-slate-300 mb-2">Nota Mínima (Google): {minRating > 0 ? `${minRating}+ Estrelas` : 'Qualquer'}</label>
                  <input 
                    type="range" 
                    min="0" max="5" step="0.5" 
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

              {activeTab === 'search' && (
                <div className="pt-4">
                  <button type="submit" className="btn-primary w-full shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Iniciar Varredura
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {activeTab === 'search' && (
            <div className="card border-slate-700/60 bg-surface/80 backdrop-blur-sm">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-300">
                <LayoutList className="w-4 h-4 text-slate-400" />
                Consultas Salvas (Atalhos)
              </h2>
              
              {recentSearches.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-700/50 rounded-lg bg-slate-800/20">
                  Nenhuma busca salva.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSearches.map((item, i) => (
                    <button 
                      key={item.id || i}
                      onClick={() => handleSearch(null, item.keyword, item.location)}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-600 text-sm"
                    >
                      <div className="font-medium text-white line-clamp-1 capitalize">{item.keyword}</div>
                      <div className="text-slate-400 text-xs mt-1 flex items-center gap-1 capitalize">
                        <MapPin className="w-3 h-3" /> {item.location}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Results Area */}
        <div className="flex-1 flex flex-col h-full min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                {activeTab === 'search' && 'Resultados da Varredura'}
                {activeTab === 'history' && 'Leads Brutos Recentes'}
                {activeTab === 'crm' && 'Monitoramento (CRM)'}
                
                {(activeTab === 'history' || activeTab === 'crm') && loadingHistory && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {totalLeadsDisplayedCount} leads em foco
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {(activeTab === 'history' || activeTab === 'crm') && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    className="input-field pl-9 py-2 text-sm bg-slate-900 border-slate-700 shadow-inner"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
              )}

              {displayedLeads.length > 0 && (
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2 shadow-sm whitespace-nowrap">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}
            </div>
          </div>
          
          {(activeTab === 'search' && leads.length === 0 && !loading) ? (
            <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-5 border border-slate-700/50 shadow-inner">
                <Search className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-xl font-medium text-slate-300">Nenhum dado na tela</p>
              <p className="text-slate-500 mt-2 text-center max-w-sm">
                Preencha as informações na barra lateral para iniciar a extração.
              </p>
            </div>
          ) : (activeTab === 'history' && savedLeads.length === 0 && !loadingHistory && !debouncedHistorySearch && websiteFilter === 'any' && !filterPhone && minRating === 0) ? (
            <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-5 border border-slate-700/50 shadow-inner">
                <History className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-xl font-medium text-slate-300">Seu histórico está vazio</p>
              <p className="text-slate-500 mt-2 text-center max-w-sm">
                Faça sua primeira varredura para popular a lista de leads brutos.
              </p>
            </div>
          ) : (activeTab === 'crm' && savedLeads.length === 0 && !loadingHistory && !debouncedHistorySearch) ? (
            <div className="card flex-1 flex flex-col items-center justify-center text-slate-500 border-dashed border-2 border-slate-700/50 bg-transparent shadow-none">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-5 border border-slate-700/50 shadow-inner">
                <Activity className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-xl font-medium text-slate-300">Nenhum lead em monitoramento</p>
              <p className="text-slate-500 mt-2 text-center max-w-sm">
                Altere o status de um lead nas outras abas (ou clique no botão do WhatsApp) para movê-lo para o CRM.
              </p>
            </div>
          ) : ((activeTab === 'history' || activeTab === 'crm') && savedLeads.length === 0 && !loadingHistory) ? (
             <div className="p-8 text-center text-slate-400 bg-surface rounded-xl border border-slate-700">
               Nenhum lead encontrado com a sua pesquisa ou filtros atuais.
             </div>
          ) : (
            <div className="flex flex-col flex-1">
              <div className="grid gap-4 flex-1">
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

              {(activeTab === 'history' || activeTab === 'crm') && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                  <span className="text-sm text-slate-400">
                    Página <span className="font-medium text-white">{historyPage + 1}</span> de {totalPages}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                      disabled={historyPage === 0 || loadingHistory}
                      className="p-2 rounded border border-slate-700 bg-surface text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
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
                            className={`w-8 h-8 rounded text-sm font-medium transition-colors border ${
                              historyPage === pageNum
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'border-slate-700 bg-surface text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={historyPage === totalPages - 1 || loadingHistory}
                      className="p-2 rounded border border-slate-700 bg-surface text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
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

      {/* Modal de Mensagem do WhatsApp */}
      {selectedLeadForMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Mensagem para {selectedLeadForMessage.nome_empresa}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                  {selectedLeadForMessage.rating && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {selectedLeadForMessage.rating} Estrelas
                    </span>
                  )}
                  {selectedLeadForMessage.endereco && (
                    <span className="flex items-center gap-1 line-clamp-1 max-w-[300px]">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedLeadForMessage.endereco}
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={closeMessageModal}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-surface">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-300">
                  Sua Mensagem
                </label>
                <button
                  type="button"
                  onClick={generateAIMessage}
                  disabled={generatingAI}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-70"
                >
                  {generatingAI ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {generatingAI ? 'Criando magia...' : 'Gerar Texto com IA'}
                </button>
              </div>
              
              <textarea 
                className="input-field w-full min-h-[160px] text-base leading-relaxed resize-none bg-slate-900 border-slate-700 shadow-inner"
                value={modalMessageText}
                onChange={(e) => setModalMessageText(e.target.value)}
                placeholder="Escreva sua mensagem aqui ou use a IA..."
              />
            </div>
            
            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={closeMessageModal}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSendWhatsApp}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                Enviar no WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
