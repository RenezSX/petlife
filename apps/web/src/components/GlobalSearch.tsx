import {
  BedDouble,
  ClipboardList,
  Clock3,
  History,
  LoaderCircle,
  PawPrint,
  Pill,
  Search,
  UserRound,
  Stethoscope,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { GlobalSearchItem, GlobalSearchResponse } from '../types';

const RECENT_KEY = 'petlife_recent_searches';
const typeIcons = {
  tutor: UserRound,
  animal: PawPrint,
  hospitalization: Clock3,
  bed: BedDouble,
  procedure: ClipboardList,
  medication: Pill,
  professional: Stethoscope,
};

function loadRecentSearches() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<GlobalSearchResponse>({ query: '', total: 0, groups: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>(loadRecentSearches);

  const flatItems = useMemo(
    () => response.groups.flatMap((group) => group.items),
    [response.groups],
  );

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
    setError('');

    if (query.trim().length < 2) {
      setLoading(false);
      setResponse({ query: query.trim(), total: 0, groups: [] });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const result = await api.get<GlobalSearchResponse>('/search', {
          params: { q: query.trim() },
          signal: controller.signal,
        });
        setResponse(result.data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error('Erro na pesquisa global:', requestError);
          setError('Não foi possível realizar a pesquisa.');
          setResponse({ query: query.trim(), total: 0, groups: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function saveRecent(value: string) {
    const normalized = value.trim();
    if (normalized.length < 2) return;
    const next = [normalized, ...recent.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  function choose(item: GlobalSearchItem) {
    saveRecent(query);
    setOpen(false);
    setQuery('');
    navigate(item.href, { state: { globalSearch: item } });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && flatItems.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatItems.length);
    }
    if (event.key === 'ArrowUp' && flatItems.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + flatItems.length) % flatItems.length);
    }
    if (event.key === 'Enter' && flatItems[activeIndex]) {
      event.preventDefault();
      choose(flatItems[activeIndex]);
    }
  }

  let runningIndex = -1;

  return (
    <>
      <button type="button" className="global-search-trigger" onClick={() => setOpen(true)}>
        <Search size={18} />
        <span>Pesquisar em toda a clínica</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div className="global-search-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="global-search-dialog" role="dialog" aria-modal="true" aria-label="Pesquisa global" onMouseDown={(event) => event.stopPropagation()}>
            <div className="global-search-input-row">
              <Search size={22} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Busque tutor, animal, internação, leito, procedimento ou medicação..."
                aria-label="Pesquisar"
              />
              {loading && <LoaderCircle className="search-spinner" size={20} />}
              <button type="button" className="global-search-close" onClick={() => setOpen(false)} aria-label="Fechar pesquisa">
                <X size={19} />
              </button>
            </div>

            <div className="global-search-content">
              {error && <div className="global-search-message error">{error}</div>}

              {!error && query.trim().length < 2 && (
                <div className="recent-searches">
                  <div className="search-section-label"><History size={15} /> Pesquisas recentes</div>
                  {recent.length === 0 ? (
                    <div className="global-search-message">Digite pelo menos 2 caracteres para começar.</div>
                  ) : (
                    recent.map((item) => (
                      <button key={item} type="button" onClick={() => setQuery(item)}>
                        <Clock3 size={16} />
                        <span>{item}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {!loading && !error && query.trim().length >= 2 && response.total === 0 && (
                <div className="global-search-empty">
                  <Search size={36} />
                  <strong>Nenhum resultado encontrado</strong>
                  <span>Tente pesquisar por outro nome, telefone, leito ou medicamento.</span>
                </div>
              )}

              {!error && response.groups.map((group) => (
                <div className="global-search-group" key={group.key}>
                  <div className="search-section-label">{group.label}</div>
                  {group.items.map((item) => {
                    runningIndex += 1;
                    const itemIndex = runningIndex;
                    const Icon = typeIcons[item.type];
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        className={itemIndex === activeIndex ? 'active' : ''}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => choose(item)}
                      >
                        <span className={`global-search-icon type-${item.type}`}><Icon size={18} /></span>
                        <span className="global-search-copy">
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                        </span>
                        {item.meta && <span className="global-search-meta">{item.meta}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <footer className="global-search-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>Enter</kbd> abrir</span>
              <span><kbd>Esc</kbd> fechar</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
