<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Event;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SampleEventSeeder extends Seeder
{
    public function run(): void
    {
        $tenant   = Tenant::where('slug', 'sound-project')->first();
        $promotor = User::where('email', 'promotor@soundproject.id')->first();

        if (! $tenant || ! $promotor) {
            $this->command->error('Run SuperAdminSeeder first!');
            return;
        }

        $musicCat   = Category::where('slug', 'musik-konser')->first();
        $festCat    = Category::where('slug', 'festival')->first();
        $theaterCat = Category::where('slug', 'teater-drama')->first();

        $events = [
            [
                'title'       => 'Coldplay World Tour — Jakarta',
                'city'        => 'Jakarta',
                'venue'       => 'Stadion Gelora Bung Karno',
                'start_date'  => Carbon::now()->addDays(30),
                'end_date'    => Carbon::now()->addDays(30)->addHours(4),
                'is_featured' => true,
                'category_id' => $musicCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200',
                'tickets'     => [
                    ['name' => 'Festival A', 'type' => 'regular', 'price' => 1500000, 'quota' => 5000],
                    ['name' => 'Festival B', 'type' => 'regular', 'price' => 850000,  'quota' => 8000],
                    ['name' => 'VIP',        'type' => 'vip',     'price' => 3500000, 'quota' => 500],
                    ['name' => 'VVIP',       'type' => 'vip',     'price' => 7500000, 'quota' => 100],
                ],
            ],
            [
                'title'       => 'Java Jazz Festival 2026',
                'city'        => 'Jakarta',
                'venue'       => 'Jakarta Convention Center',
                'start_date'  => Carbon::now()->addDays(45),
                'end_date'    => Carbon::now()->addDays(47),
                'is_featured' => true,
                'category_id' => $musicCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
                'tickets'     => [
                    ['name' => '1 Day Pass',  'type' => 'regular', 'price' => 350000,  'quota' => 3000],
                    ['name' => '3 Day Pass',  'type' => 'regular', 'price' => 850000,  'quota' => 2000],
                    ['name' => 'VIP 3 Day',   'type' => 'vip',     'price' => 2500000, 'quota' => 200],
                ],
            ],
            [
                'title'       => 'Synchronize Festival 2026',
                'city'        => 'Jakarta',
                'venue'       => 'Gambir Expo, JIEXPO',
                'start_date'  => Carbon::now()->addDays(60),
                'end_date'    => Carbon::now()->addDays(62),
                'is_featured' => true,
                'category_id' => $festCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
                'tickets'     => [
                    ['name' => 'Early Bird',   'type' => 'early_bird', 'price' => 250000, 'quota' => 1000],
                    ['name' => 'Regular Day',  'type' => 'regular',    'price' => 350000, 'quota' => 5000],
                    ['name' => '3 Day Pass',   'type' => 'regular',    'price' => 800000, 'quota' => 2000],
                ],
            ],
            [
                'title'       => 'Noah Live in Bandung',
                'city'        => 'Bandung',
                'venue'       => 'Sabuga International Convention Center',
                'start_date'  => Carbon::now()->addDays(20),
                'end_date'    => Carbon::now()->addDays(20)->addHours(3),
                'is_featured' => false,
                'category_id' => $musicCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
                'tickets'     => [
                    ['name' => 'Tribun',    'type' => 'regular', 'price' => 175000, 'quota' => 2000],
                    ['name' => 'Festival',  'type' => 'regular', 'price' => 275000, 'quota' => 3000],
                    ['name' => 'VIP',       'type' => 'vip',     'price' => 650000, 'quota' => 300],
                ],
            ],
            [
                'title'       => 'Dewa 19 Reunion Concert — Surabaya',
                'city'        => 'Surabaya',
                'venue'       => 'Graha Cakrawala Universitas Negeri Malang',
                'start_date'  => Carbon::now()->addDays(25),
                'end_date'    => Carbon::now()->addDays(25)->addHours(4),
                'is_featured' => false,
                'category_id' => $musicCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200',
                'tickets'     => [
                    ['name' => 'Reguler',  'type' => 'regular', 'price' => 200000, 'quota' => 3000],
                    ['name' => 'Gold',     'type' => 'vip',     'price' => 450000, 'quota' => 500],
                    ['name' => 'Platinum', 'type' => 'vip',     'price' => 900000, 'quota' => 100],
                ],
            ],
            [
                'title'       => 'Stand Up Comedy Special — Raditya Dika',
                'city'        => 'Jakarta',
                'venue'       => 'Balai Sarbini, Plaza Semanggi',
                'start_date'  => Carbon::now()->addDays(15),
                'end_date'    => Carbon::now()->addDays(15)->addHours(2),
                'is_featured' => false,
                'category_id' => Category::where('slug', 'komedi')->first()?->id,
                'banner'      => 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=1200',
                'tickets'     => [
                    ['name' => 'Regular', 'type' => 'regular', 'price' => 150000, 'quota' => 500],
                    ['name' => 'VIP',     'type' => 'vip',     'price' => 350000, 'quota' => 100],
                ],
            ],
            [
                'title'       => 'We The Fest 2026',
                'city'        => 'Jakarta',
                'venue'       => 'Jakarta Internasional Expo',
                'start_date'  => Carbon::now()->addDays(90),
                'end_date'    => Carbon::now()->addDays(92),
                'is_featured' => true,
                'category_id' => $festCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200',
                'tickets'     => [
                    ['name' => 'Early Bird 1 Day', 'type' => 'early_bird', 'price' => 300000,  'quota' => 500],
                    ['name' => 'Regular 1 Day',    'type' => 'regular',    'price' => 450000,  'quota' => 5000],
                    ['name' => 'Regular 3 Day',    'type' => 'regular',    'price' => 1200000, 'quota' => 2000],
                    ['name' => 'VIP',              'type' => 'vip',        'price' => 2500000, 'quota' => 300],
                ],
            ],
            [
                'title'       => 'IU Love Poem in Concert — Jakarta',
                'city'        => 'Jakarta',
                'venue'       => 'Indonesia Arena, GBK',
                'start_date'  => Carbon::now()->addDays(55),
                'end_date'    => Carbon::now()->addDays(55)->addHours(3),
                'is_featured' => true,
                'category_id' => $musicCat?->id,
                'banner'      => 'https://images.unsplash.com/photo-1540835296355-32c3a4d4b397?w=1200',
                'tickets'     => [
                    ['name' => 'D Zone',  'type' => 'regular', 'price' => 1800000, 'quota' => 3000],
                    ['name' => 'C Zone',  'type' => 'regular', 'price' => 2500000, 'quota' => 2000],
                    ['name' => 'B Zone',  'type' => 'vip',     'price' => 3800000, 'quota' => 1000],
                    ['name' => 'A Zone',  'type' => 'vip',     'price' => 5500000, 'quota' => 500],
                ],
            ],
        ];

        foreach ($events as $eventData) {
            $tickets = $eventData['tickets'];
            unset($eventData['tickets']);

            $slug = Str::slug($eventData['title']);

            // Disable global tenant scope for seeder
            $event = Event::withoutGlobalScopes()->firstOrCreate(
                ['slug' => $slug],
                array_merge($eventData, [
                    'tenant_id'        => $tenant->id,
                    'user_id'          => $promotor->id,
                    'slug'             => $slug,
                    'description'      => "Bergabunglah dalam {$eventData['title']}! Event spektakuler yang tidak boleh Anda lewatkan. Dapatkan pengalaman tak terlupakan bersama ribuan penonton lainnya.",
                    'short_desc'       => "Event seru yang wajib dikunjungi di {$eventData['city']}.",
                    'province'         => 'Jawa Barat',
                    'status'           => 'approved',
                    'approved_at'      => now(),
                    'approved_by'      => 1,
                    'view_count'       => rand(100, 5000),
                ])
            );

            foreach ($tickets as $i => $ticketData) {
                Ticket::firstOrCreate(
                    ['event_id' => $event->id, 'name' => $ticketData['name']],
                    array_merge($ticketData, [
                        'event_id'     => $event->id,
                        'description'  => "Tiket {$ticketData['name']} untuk {$event->title}",
                        'sold'         => rand(0, (int)($ticketData['quota'] * 0.6)),
                        'min_purchase' => 1,
                        'max_purchase' => 4,
                        'sale_start'   => now(),
                        'sale_end'     => $event->start_date->subDay(),
                        'is_active'    => true,
                        'sort_order'   => $i,
                    ])
                );
            }
        }

        $this->command->info('✅ Sample events & tickets seeded (' . count($events) . ' events).');
    }
}
