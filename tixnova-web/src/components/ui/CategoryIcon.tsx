import { Music, Sparkles, Mic, Ticket, Trophy, Image as ImageIcon, GraduationCap, Utensils, Disc } from "lucide-react";

interface CategoryIconProps {
  name?: string;
  icon?: string;
  className?: string;
}

export function CategoryIcon({ name = "", icon = "", className = "w-5 h-5" }: CategoryIconProps) {
  const key = (icon + " " + name).toLowerCase();

  if (key.includes("music") || key.includes("musik") || key.includes("konser")) {
    return <Music className={className} />;
  }
  if (key.includes("sparkles") || key.includes("festival")) {
    return <Sparkles className={className} />;
  }
  if (key.includes("mic") || key.includes("komedi") || key.includes("standup")) {
    return <Mic className={className} />;
  }
  if (key.includes("ticket") || key.includes("teater") || key.includes("drama")) {
    return <Ticket className={className} />;
  }
  if (key.includes("trophy") || key.includes("olahraga") || key.includes("sports")) {
    return <Trophy className={className} />;
  }
  if (key.includes("image") || key.includes("pameran") || key.includes("expo")) {
    return <ImageIcon className={className} />;
  }
  if (key.includes("graduation") || key.includes("seminar") || key.includes("workshop")) {
    return <GraduationCap className={className} />;
  }
  if (key.includes("utensils") || key.includes("food") || key.includes("kuliner")) {
    return <Utensils className={className} />;
  }

  return <Disc className={className} />;
}
