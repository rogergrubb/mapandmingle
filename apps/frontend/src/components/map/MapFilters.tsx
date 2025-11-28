import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/index';

const PIN_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'food', label: '🍔 Food & Drink' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'outdoors', label: '🌳 Outdoors' },
  { value: 'culture', label: '🎨 Culture' },
  { value: 'nightlife', label: '🌙 Nightlife' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'community', label: '👥 Community' },
  { value: 'other', label: '📍 Other' },
];

const TIME_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: 'week', label: 'This Week' },
];

interface MapFiltersProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onTimeFilterChange: (filter: string) => void;
  onToggleHotspots: (show: boolean) => void;
  showHotspots: boolean;
  currentCategory: string;
  currentTimeFilter: string;
}

export function MapFilters({
  onSearch,
  onCategoryChange,
  onTimeFilterChange,
  onToggleHotspots,
  showHotspots,
  currentCategory,
  currentTimeFilter,
}: MapFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const clearFilters = () => {
    setSearchQuery('');
    onSearch('');
    onCategoryChange('all');
    onTimeFilterChange('all');
  };

  const hasActiveFilters =
    searchQuery || currentCategory !== 'all' || currentTimeFilter !== 'all';

  return (
    <div className="absolute top-4 left-4 right-4 z-10 space-y-2">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-lg p-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search pins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5" />
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </form>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select
                value={currentCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                options={PIN_CATEGORIES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <Select
                value={currentTimeFilter}
                onChange={(e) => onTimeFilterChange(e.target.value)}
                options={TIME_FILTERS}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => onToggleHotspots(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Show Hotspots
              </span>
            </label>

            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
