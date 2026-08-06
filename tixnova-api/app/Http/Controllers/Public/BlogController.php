<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    /**
     * Display a listing of published blogs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Blog::with(['author', 'category', 'tenant'])
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->when($request->tenant_id, fn ($q, $id) => $q->where('tenant_id', $id))
            ->when($request->category, fn ($q, $slug) => $q->whereHas('category', fn ($cq) => $cq->where('slug', $slug)))
            ->when($request->search, fn ($q, $s) => $q->where(function ($qq) use ($s) {
                $qq->where('title', 'like', "%{$s}%")
                    ->orWhere('excerpt', 'like', "%{$s}%")
                    ->orWhere('content', 'like', "%{$s}%");
            }))
            ->latest('published_at');

        $blogs = $query->paginate($request->per_page ?? 12);

        return response()->json([
            'success' => true,
            'data' => $blogs,
        ]);
    }

    /**
     * Display the specified blog by slug.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $blog = Blog::with(['author', 'category', 'tenant', 'translations'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->firstOrFail();

        // Increment view count
        $blog->increment('view_count');

        $lang = $request->query('lang', $request->header('X-Locale', 'id'));
        if ($lang && $lang !== 'id') {
            $translation = $blog->translations->firstWhere('locale', $lang);
            if ($translation) {
                $blog->title = $translation->title ?: $blog->title;
                $blog->content = $translation->content ?: $blog->content;
                $blog->excerpt = $translation->excerpt ?: $blog->excerpt;
                $blog->meta_title = $translation->meta_title ?: $blog->meta_title;
                $blog->meta_description = $translation->meta_description ?: $blog->meta_description;
            }
        }

        // Get related blogs
        $related = Blog::with(['author', 'category'])
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('id', '!=', $blog->id)
            ->where('category_id', $blog->category_id)
            ->latest('published_at')
            ->limit(3)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'blog' => $blog,
                'related' => $related,
            ],
        ]);
    }

    /**
     * List all blog categories.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::where('type', 'blog')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon', 'color']);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}
