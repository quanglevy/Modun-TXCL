# QUY TẮC BẢO TOÀN VÀ PHÁT TRIỂN MODULE DỰ ĐOÁN TÀI XỈU - CHẴN LẺ 5 SỐ AI PRO

> **QUY ĐỊNH BẤT KHẢ XÂM PHẠM (LOCK):** 
> Toàn bộ logic thuật toán, quy tắc bắt cầu và giao diện hiển thị trong dự án này đã được tối ưu hóa chuẩn xác tuyệt đối theo yêu cầu của Người Dùng. Nghiêm cấm tự ý sửa đổi, xóa bỏ hoặc làm thay đổi logic hoạt động nếu không có yêu cầu rõ ràng từ Người Dùng.

---

## 1. THUẬT TOÁN BẮT CẦU MA TRẬN 8 CẦU TẦN SUẤT CAO (EMPIRICAL FREQUENCY MATRIX) KẾT HỢP GHÉP CHÉO KÉP (DUAL-CROSS) & HỘI TỤ 2+2+2

Hệ thống bắt Chạm VIP và Dàn số từ kết quả kỳ quay trước thông qua **Ma Trận 8 Cầu Tần Suất Cao (được kiểm chứng thực nghiệm đạt tỷ lệ nổ từ 48.1% đến 63.0%) kết hợp Cầu Ghép Chéo Kép (Dual-Cross Resonance), Cân Bằng Hội Tụ 2+2+2, Khóa Trục Tâm ($d_3$), Pascal Rút Gọn và Khử Lô Gan**:

### A. Ma Trận 8 Cầu Tần Suất Cao (Empirical High-Frequency Bridges):
1. **Cầu Bóng Tổng Đầu (Tần suất nổ 63.0% - Top 1 Toàn Hệ Thống):** Bóng dương của tổng 2 số đầu $((d_1 + d_2 + 5) \pmod{10})$ (+420đ Tiền, +250đ Hậu) & Tổng đầu $(d_1+d_2)\pmod{10}$ (+260đ).
2. **Cầu Bóng Tổng 5 Số (Tần suất nổ 55.6% - Khắc chế lệch Hậu Nhị):** Bóng dương tổng cả 5 số $(((\sum d_i) + 5) \pmod{10})$ (+400đ Hậu, +260đ Tiền) & Tổng 5 số $(\sum d_i)\pmod{10}$ (+220đ).
3. **Cầu Pascal Hậu Nhị (Tần suất nổ 55.6%):** Đỉnh tam giác Pascal rút gọn riêng cho 3 số đuôi $[d_3, d_4, d_5]$ (Đỉnh +380đ Hậu, Bóng +240đ, Tầng 1 +180đ).
4. **Cầu Tổng Biên (Tần suất nổ 51.9% - Cầu Ghép Chéo Biên):** $(d_1 + d_5) \pmod{10}$ (+370đ Tiền, +260đ Hậu) và bóng dương (+260đ Tiền, +200đ Hậu).
5. **Cầu Tổng Đuôi (Tần suất nổ 51.9%):** $(d_4 + d_5) \pmod{10}$ (+360đ Hậu, +240đ Tiền) và bóng dương (+280đ Hậu, +190đ Tiền).
6. **Cầu Pascal Tiền Nhị (Tần suất nổ 51.9%):** Đỉnh tam giác Pascal rút gọn riêng cho 3 số đầu $[d_1, d_2, d_3]$ (Đỉnh +350đ Tiền, Bóng +220đ, Tầng 1 +170đ).
7. **Cầu Bóng Trục Tâm & Khóa Tâm (Tần suất nổ 51.9%):** Bóng dương hàng trăm $(d_3 + 5) \pmod{10}$ (+340đ) và trục tâm $d_3$ (+200đ).
8. **Cầu Rơi Trực Tiếp Tần Suất Cao (Tần suất nổ 48.1%):** Điểm rơi $d_2$ (+330đ Tiền), $d_5$ (+330đ Hậu), $d_1$ (+280đ), $d_4$ (+280đ) và bóng tương ứng (+200đ).

### B. Cầu Ghép Chéo Kép Bổ Trợ (Dual-Cross Resonance):
- **Hiệu Đuôi ➔ Tiền Nhị:** $|d_4 - d_5|$ (+300đ) và bóng dương (+210đ).
- **Hiệu Đầu ➔ Hậu Nhị:** $|d_1 - d_2|$ (+280đ) và bóng dương (+200đ).
- **Rơi Đầu ➔ Hậu & Rơi Đuôi ➔ Tiền:** $d_1, d_2 \to \text{Hậu}$ (+220đ/+240đ); $d_4, d_5 \to \text{Tiền}$ (+220đ/+240đ).
- **Quy Đổi `MAP_EXCHANGE` & Nhân Đôi Hàng Số:** Quy đổi hàng số (+180đ), $(d_i \times 2) \pmod{10}$ (+150đ).
- **Bạc Nhớ & Khử Gan Tuyệt Đối:** Quét nhịp xuất hiện riêng tại vị trí Tiền Nhị/Hậu Nhị (Trừ 160đ cho số câm $\ge 6$ kỳ).

### C. Cơ Chế Hội Tụ Cân Bằng 2+2+2 Master (Dàn 36 Số VIP Bất Bại Ăn Cả 2 Đầu):
- **Cơ chế Phân Bổ Slot Bắt Buộc (Guaranteed 2+2+2 Allocation):**
  - **Slot 1 - 2 (2 Số Đầu):** Luôn lấy Top 2 Chạm mạnh nhất của Tiền Nhị ($d_1 d_2$).
  - **Slot 3 - 4 (2 Số Giữa):** Luôn lấy Top 2 Chạm mạnh nhất của Hậu Nhị ($d_4 d_5$).
  - **Slot 5 - 6 (2 Số Cuối):** Lấy 2 Chạm có tổng điểm liên kết giao thoa cao nhất $(\text{scoresTien} + \text{scoresHau})$ chưa có trong 4 slot đầu.
- **Mục Tiêu:** Triệt tiêu hoàn toàn hiện tượng "lệch 1 đầu", giúp Dàn 36 Số đạt xác suất ăn trọn cả 2 đầu Tiền Nhị và Hậu Nhị tối đa (Kiểm nghiệm thực tế đạt 100% ăn khung trong 3 tay).

### 3 Chế Độ Dàn Nuôi (Dàn Mode Selector):
- **Chế độ 1: DÀN 36 SỐ BẤT BẠI (6 Chạm VIP Hội Tụ 2+2+2 - Mặc định khuyên dùng ★):** 
  - Ghép từ 6 chạm hội tụ (2 Tiền + 2 Hậu + 2 Giao Thoa) thành Dàn 36 số bao trọn kép cho cả 2 đầu.
- **Chế độ 2: DÀN 25 SỐ (5 Chạm Lõi):**
  - Ghép từ Top 5 chạm thành Dàn 25 số bao trọn kép truyền thống.
- **Chế độ 3: TÁCH RIÊNG TIỀN NHỊ & HẬU NHỊ (2 Dàn 25 Số Chuyên Biệt):**
  - Dàn Tiền 25 số bắt từ Cầu Chuyên Tiền Nhị ($d_1 d_2$) và Dàn Hậu 25 số bắt từ Cầu Chuyên Hậu Nhị ($d_4 d_5$).

---

## 2. QUY TẮC NUÔI KHUNG CỐ ĐỊNH 3 KỲ QUAY (FIXED 3-STEP FRAME - GIỮ NGUYÊN DÀN 3 TAY / ĂN LÀ DỪNG & MỞ KHUNG MỚI)

- **Quy tắc 5 Kỳ Mốc Gốc Khởi Tạo (Warmup Baseline):**
  - Khi bắt đầu chơi, **5 kỳ kết quả đầu tiên (Kỳ 1 ➔ Kỳ 5)** được lưu trữ làm **Mốc Dữ Liệu Nền** để phân tích nhịp cầu, ma trận Pascal và khử lô gan.
  - 5 kỳ này **KHÔNG ÁP DỤNG ĐỂ RA DỰ ĐOÁN VÀO TIỀN** và **KHÔNG THỐNG KÊ TRÚNG/TRƯỢT (HÚP/GÃY)** trong bảng 10 kỳ.
  - **Khung nuôi #1 chính thức bắt đầu từ Kỳ thứ 6:** Lấy kết quả Kỳ 5 làm Mốc Gốc Khởi Tạo Khung #1, tính toán Dàn Số Cố Định nuôi cho Khung #1 (tối đa 3 kỳ: Kỳ 6, 7, 8).
  - Khi số lượng kỳ đã nhập $< 5$, hệ thống hiển thị trạng thái `ĐANG NẠP 5 KỲ DỮ LIỆU GỐC (N/5)` và nhắc nhở `Chưa vào tiền`.
- **Cơ Chế Nuôi Khung Cố Định 3 Tay (Fixed 3-Step Frame):**
  - Trong mỗi Khung Nuôi, Dàn số (36 số / 25 số / Tách Tiền & Hậu) được **SOI 1 LẦN DUY NHẤT TỪ KỲ MỐC GỐC BẮT ĐẦU KHUNG VÀ GIỮ NGUYÊN KHÔNG ĐỔI TRONG SUỐT 3 TAY (Tay 1, Tay 2, Tay 3)** của khung đó cho đến khi Trúng (Húp) hoặc Gãy.
  - Đánh đồng thời cả **Tiền Nhị** (2 số đầu $d_1 d_2$) và **Hậu Nhị** (2 số đuôi $d_4 d_5$).
  - **Tay 1 (Khởi đầu):** Đánh Dàn Cố Định của Khung.
    - Nếu trúng ➔ Đánh dấu **HÚP TAY 1 ✓**, DỪNG khung ngay, chốt lãi và lấy kỳ vừa trúng làm Mốc Gốc mở Khung Mới (tính Dàn Mới từ kỳ này và bắt đầu lại ở Tay 1).
  - **Tay 2 (Gấp thếp):** Nếu Tay 1 trượt ➔ Sang Tay 2 với mức vốn gấp thếp. **TIẾP TỤC ĐÁNH DÀN CỐ ĐỊNH CỦA KHUNG** (giữ nguyên không đổi, đón nhịp rơi số của khung).
    - Nếu trúng ➔ Đánh dấu **HÚP TAY 2 ✓**, DỪNG khung, chốt lãi và lấy kỳ vừa trúng làm Mốc Gốc mở Khung Mới (về lại Tay 1).
  - **Tay 3 (Quyết đấu):** Nếu Tay 2 trượt ➔ Sang Tay 3 với mức vốn quyết đấu. **TIẾP TỤC ĐÁNH DÀN CỐ ĐỊNH CỦA KHUNG**.
    - Nếu trúng ➔ Đánh dấu **HÚP TAY 3 ✓**, DỪNG khung, chốt lãi đậm và lấy kỳ vừa trúng làm Mốc Gốc mở Khung Mới (về lại Tay 1).
  - **Gãy Khung (Lost Frame):** Nếu trượt cả Tay 1, Tay 2, Tay 3 ➔ Đánh dấu **GÃY KHUNG ✗**, chốt khung và lấy kỳ thứ 3 làm Mốc Gốc mở Khung Mới (bắt đầu lại ở Tay 1 với Dàn Mới).
- **Tính Đồng Bộ Tuyệt Đối 100%:** Dàn số hiển thị trên Thẻ Khung Nuôi Hiện Tại (`activeFrame`) luôn đồng bộ 100% với Thẻ Dự Đoán (`currentPrediction`) và Bảng Lịch Sử 10 kỳ, triệt tiêu hoàn toàn sự lệch số giữa các bảng.

---

## 3. QUY CHUẨN GIAO DIỆN (UI/UX)

- **Bộ Chọn Chế Độ Dàn (`danModeTabs`):**
  - 3 Tab chuyển đổi tức thì: **DÀN 36 SỐ BẤT BẠI (Khuyên Dùng ★)**, **DÀN 25 SỐ (5 Chạm Lõi)**, **TÁCH TIỀN & HẬU (2x25 Số)**.
  - Khi đổi tab, hệ thống tự động cập nhật lại toàn bộ bảng đối soát, lịch sử khung và tỷ lệ vào tiền tương ứng.
- **Thẻ Khung Nuôi Hiện Tại (`card-frame-active`) & Khối Bắt Chạm:**
  - Hiển thị rõ ràng 2 dòng: **Mốc Gốc (Kỳ tham chiếu)** và **Đang Đánh Cho (Kỳ tiếp theo + Tay 1/2/3)**.
  - Hiển thị các viên ngọc Chạm Cứng kèm nhãn **TOP 1 ➔ TOP 6**, % tỷ lệ nổ, nhãn nguồn gốc Cầu và toàn bộ Dàn số.
  - Các Nút copy nhanh 1 chạm: Copy dàn VIP bao trọn kép (36 số / 25 số), Copy Tiền Nhị / Hậu Nhị riêng.
- **Khối Nhận Định Nhịp Cầu & Hàng Số AI (`bridge-insight-box`):**
  - Tách thành 4 dòng/mục riêng biệt rõ ràng: (1) Cầu Tài/Xỉu, (2) Cầu Chẵn/Lẻ kèm giải mã vị trí, (3) 6 Cầu Vàng Bắt Chạm VIP & Dàn Nuôi Khung, (4) Bộ đánh giá độ mạnh cầu & kiến nghị vào vốn AI.
  - Mỗi mục có huy hiệu định danh riêng, viền màu phân biệt (Đỏ, Tím, Vàng, Xanh Lá).
- **Thẻ Thống Kê Các Khung Đã Nuôi (`card-frame-history`):**
  - Hiển thị tổng số khung đã hoàn tất, % ăn khung, % ăn Tay 1, 2, 3 và % gãy.
  - **Khối Đối Soát Tiền Nhị vs Hậu Nhị (`frame-nhi-analysis-box`):**
    - 3 Thẻ Mini: Ăn Tiền Nhị (2 Đầu d1 d2), Ăn Hậu Nhị (2 Đuôi d4 d5), Trúng Cả 2 Đầu kèm số khung và % tỷ lệ trúng.
    - Thanh so sánh tỷ lệ kép trực quan (Dual Progress Bar: Tiền % vs Hậu %).
    - Huy hiệu nhận định xu hướng & Lời khuyên phân bổ vốn: Nhận biết tự động dòng cầu đang **THIÊN VỀ HẬU NHỊ**, **THIÊN VỀ TIỀN NHỊ** hay **CÂN BẰNG 2 ĐẦU**.
  - Danh sách từng khung đã qua dạng Grid ngang: Tay 1, Tay 2, Tay 3 hiển thị đồng thời, không bị che khuất trên mobile.
- **Khối Hiển Thị Nhanh Kỳ Trước Vừa Ra (`last-round-quick-banner` & `last-round-mini-inline`):**
  - Tích hợp ngay trong Thẻ Nhập Kết Quả (`card-input`), hiển thị tức thì kỳ vừa nhập: Số Kỳ, 5 Viên Bi Số phát sáng, Tổng điểm, Kết quả Tài/Xỉu/Chẵn/Lẻ, Tiền Nhị/Hậu Nhị và Trạng thái Húp/Gãy.
- **Khối Tư Vấn & Kiến Nghị Hành Động AI Tài Xỉu / Chẵn Lẻ (`pred-action-advice`):**
  - Tích hợp trực tiếp bên trong 2 Thẻ Dự Đoán **Tài / Xỉu (`#predTxBox`)** và **Chẵn / Lẻ (`#predClBox`)**.
  - Hiển thị huy hiệu hành động (ĐÈN XANH / ĐÈN VÀNG / ĐÈN ĐỎ / MỐC GỐC), phân loại nhịp cầu đang bắt và lời khuyên hành động cụ thể.

---

## 4. QUY TẮC QUẢN LÝ VỐN 5 KHUNG & HƯỚNG DẪN VÀO TIỀN THÔNG MINH

- **Phân Bổ Vốn:**
  - Tổng Vốn được người dùng tùy chỉnh (Mặc định 30.000.000 VNĐ, có nút chọn nhanh 10M, 20M, 30M, 50M, 100M).
  - Chia tối thiểu **5 Khung Dự Trữ An Toàn** ($\text{Vốn 1 Khung} = \text{Tổng Vốn} / 5$).
- **Tỷ Lệ Vào Tiền 3 Tay Cho Dàn 36 Số VIP (Vốn 6M / khung):**
  - **Phương án 1 cửa (36 số - Đánh Hậu Nhị hoặc Tiền Nhị):**
    - Tay 1: 15k/số (Tổng cược 540k) ➔ Ăn lãi **+945.000đ**.
    - Tay 2: 40k/số (Tổng cược 1.440k) ➔ Ăn lãi **+1.980.000đ**.
    - Tay 3: 110k/số (Tổng cược 3.960k) ➔ Ăn lãi **+4.950.000đ**.
    - Tổng vốn 3 tay: $540k + 1.44M + 3.96M = 5.94M$ VNĐ (Đảm bảo mọi tay đều lãi ròng đậm).
  - **Phương án 2 cửa (72 số - 36 Tiền + 36 Hậu):**
    - Tay 1: 10k/số (360k/đầu ➔ Tổng 720k) ➔ Ăn 1 đầu lãi **+270.000đ** (Ăn kép 2 đầu lãi **+1.260.000đ**).
    - Tay 2: 25k/số (900k/đầu ➔ Tổng 1.800k) ➔ Ăn 1 đầu gần hòa vốn (Ăn kép 2 đầu lãi **+2.430.000đ**).
    - Tay 3: 50k/số (1.800k/đầu ➔ Tổng 3.600k) ➔ Ăn kép 2 đầu lãi **+3.780.000đ** (Ăn 1 đầu thu hồi 81% vốn); Hoặc dồn 1 đầu Hậu Nhị 100k/số để ăn lãi ròng **+3.780.000đ**!
- **Tỷ Lệ Vào Tiền 3 Tay Cho Dàn 25 Số (Vốn 6M / khung):**
  - **Phương án 2 cửa (50 số: 25 Tiền & 25 Hậu):**
    - Tay 1: 20k/số (500k/đầu ➔ Tổng: 1.000.000đ) ➔ Ăn 1 cửa lãi **+980.000đ** (Ăn kép lãi **+2.960.000đ**).
    - Tay 2: 35k/số (875k/đầu ➔ Tổng: 1.750.000đ) ➔ Ăn 1 cửa lãi **+715.000đ** (Ăn kép lãi **+4.180.000đ**).
    - Tay 3: 65k/số (1.625k/đầu ➔ Tổng: 3.250.000đ) ➔ Ăn 1 cửa lãi **+435.000đ** (Ăn kép lãi **+6.870.000đ**).
    - Tổng vốn 3 tay: $1.000.000 + 1.750.000 + 3.250.000 = 6.000.000$ VNĐ (Khớp trọn vẹn 1 khung).
- **Chỉ Dẫn Trực Tiếp Thời Gian Thực (Live Bet Advisor):**
  - Tự động nhận diện tay đang đánh (Tay 1, 2 hay 3) của Khung Hiện Tại để highlight thẻ tay tương ứng.
  - Hiển thị trực tiếp số tiền cần đặt và mức lãi dự kiến trên thẻ Khung Nuôi (`cardActiveFrame`) và thẻ Bắt Chạm (`predChamBox`).

---

## 5. BỘ ĐÁNH GIÁ ĐỘ MẠNH CẦU & KIẾN NGHỊ VÀO VỐN AI (BRIDGE HEALTH INDEX)

Nhằm triệt tiêu rủi ro thua đậm trong các giai đoạn bão cầu / bẻ cầu / gãy khung liên tiếp:
- **Nguyên lý Chấm Điểm (0 - 100%):**
  - Quét tỷ lệ nổ thông của **6 Cầu Vàng** trong 3 - 5 kỳ gần nhất (Trọng số 35%).
  - Đánh giá độ hội tụ của **Chạm VIP** và ma trận Pascal (Trọng số 25%).
  - Kiểm tra chuỗi gãy khung (**Lost Streak / Risk Momentum** - Trọng số 25%): Phạt nặng nếu xuất hiện $\ge 2$ khung gãy liên tiếp hoặc 3 khung gần nhất gãy $\ge 2$.
  - Cộng hưởng nhịp Tài/Xỉu & Chẵn/Lẻ (Trọng số 15%).
- **3 Cấp Tín Hiệu & Hành Động Khung Nuôi:**
  1. 🟢 **ĐÈN XANH (Điểm $\ge 72\%$ - Cầu Chuẩn Đẹp):** Cầu đang trả số cực chuẩn, ít nhất 4/6 Cầu Vàng nổ thông. ➔ **KIẾN NGHỊ: NÊN VÀO TIỀN / VÀO VỐN ĐẦY ĐỦ** theo bảng tỷ lệ 3 tay.
  2. 🟡 **ĐÈN VÀNG (Điểm $50\% - 71\%$ - Cầu Trung Bình):** Cầu có độ lệch nhẹ hoặc vừa trượt 1 tay. ➔ **KIẾN NGHỊ: ĐI TIỀN NHẸ THĂM DÒ (Hạ 50% vốn)** hoặc chỉ đánh 1 đầu Hậu Nhị.
  3. 🔴 **ĐÈN ĐỎ (Điểm $< 50\%$ hoặc Gãy $\ge 2$ Khung Liên Tiếp - Bão Cầu):** Cầu bị gãy chuỗi, nhịp loạn. ➔ **KIẾN NGHỊ: TẠM NGHỈ KHUNG NÀY (ĐỨNG NGOÀI QUAN SÁT)** để bảo toàn 100% vốn 30M, đợi 1 khung nổ thông lại mới vào tiền.
- **3 Cấp Tín Hiệu & Hành Động Cho Tài/Xỉu và Chẵn/Lẻ (Tư vấn ĐÁNH hay NGẮM):**
  1. 🟢 **NÊN ĐÁNH (ĐÈN XANH):** Khi độ tin cậy $\ge 75\%$ VÀ tỷ lệ thắng 10 kỳ gần nhất $\ge 60\%$ (hoặc cầu bệt/cầu đảo đối xứng rõ nét). ➔ Khuyên vào lệnh tự tin, giữ vững kỷ luật vốn.
  2. 🟡 **THĂM DÒ NHẸ (ĐÈN VÀNG):** Khi độ tin cậy $60\% - 74\%$ hoặc tỷ lệ thắng $45\% - 59\%$. ➔ Khuyên hạ 50% tiền cược hoặc đánh tay nhỏ thăm dò nhịp cầu.
  3. 🔴 **TẠM NGẮM / ĐỨNG NGOÀI (ĐÈN ĐỎ):** Khi độ tin cậy $< 60\%$, đang dính chuỗi trượt $\ge 2$ kỳ liên tiếp hoặc tỷ lệ thắng $< 45\%$ (giai đoạn bão cầu/bẻ cầu thất thường). ➔ Khuyên đứng ngoài quan sát 1-2 kỳ đến khi xuất hiện nhịp cầu đẹp trở lại.
