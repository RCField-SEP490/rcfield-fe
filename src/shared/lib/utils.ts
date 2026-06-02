import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { env } from "./env"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const urlStr = String(url).trim()

  // Prepend clean API base URL to relative uploads paths
  if (urlStr.startsWith("/uploads/") || urlStr.startsWith("uploads/")) {
    const cleanPath = urlStr.startsWith("/") ? urlStr : `/${urlStr}`
    const base = (env.apiUrl || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, "")
    return `${base}${cleanPath}`
  }

  // Prepend clean API base URL if path is relative or /v1/uploads/...
  if (urlStr.startsWith("/api/v1/uploads/") || urlStr.startsWith("api/v1/uploads/")) {
    const cleanPath = urlStr.startsWith("/") ? urlStr.replace("/api/v1", "") : `/${urlStr.replace("api/v1/", "")}`
    const base = (env.apiUrl || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, "")
    return `${base}${cleanPath}`
  }

  // Map mock cdn.rcfield.vn images to high-quality unsplash RC cars
  if (urlStr.includes("cdn.rcfield.vn")) {
    const lower = urlStr.toLowerCase()

    if (lower.includes("overdose") || lower.includes("galm")) {
      return "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("tamiya") || lower.includes("tt-02") || lower.includes("ta08") || lower.includes("tb05")) {
      return "https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("yokomo") || lower.includes("yd-2")) {
      return "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("mst") || lower.includes("rmx")) {
      return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("hpi") || lower.includes("rs4")) {
      return "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("traxxas") || lower.includes("slash") || lower.includes("rustler")) {
      return "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("schumacher") || lower.includes("cat")) {
      return "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("unit-blue")) {
      return "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("unit-red")) {
      return "https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("unit-yellow")) {
      return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop"
    }
    if (lower.includes("unit-black")) {
      return "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600&auto=format&fit=crop"
    }

    return "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=600&auto=format&fit=crop"
  }

  return urlStr
}

export function getCatalogImageUrl(catalog: any): string | null {
  if (!catalog) return null
  let rawUrl: string | null = null
  if (catalog.coverImageUrl) {
    rawUrl = catalog.coverImageUrl
  } else if (catalog.cover_image_url) {
    rawUrl = catalog.cover_image_url
  } else if (Array.isArray(catalog.images) && catalog.images.length > 0) {
    const firstImg = catalog.images[0]
    if (typeof firstImg === "string") {
      rawUrl = firstImg
    } else if (typeof firstImg === "object" && firstImg !== null) {
      rawUrl = firstImg.url || firstImg.cover_image_url || firstImg.coverImageUrl
    }
  }
  return sanitizeImageUrl(rawUrl)
}

