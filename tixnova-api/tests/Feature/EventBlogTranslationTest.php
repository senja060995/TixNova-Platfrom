<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EventBlogTranslationTest extends TestCase
{
    use RefreshDatabase;

    private User $promotor;

    private Tenant $tenant;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'SoundProject Org',
            'email' => 'tenant@soundproject.com',
            'slug' => 'soundproject',
            'status' => 'active',
        ]);

        Role::create(['name' => 'promotor', 'guard_name' => 'web']);

        $this->promotor = User::create([
            'name' => 'Promotor User',
            'email' => 'promotor@test.com',
            'password' => bcrypt('password123'),
            'tenant_id' => $this->tenant->id,
        ]);
        $this->promotor->assignRole('promotor');

        $this->category = Category::create([
            'name' => 'Concert',
            'slug' => 'concert',
            'type' => 'event',
        ]);
    }

    public function test_can_create_event_with_english_translation(): void
    {
        $response = $this->actingAs($this->promotor)->postJson('/api/promotor/events', [
            'title' => 'Konser Musik Jakarta',
            'category_id' => $this->category->id,
            'venue' => 'Gelora Bung Karno',
            'venue_detail' => 'Pintu 5 Utama',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'start_date' => now()->addDays(10)->toIso8601String(),
            'end_date' => now()->addDays(11)->toIso8601String(),
            'description' => 'Konser musik terbesar tahun ini.',
            'short_desc' => 'Konser Musik',
            'translations' => [
                'en' => [
                    'title' => 'Jakarta Music Concert',
                    'description' => 'The biggest music concert of the year.',
                    'short_desc' => 'Music Concert',
                    'venue_detail' => 'Main Gate 5',
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $eventId = $response->json('data.id');

        $this->assertDatabaseHas('event_content_translations', [
            'event_id' => $eventId,
            'locale' => 'en',
            'title' => 'Jakarta Music Concert',
        ]);
    }

    public function test_public_event_detail_returns_translated_content_when_lang_is_en(): void
    {
        $event = Event::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->promotor->id,
            'category_id' => $this->category->id,
            'title' => 'Konser Musik Bandung',
            'slug' => 'konser-musik-bandung',
            'description' => 'Konser di Bandung.',
            'venue' => 'Sabuga',
            'city' => 'Bandung',
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(6),
            'status' => 'approved',
        ]);

        $event->translations()->create([
            'locale' => 'en',
            'title' => 'Bandung Music Concert',
            'description' => 'Concert in Bandung.',
            'status' => 'published',
        ]);

        // Request with lang=en
        $response = $this->getJson('/api/events/konser-musik-bandung?lang=en');

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Bandung Music Concert')
            ->assertJsonPath('data.description', 'Concert in Bandung.');
    }

    public function test_can_create_blog_with_english_translation(): void
    {
        $blogCategory = Category::create([
            'name' => 'News',
            'slug' => 'news',
            'type' => 'blog',
        ]);

        $response = $this->actingAs($this->promotor)->postJson('/api/promotor/blogs', [
            'title' => 'Tips Membeli Tiket Konser',
            'content' => '<p>Panduan lengkap membeli tiket secara cepat.</p>',
            'excerpt' => 'Tips war tiket.',
            'category_id' => $blogCategory->id,
            'status' => 'published',
            'translations' => [
                'en' => [
                    'title' => 'Tips for Buying Concert Tickets',
                    'content' => '<p>Complete guide to buying tickets fast.</p>',
                    'excerpt' => 'Ticket war tips.',
                ],
            ],
        ]);

        $response->assertStatus(201);

        $blogId = $response->json('data.id');

        $this->assertDatabaseHas('blog_content_translations', [
            'blog_id' => $blogId,
            'locale' => 'en',
            'title' => 'Tips for Buying Concert Tickets',
        ]);
    }
}
