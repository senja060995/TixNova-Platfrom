<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\Category;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        $author = User::where('email', 'promotor@soundproject.id')->first() ?? User::first();
        $category = Category::where('type', 'blog')->first() ?? Category::first();

        $blogs = [
            [
                'title' => '5 Tips Menonton Konser Musik Agar Pengalamanmu Maksimal',
                'slug' => '5-tips-menonton-konser-musik-agar-pengalamanmu-maksimal',
                'excerpt' => 'Persiapan sebelum menonton konser dari pakaian, outfit, kedatangan awal, hingga cara menjaga barang bawaan tetap aman.',
                'content' => "Menonton konser musik secara langsung adalah salah satu pengalaman paling emosional dan menyenangkan. Namun tanpa persiapan yang matang, konser impianmu bisa menjadi kurang berkesan.\n\nBerikut 5 tips wajib yang harus kamu persiapkan sebelum berangkat ke venue:\n\n1. Datang Lebih Awal\nHindari antrean mengular dengan tiba di tempat acara setidaknya 2 jam sebelum gate dibuka.\n\n2. Gunakan Sepatu yang Nyaman\nKamu akan berdiri dan melompat selama beberapa jam, jadi lupakan heels atau sepatu yang sempit.\n\n3. Bawa Air dan Pastikan Terhidrasi\nPastikan kesehatan fisik terjamin selama pertunjukan berlangsung.",
                'banner' => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
            ],
            [
                'title' => 'Panduan Aman Membeli Tiket Konser Online Agar Terhindar Penipuan Calo',
                'slug' => 'panduan-aman-membeli-tiket-konser-online-agar-terhindar-penipuan-calo',
                'excerpt' => 'Kenali ciri-ciri penipuan tiket konser dan pastikan kamu selalu bertransaksi melalui platform resmi ber-QR Code.',
                'content' => "Fenomena war tiket konser sering kali dimanfaatkan oleh oknum tak bertanggung jawab untuk menjual tiket palsu dengan harga fantastis.\n\nUntuk menghindari hal ini, selalu pastikan kamu hanya membeli tiket di platform resmi seperti TixNova yang menggunakan sistem E-Tiket terenkripsi QR Code.",
                'banner' => 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200',
            ],
            [
                'title' => 'Kilas Balik Kemeriahan Festival Musik Terbesar di Indonesia Tahun Ini',
                'slug' => 'kilas-balik-kemeriahan-festival-musik-terbesar-di-indonesia-tahun-ini',
                'excerpt' => 'Momen-momen tak terlupakan dari panggung hiburan Indonesia dengan puluhan ribuan penonton.',
                'content' => 'Tahun ini menjadi saksi bangkitnya industri seni dan pertunjukan musik di tanah air. Berbagai artis mancanegara dan lokal sukses mengguncang panggung hiburan nasional.',
                'banner' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
            ],
        ];

        foreach ($blogs as $data) {
            Blog::withoutGlobalScopes()->firstOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, [
                    'tenant_id' => $tenant?->id,
                    'user_id' => $author?->id,
                    'category_id' => $category?->id,
                    'status' => 'published',
                    'published_at' => now()->subDays(rand(1, 15)),
                    'view_count' => rand(50, 1200),
                ])
            );
        }

        $this->command->info('✅ Sample blog posts seeded.');
    }
}
