import { Hero } from "@/components/event/Hero";
import { FeaturedEvents } from "@/components/event/FeaturedEvents";
import { BrowseByCity } from "@/components/event/BrowseByCity";
import { UpcomingEvents } from "@/components/event/UpcomingEvents";
import { BlogHighlight } from "@/components/blog/BlogHighlight";

async function getFeaturedEvents() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/events/featured?limit=8`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function getUpcomingEvents() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/events?sort=date_asc&per_page=6`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data?.data ?? data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function getBlogs() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/blogs?per_page=3`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data?.data ?? data?.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredEvents, upcomingEvents, blogs] = await Promise.all([
    getFeaturedEvents(),
    getUpcomingEvents(),
    getBlogs(),
  ]);

  return (
    <div className="space-y-12 pb-12">
      <Hero />
      <FeaturedEvents
        events={featuredEvents}
        showViewAll={true}
        viewAllHref="/events?featured=true"
      />
      <BrowseByCity />
      <UpcomingEvents events={upcomingEvents} />
      <BlogHighlight blogs={blogs} />
    </div>
  );
}