<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Musik & Konser', 'icon' => 'music',          'color' => '#7C3AED'],
            ['name' => 'Festival',       'icon' => 'sparkles',       'color' => '#F59E0B'],
            ['name' => 'Komedi',         'icon' => 'mic',            'color' => '#10B981'],
            ['name' => 'Teater & Drama', 'icon' => 'ticket',         'color' => '#3B82F6'],
            ['name' => 'Olahraga',       'icon' => 'trophy',         'color' => '#EF4444'],
            ['name' => 'Pameran & Expo', 'icon' => 'image',          'color' => '#8B5CF6'],
            ['name' => 'Seminar',        'icon' => 'graduation-cap', 'color' => '#06B6D4'],
            ['name' => 'Food & Drink',   'icon' => 'utensils',       'color' => '#F97316'],
        ];

        foreach ($categories as $i => $cat) {
            Category::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'slug' => Str::slug($cat['name']),
                    'type' => 'event',
                    'icon' => $cat['icon'],
                    'color' => $cat['color'],
                    'is_active' => true,
                    'sort_order' => $i + 1,
                ]
            );
        }

        // Blog categories
        $blogCats = ['Tips & Trik', 'Review Konser', 'Panduan Beli Tiket', 'Berita Event'];
        foreach ($blogCats as $i => $name) {
            Category::firstOrCreate(
                ['slug' => Str::slug($name).'-blog'],
                [
                    'name' => $name,
                    'slug' => Str::slug($name).'-blog',
                    'type' => 'blog',
                    'is_active' => true,
                    'sort_order' => $i + 1,
                ]
            );
        }

        $this->command->info('✅ Categories updated without emojis.');
    }
}
