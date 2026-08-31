import React, { useState } from 'react';
import { Search, MapPin, Filter, Download, Phone, Globe, MapPinned } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword || !location) {
      alert("Preencha a palavra-chave e a localização!");
      return;
    }

    setLoading(true);
    
    try {
      // Chama a Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('search-leads', {
        body: { keyword, location }
      });

      if (error) throw error;
      
      if (data && data.leads) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Ocorreu um erro ao buscar os leads. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-slate-800 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VitrineSearch
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">Usuário Conectado</div>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar / Form */}
        <aside className="w-full md:w-80 flex-shrink-0">
          <div className="card sticky top-24">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Nova Busca
            </h2>
            
            <form className="space-y-4" onSubmit={handleSearch}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Palavra-chave</label>
                <input 
                  type="text" 
                  placeholder="ex: Clínica de Estética" 
                  className="input-field"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Localização</label>
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

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Buscar Leads
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex-1">
          <div className="card h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Resultados ({leads.length})</h2>
              {leads.length > 0 && (
                <button className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              )}
            </div>
            
            {leads.length === 0 && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-lg font-medium text-slate-400">Nenhum lead encontrado ainda</p>
                <p className="text-sm text-slate-500 mt-1 text-center max-w-sm">
                  Preencha os filtros ao lado e clique em buscar para iniciar a captação na web e no Google Maps.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {leads.map((lead, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <h3 className="font-semibold text-lg text-white mb-2">{lead.nome_empresa}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-400">
                      {lead.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{lead.telefone}</span>
                        </div>
                      )}
                      
                      {lead.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-secondary" />
                          <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-white truncate">
                            {lead.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}

                      {lead.endereco && (
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <MapPinned className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{lead.endereco}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
