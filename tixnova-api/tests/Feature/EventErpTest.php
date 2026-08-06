<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EventErpTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_manage_budget_items(): void
    {
        [$tenant, $event, $promotor] = $this->context();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/erp/budget-items", [
                'category' => 'production',
                'label' => 'Sound System',
                'planned_amount' => 50000000,
                'actual_amount' => 45000000,
            ])
            ->assertCreated()
            ->assertJsonPath('data.label', 'Sound System');

        $itemId = $event->budgetItems()->first()->id;

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/erp/budget-items/{$itemId}", [
                'actual_amount' => 48000000,
            ])
            ->assertOk()
            ->assertJsonPath('data.actual_amount', '48000000.00');

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/erp/budget-items")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_promotor_can_manage_timeline_and_toggle_done(): void
    {
        [$tenant, $event, $promotor] = $this->context();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/erp/timeline", [
                'title' => 'Tiket rilis',
                'due_at' => now()->addDays(3)->toDateString(),
            ])
            ->assertCreated();

        $itemId = $event->timelineItems()->first()->id;

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/erp/timeline/{$itemId}/toggle")
            ->assertOk()
            ->assertJsonPath('data.status', 'done');

        $this->assertDatabaseHas('event_timeline_items', ['id' => $itemId, 'status' => 'done']);
    }

    public function test_promotor_can_manage_checklists(): void
    {
        [$tenant, $event, $promotor] = $this->context();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/erp/checklists", [
                'title' => 'Cek soundcheck',
                'phase' => 'event_day',
            ])
            ->assertCreated();

        $itemId = $event->checklistItems()->first()->id;

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/erp/checklists/{$itemId}/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_done', true);

        $this->assertDatabaseHas('event_checklist_items', ['id' => $itemId, 'is_done' => true]);
    }

    public function test_erp_overview_reports_budget_variance_and_progress(): void
    {
        [$tenant, $event, $promotor] = $this->context();

        $event->budgetItems()->create([
            'tenant_id' => $tenant->id,
            'category' => 'production',
            'label' => 'Panggung',
            'planned_amount' => 10000000,
            'actual_amount' => 8000000,
        ]);
        $event->budgetItems()->create([
            'tenant_id' => $tenant->id,
            'category' => 'marketing',
            'label' => 'Promo',
            'planned_amount' => 5000000,
            'actual_amount' => 6000000,
        ]);
        $event->checklistItems()->create(['tenant_id' => $tenant->id, 'title' => 'A', 'phase' => 'pre_event', 'is_done' => true]);
        $event->checklistItems()->create(['tenant_id' => $tenant->id, 'title' => 'B', 'phase' => 'pre_event']);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/erp/overview")
            ->assertOk()
            ->assertJsonPath('data.budget.planned_total', 15000000)
            ->assertJsonPath('data.budget.actual_total', 14000000)
            ->assertJsonPath('data.budget.over_budget', false)
            ->assertJsonPath('data.checklist.total', 2)
            ->assertJsonPath('data.checklist.done', 1);
    }

    public function test_other_tenant_cannot_access_event_erp(): void
    {
        [$tenant, $event, $promotor] = $this->context();

        Role::findOrCreate('promotor');
        $other = User::factory()->create(['tenant_id' => Tenant::create([
            'name' => 'Other',
            'slug' => 'other-'.str()->lower(str()->random(6)),
            'email' => str()->random(6).'@example.test',
            'status' => 'active',
        ])->id]);
        $other->assignRole('promotor');

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/erp/overview")
            ->assertNotFound();
    }

    private function context(): array
    {
        $suffix = str()->lower(str()->random(8));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'title' => 'Event '.$suffix,
            'slug' => 'event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        return [$tenant, $event, $promotor];
    }
}
