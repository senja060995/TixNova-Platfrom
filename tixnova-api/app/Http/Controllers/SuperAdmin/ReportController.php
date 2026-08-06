<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function revenue(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->reports->platformReport($request->all()),
        ]);
    }

    public function tenants(Request $request): JsonResponse
    {
        $report = $this->reports->platformReport($request->all());

        return response()->json([
            'success' => true,
            'data' => $report['top_tenants'],
        ]);
    }

    public function export(Request $request): StreamedResponse|Response
    {
        $format = $request->validate(['format' => ['required', 'in:csv,pdf']])['format'];
        $report = $this->reports->platformReport($request->all());
        $filename = 'laporan-platform-'.$report['filters']['start_date'].'-'.$report['filters']['end_date'];

        if ($format === 'pdf') {
            return Pdf::loadView('reports.platform', $report)
                ->setPaper('a4', 'portrait')
                ->download("{$filename}.pdf");
        }

        $rows = $this->reports->exportRows(null, $request->all());

        return response()->streamDownload(function () use ($rows) {
            $output = fopen('php://output', 'w');
            fputcsv($output, array_keys($rows->first() ?? [
                'Kode Order' => '',
                'Event' => '',
                'Promotor' => '',
                'Tanggal Pembayaran' => '',
                'Subtotal Tiket' => '',
                'Diskon' => '',
                'Biaya Admin' => '',
                'GMV' => '',
                'Komisi Platform' => '',
                'Payout Promotor' => '',
            ]));

            foreach ($rows as $row) {
                fputcsv($output, $row);
            }

            fclose($output);
        }, "{$filename}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
