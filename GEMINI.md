# QUY TẮC BẢO TOÀN VÀ PHÁT TRIỂN MODULE DỰ ĐOÁN TÀI XỈU - CHẴN LẺ 5 SỐ AI PRO

> **QUY ĐỊNH BẤT KHẢ XÂM PHẠM (LOCK):** 
> Toàn bộ logic thuật toán, quy tắc bắt cầu và giao diện hiển thị trong dự án này đã được tối ưu hóa chuẩn xác tuyệt đối theo yêu cầu của Người Dùng. Nghiêm cấm tự ý sửa đổi, xóa bỏ hoặc làm thay đổi logic hoạt động nếu không có yêu cầu rõ ràng từ Người Dùng.

---

## 1. THUẬT TOÁN BẮT 5 CHẠM CỨNG VÀ DÀN 25 SỐ VIP

Hệ thống bắt 5 Chạm Lõi từ kết quả kỳ quay trước thông qua **6 Cầu Vàng gia truyền** kết hợp Tam Giác Pascal và Khử Lô Gan:
1. **Cầu 1 (Đơn Vị $\times 2$):** Lấy chữ số hàng đơn vị ($d_5$) nhân 2. Lấy số chính nó $u = (d_5 \times 2) \pmod{10}$ và bóng dương $(u + 5) \pmod{10}$. Tự động quét nhịp ăn chính nó hay bóng dương trong các kỳ gần nhất.
2. **Cầu 2 (Cặp Chạm Vàng Quy Đổi Trăm & Đơn Vị):**
   - Bảng quy đổi đối xứng: `0 ↔ 9`, `1 ↔ 2`, `3 ↔ 6`, `4 ↔ 8`, `5 ↔ 7`.
   - Áp dụng cho số hàng trăm ($d_3$) và hàng đơn vị ($d_5$).
3. **Cầu 3 (Biên Trừ):** $(u - 1 + 10) \pmod{10}$.
4. **Cầu 4 (Biên Cộng):** $(u + 1) \pmod{10}$.
5. **Cầu 5 (Tổng Đầu - Chục Ngàn + Ngàn $d_1 + d_2$):** $(d_1 + d_2) \pmod{10}$ và bóng dương $((d_1+d_2+5) \pmod{10})$. Tự động quét nhịp ăn bóng chính diện hay bóng dương.
6. **Cầu 6 (Tổng Đuôi - Hàng Chục + Đơn Vị $d_4 + d_5$):** $(d_4 + d_5) \pmod{10}$ và bóng dương $((d_4+d_5+5) \pmod{10})$. Tự động quét nhịp ăn bóng chính diện hay bóng dương.
7. **Tam Giác Pascal:** Thu hẹp 5 chữ số về 2 đỉnh hội tụ năng lượng Pascal.
8. **Bộ Lọc Khử Lô Gan:** Tự động hạ điểm các số câm/gan dài ngày (không ra từ 5 đến 8 kỳ trở lên).

Từ 5 chạm được điểm cao nhất ➔ Ghép thành **Dàn 25 số VIP bao trọn kép** (đánh Tiền Nhị & Hậu Nhị).

---

## 2. QUY TẮC NUÔI DÀN 25 KHUNG 3 KỲ (TRÚNG LÀ DỪNG / ĐỔI DÀN) & MỐC GỐC 5 KỲ ĐẦU TIÊN

- **Quy tắc 5 Kỳ Mốc Gốc Khởi Tạo (Warmup Baseline):**
  - Khi bắt đầu chơi, **5 kỳ kết quả đầu tiên (Kỳ 1 ➔ Kỳ 5)** được lưu trữ làm **Mốc Dữ Liệu Nền** để phân tích nhịp cầu, ma trận Pascal và khử lô gan.
  - 5 kỳ này **KHÔNG ÁP DỤNG ĐỂ RA DỰ ĐOÁN VÀO TIỀN** và **KHÔNG THỐNG KÊ TRÚNG/TRƯỢT (HÚP/GÃY)** trong bảng 10 kỳ.
  - **Khung nuôi #1 chính thức bắt đầu từ Kỳ thứ 6:** Lấy kết quả Kỳ 5 làm Mốc Gốc, dự đoán cho Kỳ 6 (Tay 1) ➔ Kỳ 7 (Tay 2) ➔ Kỳ 8 (Tay 3).
  - Khi số lượng kỳ đã nhập $< 5$, hệ thống hiển thị trạng thái `ĐANG NẠP 5 KỲ DỮ LIỆU GỐC (N/5)` và nhắc nhở `Chưa vào tiền`.
- **Chu kỳ nuôi tối đa:** 3 Kỳ liên tiếp (**Tay 1 ➔ Tay 2 ➔ Tay 3**).
- **Phạm vi đánh:** Đánh đồng thời cả **Tiền Nhị** (2 số đầu $d_1 d_2$) và **Hậu Nhị** (2 số đuôi $d_4 d_5$).
- **Quy tắc Trúng là Dừng (Win-Reset):**
  - Nếu trúng ở Tay 1 ➔ Đánh dấu **HÚP TAY 1 ✓**, DỪNG khung đó ngay, lấy kết quả kỳ vừa trúng làm **Mốc Gốc Mới** để mở Khung Mới (bắt đầu lại ở Tay 1).
  - Nếu trượt Tay 1 ➔ Đánh tiếp Tay 2. Trúng ở Tay 2 ➔ Đánh dấu **HÚP TAY 2 ✓**, DỪNG và lấy kỳ này mở Khung Mới.
  - Nếu trượt Tay 2 ➔ Đánh tiếp Tay 3. Trúng ở Tay 3 ➔ Đánh dấu **HÚP TAY 3 ✓**, DỪNG và mở Khung Mới.
- **Quy tắc Gãy Khung (Lost Frame):**
  - Nếu trượt cả Tay 1, Tay 2, Tay 3 ➔ Đánh dấu **GÃY KHUNG ✗**, chốt khung và lấy kỳ thứ 3 làm Mốc Gốc Mới.

---

## 3. QUY CHUẨN GIAO DIỆN (UI/UX)

- **Thẻ Khung Nuôi Hiện Tại (`card-frame-active`) & Khối Dự Đoán 5 Chạm:**
  - Hiển thị rõ ràng 2 dòng: **Mốc Gốc (Kỳ tham chiếu)** và **Đang Đánh Cho (Kỳ tiếp theo + Tay 1/2/3)**.
  - Hiển thị 5 viên ngọc Chạm Cứng kèm nhãn **TOP 1 ➔ TOP 5**, % tỷ lệ nổ, nhãn nguồn gốc Cầu và toàn bộ Dàn 25 số.
  - 2 Nút copy nhanh 1 chạm: Copy 25 số (có kép) và Copy 20 số (bỏ kép).
- **Khối Nhận Định Nhịp Cầu & Hàng Số AI (`bridge-insight-box`):**
  - Tách thành 3 dòng/mục riêng biệt rõ ràng: (1) Cầu Tài/Xỉu, (2) Cầu Chẵn/Lẻ kèm giải mã vị trí, (3) 6 Cầu Vàng Bắt 5 Chạm Lõi & Dàn 25 số VIP nuôi khung.
  - Mỗi mục có huy hiệu định danh riêng, viền màu phân biệt (Đỏ, Tím, Vàng), giúp người dùng nắm bắt ngay các điểm cốt lõi.
- **Thẻ Thống Kê Các Khung Đã Nuôi (`card-frame-history`):**
  - Hiển thị tổng số khung đã hoàn tất, % ăn khung, % ăn Tay 1, 2, 3 và % gãy.
  - **Khối Đối Soát Tiền Nhị vs Hậu Nhị (`frame-nhi-analysis-box`):**
    - 3 Thẻ Mini: Ăn Tiền Nhị (2 Đầu d1 d2), Ăn Hậu Nhị (2 Đuôi d4 d5), Trúng Cả 2 Đầu kèm số khung và % tỷ lệ trúng.
    - Thanh so sánh tỷ lệ kép trực quan (Dual Progress Bar: Tiền % vs Hậu %).
    - Huy hiệu nhận định xu hướng & Lời khuyên phân bổ vốn: Nhận biết tự động dòng cầu đang **THIÊN VỀ HẬU NHỊ**, **THIÊN VỀ TIỀN NHỊ** hay **CÂN BẰNG 2 ĐẦU**.
  - Danh sách từng khung đã qua dạng Grid ngang: Tay 1, Tay 2, Tay 3 hiển thị đồng thời, không bị che khuất trên mobile.
- **Khối Hiển Thị Nhanh Kỳ Trước Vừa Ra (`last-round-quick-banner` & `last-round-mini-inline`):**
  - Tích hợp ngay trong Thẻ Nhập Kết Quả (`card-input`), hiển thị tức thì kỳ vừa nhập: Số Kỳ, 5 Viên Bi Số phát sáng, Tổng điểm, Kết quả Tài/Xỉu/Chẵn/Lẻ, Tiền Nhị/Hậu Nhị và Trạng thái Húp/Gãy.
  - Giúp người dùng quan sát ngay kết quả kỳ trước mà không cần cuộn trang xuống dưới.

---

## 4. QUY TẮC QUẢN LÝ VỐN 5 KHUNG & HƯỚNG DẪN VÀO TIỀN THÔNG MINH

- **Phân Bổ Vốn:**
  - Tổng Vốn được người dùng tùy chỉnh (Mặc định 30.000.000 VNĐ, có nút chọn nhanh 10M, 20M, 30M, 50M, 100M).
  - Chia tối thiểu **5 Khung Dự Trữ An Toàn** ($\text{Vốn 1 Khung} = \text{Tổng Vốn} / 5$).
- **Tỷ Lệ Vào Tiền 3 Tay Chuẩn Toán Học (Đảm bảo Tay nào nổ cũng có LÃI RÕ RÀNG):**
  - **Phương án 1 cửa (25 số VIP):**
    - Tay 1: ~8.33% vốn khung (Ví dụ vốn 6M ➔ Đặt 20k/số = 500k ➔ Ăn lãi **+1.480.000đ**).
    - Tay 2: ~25% vốn khung (Ví dụ vốn 6M ➔ Gấp thếp 60k/số = 1.500k ➔ Ăn lãi **+3.940.000đ**).
    - Tay 3: Phần còn lại ~66.6% vốn khung (Ví dụ vốn 6M ➔ Quyết đấu 160k/số = 4.000k ➔ Ăn lãi **+9.840.000đ**).
  - **Phương án 2 cửa (50 số Tiền & Hậu - Vốn 6M / khung):**
    - Tay 1: 20k/số (500k/đầu ➔ Tổng 2 đầu: 1.000.000đ) ➔ Ăn 1 cửa lãi **+980.000đ** (Ăn cả 2 cửa lãi **+2.960.000đ**).
    - Tay 2: 35k/số (875k/đầu ➔ Tổng 2 đầu: 1.750.000đ) ➔ Ăn 1 cửa lãi **+715.000đ** (Ăn cả 2 cửa lãi **+4.180.000đ**).
    - Tay 3: 65k/số (1.625k/đầu ➔ Tổng 2 đầu: 3.250.000đ) ➔ Ăn 1 cửa lãi **+435.000đ** (Ăn cả 2 cửa lãi **+6.870.000đ**).
    - Tổng vốn 3 tay: $1.000.000 + 1.750.000 + 3.250.000 = 6.000.000$ VNĐ (Khớp trọn vẹn 1 khung).
- **Chỉ Dẫn Trực Tiếp Thời Gian Thực (Live Bet Advisor):**
  - Tự động nhận diện tay đang đánh (Tay 1, 2 hay 3) của Khung Hiện Tại để highlight thẻ tay tương ứng.
  - Hiển thị trực tiếp số tiền cần đặt và mức lãi dự kiến trên thẻ Khung Nuôi (`cardActiveFrame`) và thẻ 5 Chạm Lõi (`predChamBox`).

---

## 5. BỘ ĐÁNH GIÁ ĐỘ MẠNH CẦU & KIẾN NGHỊ VÀO VỐN AI (BRIDGE HEALTH INDEX)

Nhằm triệt tiêu rủi ro thua đậm trong các giai đoạn bão cầu / bẻ cầu / gãy khung liên tiếp:
- **Nguyên lý Chấm Điểm (0 - 100%):**
  - Quét tỷ lệ nổ thông của **6 Cầu Vàng** trong 3 - 5 kỳ gần nhất (Trọng số 35%).
  - Đánh giá độ hội tụ của **5 Chạm Lõi** và ma trận Pascal (Trọng số 25%).
  - Kiểm tra chuỗi gãy khung (**Lost Streak / Risk Momentum** - Trọng số 25%): Phạt nặng nếu xuất hiện $\ge 2$ khung gãy liên tiếp hoặc 3 khung gần nhất gãy $\ge 2$.
  - Cộng hưởng nhịp Tài/Xỉu & Chẵn/Lẻ (Trọng số 15%).
- **3 Cấp Tín Hiệu & Hành Động:**
  1. 🟢 **ĐÈN XANH (Điểm $\ge 72\%$ - Cầu Chuẩn Đẹp):** Cầu đang trả số cực chuẩn, ít nhất 4/6 Cầu Vàng nổ thông. ➔ **KIẾN NGHỊ: NÊN VÀO TIỀN / VÀO VỐN ĐẦY ĐỦ** theo bảng tỷ lệ 3 tay.
  2. 🟡 **ĐÈN VÀNG (Điểm $50\% - 71\%$ - Cầu Trung Bình):** Cầu có độ lệch nhẹ hoặc vừa trượt 1 tay. ➔ **KIẾN NGHỊ: ĐI TIỀN NHẸ THĂM DÒ (Hạ 50% vốn)** hoặc chỉ đánh 1 đầu Hậu Nhị.
  3. 🔴 **ĐÈN ĐỎ (Điểm $< 50\%$ hoặc Gãy $\ge 2$ Khung Liên Tiếp - Bão Cầu):** Cầu bị gãy chuỗi, nhịp loạn. ➔ **KIẾN NGHỊ: TẠM NGHỈ KHUNG NÀY (ĐỨNG NGOÀI QUAN SÁT)** để bảo toàn 100% vốn 30M, đợi 1 khung nổ thông lại mới vào tiền.
- **Vị trí hiển thị:**
  - Khối **Tín Hiệu Vào Vốn AI (`frame-signal-box`)** trên Thẻ Khung Nuôi Hiện Tại (`cardActiveFrame`).
  - Viên ngọc **Tín Hiệu Cầu** trên Khối Bắt 5 Chạm (`predChamBox`).
  - Mục 4 trong **Khối Nhận Định Nhịp Cầu & Hàng Số AI (`bridge-insight-box`)**.
  - Thanh **Nhắc Nhở Vào Tiền Trực Tiếp (`capLivePrompt`)**.

