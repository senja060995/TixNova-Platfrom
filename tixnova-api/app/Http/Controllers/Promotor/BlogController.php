<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    /**
     * List blogs for current promotor's tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = Blog::with(['author', 'category', 'translations'])
            ->where('tenant_id', $user->tenant_id)
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->latest();

        $blogs = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $blogs,
        ]);
    }

    /**
     * Store a new blog.
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'banner' => ['nullable', 'url', 'max:500'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'status' => ['required', 'in:draft,published'],
            'is_featured' => ['boolean'],
            'translations' => ['nullable', 'array'],
            'translations.*.locale' => ['nullable', 'string', 'max:5'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.content' => ['nullable', 'string'],
            'translations.*.excerpt' => ['nullable', 'string', 'max:500'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
        ]);

        $translations = $validated['translations'] ?? null;
        unset($validated['translations']);

        $validated['tenant_id'] = $user->tenant_id;
        $validated['user_id'] = $user->id;
        $validated['slug'] = Str::slug($validated['title']).'-'.Str::random(6);

        if ($validated['status'] === 'published' && ! $request->filled('published_at')) {
            $validated['published_at'] = now();
        }

        $blog = Blog::create($validated);

        if ($translations && is_array($translations)) {
            $this->saveBlogTranslations($blog, $translations);
        }

        return response()->json([
            'success' => true,
            'message' => 'Blog berhasil dibuat.',
            'data' => $blog->load(['author', 'category', 'translations']),
        ], 201);
    }

    /**
     * Display the specified blog.
     */
    public function show(Blog $blog): JsonResponse
    {
        $this->authorizeTenant($blog);

        return response()->json([
            'success' => true,
            'data' => $blog->load(['author', 'category', 'tenant', 'translations']),
        ]);
    }

    /**
     * Update the specified blog.
     */
    public function update(Request $request, Blog $blog): JsonResponse
    {
        $this->authorizeTenant($blog);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'banner' => ['nullable', 'url', 'max:500'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'status' => ['sometimes', 'required', 'in:draft,published'],
            'is_featured' => ['boolean'],
            'translations' => ['nullable', 'array'],
            'translations.*.locale' => ['nullable', 'string', 'max:5'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.content' => ['nullable', 'string'],
            'translations.*.excerpt' => ['nullable', 'string', 'max:500'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
        ]);

        $translations = $validated['translations'] ?? null;
        unset($validated['translations']);

        if (isset($validated['title'])) {
            $validated['slug'] = Str::slug($validated['title']).'-'.Str::random(6);
        }

        if (($validated['status'] ?? $blog->status) === 'published' && ! $blog->published_at) {
            $validated['published_at'] = now();
        }

        $blog->update($validated);

        if ($translations && is_array($translations)) {
            $this->saveBlogTranslations($blog, $translations);
        }

        return response()->json([
            'success' => true,
            'message' => 'Blog berhasil diperbarui.',
            'data' => $blog->load(['author', 'category', 'translations']),
        ]);
    }

    private function saveBlogTranslations(Blog $blog, array $translations): void
    {
        foreach ($translations as $locale => $transData) {
            $loc = is_numeric($locale) && isset($transData['locale']) ? $transData['locale'] : $locale;
            if (! empty($loc) && is_array($transData)) {
                $blog->translations()->updateOrCreate(
                    ['locale' => $loc],
                    [
                        'title' => $transData['title'] ?? $blog->title,
                        'content' => $transData['content'] ?? null,
                        'excerpt' => $transData['excerpt'] ?? null,
                        'meta_title' => $transData['meta_title'] ?? null,
                        'meta_description' => $transData['meta_description'] ?? null,
                        'status' => 'published',
                    ]
                );
            }
        }
    }

    /**
     * Remove the specified blog.
     */
    public function destroy(Blog $blog): JsonResponse
    {
        $this->authorizeTenant($blog);

        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog berhasil dihapus.',
        ]);
    }

    /**
     * Publish a draft blog.
     */
    public function publish(Blog $blog): JsonResponse
    {
        $this->authorizeTenant($blog);

        if ($blog->status === 'published') {
            return response()->json([
                'success' => false,
                'message' => 'Blog sudah dipublikasikan.',
            ], 422);
        }

        $blog->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Blog berhasil dipublikasikan.',
            'data' => $blog,
        ]);
    }

    /**
     * Unpublish a published blog.
     */
    public function unpublish(Blog $blog): JsonResponse
    {
        $this->authorizeTenant($blog);

        if ($blog->status === 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Blog sudah dalam mode draft.',
            ], 422);
        }

        $blog->update([
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Blog berhasil di-unpublish (kembali ke draft).',
            'data' => $blog,
        ]);
    }

    /**
     * Upload banner for blog.
     */
    public function uploadBanner(Request $request, Blog $blog): JsonResponse
    {
        $this->authorizeTenant($blog);

        $request->validate([
            'banner' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $path = $request->file('banner')->store('blogs/banners', 'public');

        $blog->update(['banner' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil diupload.',
            'data' => ['banner' => $path],
        ]);
    }

    /**
     * Ensure blog belongs to user's tenant.
     */
    private function authorizeTenant(Blog $blog): void
    {
        if ($blog->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized. Blog tidak milik tenant Anda.');
        }
    }
}
