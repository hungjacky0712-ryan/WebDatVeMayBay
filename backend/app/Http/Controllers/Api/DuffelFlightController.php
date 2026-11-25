<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DuffelFlightController extends Controller
{
    /**
     * Chuyển dữ liệu các segment thành cấu trúc thống nhất.
     */
    private function formatSegments(array $segments): array
    {
        $details = [];

        foreach ($segments as $segment) {
            $marketingCarrier = $segment['marketing_carrier'] ?? [];
            $operatingCarrier = $segment['operating_carrier'] ?? [];

            $details[] = [
                'HangHangKhong' =>
                    $marketingCarrier['name']
                    ?? $operatingCarrier['name']
                    ?? 'Chưa cập nhật',

                'SoHieuChuyenBay' =>
                    $segment['marketing_carrier_flight_number']
                    ?? $segment['operating_carrier_flight_number']
                    ?? '',

                'SanBayDi' =>
                    $segment['origin']['iata_code'] ?? '',

                'TenSanBayDi' =>
                    $segment['origin']['name'] ?? '',

                'SanBayDen' =>
                    $segment['destination']['iata_code'] ?? '',

                'TenSanBayDen' =>
                    $segment['destination']['name'] ?? '',

                'GioKhoiHanh' =>
                    $segment['departing_at'] ?? null,

                'GioDen' =>
                    $segment['arriving_at'] ?? null,
            ];
        }

        return $details;
    }

    /**
     * Tạo dữ liệu một chiều bay.
     */
    private function formatSlice(array $slice): ?array
    {
        $segments = $slice['segments'] ?? [];

        if (empty($segments)) {
            return null;
        }

        $firstSegment = $segments[0];
        $lastSegment = $segments[count($segments) - 1];

        $totalSegments = count($segments);

        $marketingCarrier =
            $firstSegment['marketing_carrier'] ?? [];

        $operatingCarrier =
            $firstSegment['operating_carrier'] ?? [];

        return [
            'GioKhoiHanh' =>
                $firstSegment['departing_at'] ?? null,

            'GioDen' =>
                $lastSegment['arriving_at'] ?? null,

            'IATADi' =>
                $firstSegment['origin']['iata_code'] ?? '',

            'TenSanBayDi' =>
                $firstSegment['origin']['name'] ?? '',

            'IATADen' =>
                $lastSegment['destination']['iata_code'] ?? '',

            'TenSanBayDen' =>
                $lastSegment['destination']['name'] ?? '',

            'SoChang' => $totalSegments,

            'SoDiemDung' => max(0, $totalSegments - 1),

            'CacChangBay' => $this->formatSegments($segments),

            'HanhTrinh' => $segments,

            'TenHang' =>
                $marketingCarrier['name']
                ?? $operatingCarrier['name']
                ?? 'Chưa cập nhật',

            'SoHieuChuyenBay' =>
                $firstSegment['marketing_carrier_flight_number']
                ?? $firstSegment['operating_carrier_flight_number']
                ?? '',
        ];
    }

    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from' => 'required|string|size:3',
            'to' => 'required|string|size:3|different:from',
            'departure' => 'required|date_format:Y-m-d|after_or_equal:today',
            'return_date' => 'nullable|date_format:Y-m-d|after_or_equal:departure',
            'passengers' => 'nullable|integer|min:1|max:9',
            'cabin_class' => 'nullable|in:economy,premium_economy,business,first',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu tìm kiếm không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $token = config('services.duffel.token');
            $baseUrl = config('services.duffel.base_url');

            if (!$token || !$baseUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chưa cấu hình Duffel API.',
                ], 500);
            }

            $from = strtoupper($request->from);
            $to = strtoupper($request->to);

            $returnDate = $request->input('return_date');

            $isRoundTrip = !empty($returnDate);

            // =========================================
            // 1. TẠO CÁC CHIỀU BAY
            // =========================================

            $slices = [
                [
                    'origin' => $from,
                    'destination' => $to,
                    'departure_date' => $request->departure,
                ],
            ];

            if ($isRoundTrip) {
                $slices[] = [
                    'origin' => $to,
                    'destination' => $from,
                    'departure_date' => $returnDate,
                ];
            }

            $passengerCount = (int) $request->input('passengers', 1);

            $cabinClass = $request->input('cabin_class', 'economy');

            // =========================================
            // 2. PAYLOAD DUFFEL
            // =========================================

            $payload = [
                'data' => [
                    'slices' => $slices,

                    'passengers' => array_fill(
                        0,
                        $passengerCount,
                        ['type' => 'adult']
                    ),

                    'cabin_class' => $cabinClass,

                    'max_connections' => 1,
                ],
            ];

            // =========================================
            // 3. GỌI DUFFEL API
            // =========================================

            $response = Http::withToken($token)
                ->withHeaders([
                    'Duffel-Version' => 'v2',
                    'Accept' => 'application/json',
                ])
                ->timeout(60)
                ->post(
                    rtrim($baseUrl, '/') . '/air/offer_requests?return_offers=true',
                    $payload
                );

            if (!$response->successful()) {
                Log::warning('Duffel API error', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'payload' => $payload,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Duffel không thể tìm chuyến bay.',
                    'status' => $response->status(),
                    'error' => $response->json(),
                ], 502);
            }

            $result = $response->json();

            $offers = $result['data']['offers'] ?? [];

            $flights = [];

            // =========================================
            // 4. XỬ LÝ TỪNG OFFER
            // =========================================

            foreach ($offers as $offer) {
                $offerSlices = $offer['slices'] ?? [];

                // Không có chiều đi thì bỏ qua
                if (empty($offerSlices)) {
                    continue;
                }

                // Khứ hồi bắt buộc phải có đủ hai chiều
                if ($isRoundTrip && count($offerSlices) < 2) {
                    Log::warning('Duffel offer thiếu chiều về', [
                        'offer_id' => $offer['id'] ?? null,
                        'slice_count' => count($offerSlices),
                    ]);

                    continue;
                }

                // =====================================
                // 5. CHIỀU ĐI
                // =====================================

                $outbound = $this->formatSlice($offerSlices[0]);

                if (!$outbound) {
                    continue;
                }

                // =====================================
                // 6. CHIỀU VỀ
                // =====================================

                $returnDetails = null;

                if ($isRoundTrip) {
                    $returnDetails = $this->formatSlice($offerSlices[1]);

                    if (!$returnDetails) {
                        continue;
                    }
                }

                // =====================================
                // 7. THÔNG TIN GIÁ VÀ OFFER
                // =====================================

                $offerId = $offer['id'] ?? '';

                $totalAmount = $offer['total_amount'] ?? '0';

                $currency = $offer['total_currency'] ?? '';

                // Đây là giá tổng của Offer Duffel.
                // Với khứ hồi, giá này bao gồm cả hai chiều.
                // Không cộng thêm giá chiều về lần nữa.

                // =====================================
                // 8. TẠO DỮ LIỆU TRẢ VỀ
                // =====================================

                $flight = [
                    'MaChuyenBay' => $offerId,

                    'offer_id' => $offerId,

                    'CabinClass' => $cabinClass,

                    'TenHang' => $outbound['TenHang'],

                    'SoHieuChuyenBay' => $outbound['SoHieuChuyenBay'],

                    // Chiều đi
                    'GioKhoiHanh' => $outbound['GioKhoiHanh'],

                    'GioDen' => $outbound['GioDen'],

                    'IATADi' => $outbound['IATADi'],

                    'IATADen' => $outbound['IATADen'],

                    'TenSanBayDi' => $outbound['TenSanBayDi'],

                    'TenSanBayDen' => $outbound['TenSanBayDen'],

                    'SoChang' => $outbound['SoChang'],

                    'SoDiemDung' => $outbound['SoDiemDung'],

                    'CacChangBay' => $outbound['CacChangBay'],

                    // Chiều về
                    'ChieuVe' => $returnDetails,

                    // Loại hành trình
                    'LoaiHanhTrinh' => $isRoundTrip ? 'round_trip' : 'one_way',

                    // Trạng thái
                    'TrangThai' => 'Scheduled',

                    // Giá
                    'TienTe' => $currency,

                    'TongGia' => $totalAmount,

                    // Toàn bộ dữ liệu các chiều từ Duffel
                    'HanhTrinh' => $offerSlices,

                    // Offer gốc để sử dụng khi đặt vé
                    'OfferGoc' => $offer,

                    // Thông tin hạng vé
                    'GiaVe' => [
                        [
                            'MaGiaVe' => $offerId,

                            'TenHangVe' => match ($cabinClass) {
                                'economy' => 'Phổ thông',
                                'premium_economy' => 'Phổ thông đặc biệt',
                                'business' => 'Thương gia',
                                'first' => 'VIP / Hạng nhất',
                                default => 'Chưa xác định',
                            },

                            'GiaVe' => $totalAmount,

                            'TienTe' => $currency,

                            'HanhLyKg' => null,

                            'SoGheConTrong' => null,
                        ],
                    ],
                ];

                $flights[] = $flight;
            }

            // =========================================
            // 9. GHI LOG KIỂM TRA
            // =========================================

            Log::info('Duffel flight search completed', [
                'from' => $from,
                'to' => $to,
                'departure' => $request->departure,
                'return_date' => $returnDate,
                'is_round_trip' => $isRoundTrip,
                'cabin_class' => $cabinClass,
                'offer_count' => count($offers),
                'flight_count' => count($flights),
            ]);

            // =========================================
            // 10. TRẢ KẾT QUẢ
            // =========================================

            return response()->json([
                'success' => true,

                'message' => 'Tìm chuyến bay thành công.',

                'total' => count($flights),

                'trip_type' => $isRoundTrip ? 'round_trip' : 'one_way',

                'cabin_class' => $cabinClass,

                'data' => $flights,
            ]);

        } catch (\Throwable $e) {
            Log::error('Duffel search exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối Duffel API.',
            ], 500);
        }
    }
}
