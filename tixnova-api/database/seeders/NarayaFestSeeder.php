<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Event;
use App\Models\Seat;
use App\Models\SeatMap;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NarayaFestSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'sound-project')->first();
        $promotor = User::where('email', 'promotor@soundproject.id')->first();
        $category = Category::where('slug', 'musik-konser')->first();

        if (! $tenant || ! $promotor || ! $category) {
            $this->command->error('Run RoleSeeder, CategorySeeder, and SuperAdminSeeder first.');

            return;
        }

        DB::transaction(function () use ($tenant, $promotor, $category) {
            $event = Event::withoutGlobalScopes()->updateOrCreate(
                ['slug' => 'naraya-fest-gor-slawi'],
                [
                    'tenant_id' => $tenant->id,
                    'user_id' => $promotor->id,
                    'category_id' => $category->id,
                    'title' => 'Naraya Fest 2026',
                    'venue' => 'GOR Trisanja Slawi',
                    'venue_detail' => 'Jl. Prof. Moh. Yamin, Procot, Slawi, Kabupaten Tegal',
                    'city' => 'Slawi',
                    'province' => 'Jawa Tengah',
                    'latitude' => -6.985384,
                    'longitude' => 109.141684,
                    'start_date' => now()->addDays(45)->setTime(15, 0),
                    'end_date' => now()->addDays(45)->setTime(23, 30),
                    'banner' => 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200',
                    'short_desc' => 'Festival musik satu malam di GOR Trisanja Slawi bersama musisi favoritmu.',
                    'description' => "Naraya Fest hadir di GOR Trisanja Slawi dengan pertunjukan musik, tenant kuliner, dan pengalaman festival yang meriah.\n\nPilih tiket seated untuk area tribun atau tiket festival untuk area berdiri.",
                    'status' => 'approved',
                    'is_featured' => true,
                    'is_free' => false,
                    'min_age' => 12,
                    'tags' => ['musik', 'festival', 'slawi', 'tegal'],
                    'approved_at' => now(),
                    'approved_by' => 1,
                ]
            );

            $tickets = [
                [
                    'name' => 'Tribun Gold',
                    'type' => 'vip',
                    'description' => 'Kursi tribun bagian depan dengan akses masuk prioritas.',
                    'price' => 275000,
                    'quota' => 120,
                    'min_purchase' => 1,
                    'max_purchase' => 4,
                    'includes' => ['Seated tribun', 'Akses masuk prioritas'],
                    'sort_order' => 1,
                ],
                [
                    'name' => 'Tribun Silver',
                    'type' => 'regular',
                    'description' => 'Kursi tribun dengan pandangan penuh ke panggung.',
                    'price' => 175000,
                    'quota' => 180,
                    'min_purchase' => 1,
                    'max_purchase' => 4,
                    'includes' => ['Seated tribun'],
                    'sort_order' => 2,
                ],
                [
                    'name' => 'Festival',
                    'type' => 'regular',
                    'description' => 'Area berdiri festival di lapangan utama.',
                    'price' => 100000,
                    'quota' => 1000,
                    'min_purchase' => 1,
                    'max_purchase' => 6,
                    'includes' => ['Area festival berdiri'],
                    'sort_order' => 3,
                ],
            ];

            foreach ($tickets as $ticketData) {
                Ticket::updateOrCreate(
                    ['event_id' => $event->id, 'name' => $ticketData['name']],
                    array_merge($ticketData, [
                        'event_id' => $event->id,
                        'sold' => 0,
                        'reserved' => 0,
                        'sale_start' => now(),
                        'sale_end' => $event->start_date->copy()->subDay(),
                        'is_active' => true,
                    ])
                );
            }

            $gold = $event->tickets()->where('name', 'Tribun Gold')->firstOrFail();
            $silver = $event->tickets()->where('name', 'Tribun Silver')->firstOrFail();
            $seatMap = SeatMap::updateOrCreate(
                ['event_id' => $event->id],
                ['name' => 'GOR Trisanja Slawi', 'is_published' => true, 'locked_at' => null]
            );

            if (! $seatMap->locked_at) {
                $seatMap->seats()->delete();

                $sections = [
                    ['name' => 'Gold Barat', 'ticket_id' => $gold->id, 'rows' => ['A' => 20, 'B' => 20, 'C' => 20]],
                    ['name' => 'Gold Timur', 'ticket_id' => $gold->id, 'rows' => ['A' => 20, 'B' => 20, 'C' => 20]],
                    ['name' => 'Silver Utara', 'ticket_id' => $silver->id, 'rows' => ['D' => 30, 'E' => 30, 'F' => 30]],
                    ['name' => 'Silver Selatan', 'ticket_id' => $silver->id, 'rows' => ['D' => 30, 'E' => 30, 'F' => 30]],
                ];

                foreach ($sections as $section) {
                    foreach ($section['rows'] as $rowLabel => $seatCount) {
                        for ($number = 1; $number <= $seatCount; $number++) {
                            Seat::create([
                                'seat_map_id' => $seatMap->id,
                                'ticket_id' => $section['ticket_id'],
                                'section' => $section['name'],
                                'row_label' => $rowLabel,
                                'number' => $number,
                                'label' => "{$section['name']}-{$rowLabel}{$number}",
                                'status' => 'available',
                            ]);
                        }
                    }
                }
            }
        });

        $this->command->info('Naraya Fest 2026 at GOR Trisanja Slawi seeded with 300 seat-map seats.');
    }
}
