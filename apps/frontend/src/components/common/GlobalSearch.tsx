import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Calendar, Users, Hash } from 'lucide-react';
import { Input } from './Input';
import api from '../../lib/api';

interface SearchResult {
  type: 'pin' | 'event' | 'user' | 'forum';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

interface GlobalSearchProps {
  onResultClick: (result: SearchResult) => void;
}

export function GlobalSearch({ onResultClick }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const data: any = await api.get('/api/search', {
          params: { q: query },
        });
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'pin':
        return <MapPin className="w-5 h-5 text-pink-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'user':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'forum':
        return <Hash className="w-5 h-5 text-purple-600" />;
      default:
        return <Search className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search pins, events, people..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getIcon(result.type)}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-gray-500">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
