<?php

namespace Tests\Feature;

use App\Jobs\SendEventRescheduleNotification;
use App\Mail\EventRescheduledMail;
use App\Models\Event;
use App\Models\EventReschedule;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EventRescheduleWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_request_and_admin_can_approve_reschedule(): void
    {
        [$promotor, $admin, $event] = $this->context();
        $newStart = now()->addDays(30)->setTime(19, 0);
        $newEnd = now()->addDays(30)->setTime(23, 0);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->id}/reschedules", [
                'new_start_date' => $newStart->toDateTimeString(),
                'new_end_date' => $newEnd->toDateTimeString(),
                'reason' => 'Penyesuaian jadwal venue untuk kenyamanan seluruh penonton.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'requested');

        $reschedule = EventReschedule::firstOrFail();
        Queue::fake();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/super-admin/event-reschedules/{$reschedule->id}/review", ['approved' => true])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'start_date' => $newStart->toDateTimeString(),
            'end_date' => $newEnd->toDateTimeString(),
        ]);
        Queue::assertPushed(SendEventRescheduleNotification::class, fn (SendEventRescheduleNotification $job) => $job->rescheduleId === $reschedule->id);
    }

    public function test_admin_can_reject_reschedule_without_changing_event_dates(): void
    {
        [$promotor, $admin, $event] = $this->context();
        $originalStart = $event->start_date->toDateTimeString();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->id}/reschedules", [
                'new_start_date' => now()->addDays(30)->toDateTimeString(),
                'new_end_date' => now()->addDays(30)->addHours(3)->toDateTimeString(),
                'reason' => 'Perubahan jadwal karena agenda venue yang tidak dapat dihindari.',
            ])
            ->assertCreated();

        $reschedule = EventReschedule::firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/super-admin/event-reschedules/{$reschedule->id}/review", [
                'approved' => false,
                'review_note' => 'Jadwal baru perlu dikonfirmasi kembali dengan venue.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('events', ['id' => $event->id, 'start_date' => $originalStart]);
    }

    public function test_reschedule_notification_is_sent_to_each_paid_buyer_email(): void
    {
        Mail::fake();
        [$promotor, $admin, $event] = $this->context();
        $buyer = User::factory()->create();
        Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $event->tenant_id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'total' => 105000,
            'status' => 'paid',
            'buyer_name' => $buyer->name,
            'buyer_email' => $buyer->email,
            'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);
        $reschedule = EventReschedule::create([
            'event_id' => $event->id,
            'requested_by' => $promotor->id,
            'reviewed_by' => $admin->id,
            'previous_start_date' => $event->start_date,
            'previous_end_date' => $event->end_date,
            'new_start_date' => now()->addDays(30),
            'new_end_date' => now()->addDays(30)->addHours(3),
            'reason' => 'Perubahan jadwal karena penyesuaian operasional venue.',
            'status' => 'approved',
            'reviewed_at' => now(),
        ]);

        (new SendEventRescheduleNotification($reschedule->id))->handle();

        Mail::assertQueued(EventRescheduledMail::class, 1);
    }

    private function context(): array
    {
        Role::findOrCreate('promotor');
        Role::findOrCreate('super_admin');
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        $promotor->assignRole('promotor');
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'title' => 'Event '.$suffix,
            'slug' => 'event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addDays(14),
            'end_date' => now()->addDays(14)->addHours(2),
            'status' => 'approved',
        ]);

        return [$promotor, $admin, $event];
    }
}
