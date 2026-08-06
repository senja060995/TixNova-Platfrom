"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, Calendar, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight, X, Sparkles, RefreshCw } from "lucide-react";
import { EventCard } from "@/components/event/EventCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Event, Category } from "@/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { publicApi } from "@/lib/api";
import { useLocale } from "@/components/LocaleProvider";

const CITIES = ["Jakarta", "Bandung", "Surabaya", "Medan", "Semarang", "Makassar", "Bali"];

function BrowseEventsContent() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Filter States
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "upcoming");
  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch categories
  useEffect(() => {
    publicApi.events.categories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: 12,
        sort,
        lang: locale,
      };

      if (search) params.search = search;
      if (selectedCity) params.city = selectedCity;
      if (selectedCategory) params.category = selectedCategory;
      if (priceMin) params.price_min = priceMin;
      if (priceMax) params.price_max = priceMax;
      if (dateFrom) params.date_from = dateFrom;

      const res = await publicApi.events.list(params);
      const paginated = res.data.data;
      setEvents(paginated.data || []);
      setTotalPages(paginated.last_page || 1);
      setTotalItems(paginated.total || 0);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedCity, selectedCategory, sort, priceMin, priceMax, dateFrom, locale]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCity("");
    setSelectedCategory("");
    setSort("upcoming");
    setPriceMin("");
    setPriceMax("");
    setDateFrom("");
    setCurrentPage(1);
    router.push("/events");
  };

  const activeFilterCount = [search, selectedCity, selectedCategory, priceMin, priceMax, dateFrom]
    .filter(Boolean).length;
  const sortOptions = [
    { label: t("events.sortUpcoming"), value: "upcoming" },
    { label: t("events.sortDate"), value: "date_asc" },
    { label: t("events.sortPriceLow"), value: "price_asc" },
    { label: t("events.sortPriceHigh"), value: "price_desc" },
    { label: t("events.sortPopular"), value: "popular" },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{t("events.explore")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            {t("events.title")}
          </h1>
          <p className="mt-2 text-text-secondary">
            {t("events.description")}
          </p>
        </div>

        {/* Search Bar & Mobile Filter Trigger */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              type="text"
              placeholder={t("events.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-24 py-3.5 bg-bg-surface border-bg-border text-white text-base rounded-xl focus:ring-2 focus:ring-primary w-full"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-dark text-white rounded-lg px-4"
            >
              {t("hero.search")}
            </Button>
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3.5 bg-bg-surface border border-bg-border text-text-primary rounded-xl focus:outline-none focus:border-primary text-sm font-medium w-full md:w-auto"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Mobile Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowMobileFilter(true)}
              className="md:hidden flex items-center gap-2 py-3.5 border-bg-border relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => {
                setSelectedCategory("");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === ""
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-bg-surface text-text-secondary border border-bg-border hover:border-primary/50"
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug === selectedCategory ? "" : cat.slug);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat.slug
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-bg-surface text-text-secondary border border-bg-border hover:border-primary/50"
                }`}
              >
                <CategoryIcon name={cat.name} icon={cat.icon} className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden lg:block space-y-6 bg-bg-surface p-6 rounded-2xl border border-bg-border h-fit sticky top-24">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center gap-2 font-bold text-white text-lg">
                <Filter className="w-5 h-5 text-primary" />
<span>{t("events.filter")}</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Kota
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedCity("");
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCity === ""
                      ? "bg-primary/20 text-primary font-semibold"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-white"
                  }`}
                >
                  Semua Kota
                </button>
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city === selectedCity ? "" : city);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCity === city
                        ? "bg-primary/20 text-primary font-semibold"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-white"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div className="border-t border-bg-border pt-4">
              <label className="block text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Mulai Dari Tanggal
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-bg-elevated border-bg-border text-white text-sm"
              />
            </div>

            {/* Price Filter */}
            <div className="border-t border-bg-border pt-4">
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Rentang Harga (Rp)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white text-xs"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="bg-bg-elevated border-bg-border text-white text-xs"
                />
              </div>
            </div>
          </aside>

          {/* Event Cards Grid */}
          <div className="lg:col-span-3">
            {/* Active filter badges */}
            {activeFilterCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-muted">Filter Aktif:</span>
                {selectedCity && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">
                    Kota: {selectedCity}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCity("")} />
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">
                    Kategori: {selectedCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("")} />
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">
                    Cari: {search}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
                  </span>
                )}
                <button onClick={resetFilters} className="text-xs text-text-muted underline hover:text-white ml-2">
                  Hapus Semua
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="mb-6 flex items-center justify-between text-sm text-text-secondary">
              <span>Menampilkan <strong className="text-white">{totalItems}</strong> event</span>
            </div>

            {/* Loading Grid Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-bg-surface border border-bg-border rounded-2xl p-4 animate-pulse space-y-4">
                    <div className="w-full h-48 bg-bg-elevated rounded-xl" />
                    <div className="h-4 bg-bg-elevated rounded w-3/4" />
                    <div className="h-4 bg-bg-elevated rounded w-1/2" />
                    <div className="h-8 bg-bg-elevated rounded w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-bg-surface border border-bg-border rounded-2xl p-12 text-center my-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Event Tidak Ditemukan</h3>
                <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
                  Tidak ada event yang cocok dengan kriteria pencarianmu. Coba ubah kata kunci atau reset filter.
                </p>
                <Button onClick={resetFilters} className="bg-primary hover:bg-primary-dark">
                  Reset Semua Filter
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="border-bg-border disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg font-medium text-sm transition-all ${
                      currentPage === page
                        ? "bg-primary text-white font-bold shadow-lg shadow-primary/30"
                        : "bg-bg-surface text-text-secondary border border-bg-border hover:bg-bg-elevated hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="border-bg-border disabled:opacity-30"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilter && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-bg-surface w-full max-w-xs h-full p-6 space-y-6 overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <h3 className="font-bold text-lg text-white">Filter Event</h3>
              <button onClick={() => setShowMobileFilter(false)}>
                <X className="w-6 h-6 text-text-muted" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Kota</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-3 bg-bg-elevated border border-bg-border rounded-xl text-white text-sm"
              >
                <option value="">Semua Kota</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="pt-4 border-t border-bg-border">
              <Button
                onClick={() => {
                  setShowMobileFilter(false);
                  fetchEvents();
                }}
                className="w-full bg-primary hover:bg-primary-dark"
              >
                Terapkan Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrowseEventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base py-12 px-4 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-bg-elevated rounded w-1/3" />
        <div className="h-12 bg-bg-elevated rounded w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-bg-elevated rounded-2xl" />
          ))}
        </div>
      </div>
    }>
      <BrowseEventsContent />
    </Suspense>
  );
}
