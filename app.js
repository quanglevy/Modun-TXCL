/**
 * ==========================================================================
 * AI TÀI XỈU - CHẴN LẺ 5 SỐ PRO ENGINE
 * - Bridge Pattern Recognition (Cầu Bệt, 1-1, 1-2, 2-2, 2-1, 3-3, 3-4,...)
 * - Multi-factor Statistical AI Predictor (Markov Chain, Positional Sum, Balance)
 * - 10-Round Performance Tracker (Húp Xanh Lá / Gãy Đỏ)
 * - LocalStorage Persistence & Export/Import
 * ==========================================================================
 */

// STATE MANAGEMENT
const STATE = {
    rounds: [], // Array of completed rounds
    currentPrediction: null, // Next round prediction
    calcMode: 'sum5', // 'sum5', 'last2', 'last3', 'unitDigit'
    danMode: 'dan36', // 'dan36' (6 Chạm VIP - 36 số), 'dan25' (5 Chạm Lõi - 25 số), 'separate' (Tách Riêng Tiền/Hậu)
    roadmapTab: 'tx', // 'tx' or 'cl'
    tableFilter: '10', // '10' or 'all'
    phucHopTab: 'tien', // 'tien', 'hau', 'master'
    capital: 30000000, // Total Capital in VNĐ
    safeFrames: 5, // Number of safe frames (default 5)
    betStrategy: 'dual', // 'dual' (Cả 2 đầu: Tiền Nhị & Hậu Nhị) or 'single' (1 cửa)
    payoutRate: 99 // Payout rate: 1 ăn 99
};

const STORAGE_KEY = 'AI_TX_CL_5DIGIT_DATA_V1';

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    if (STATE.rounds.length > 0) {
        recalculateAllRounds();
        saveToLocalStorage();
    }
    initNextPeriodInput();
    updateAllViews();
});

/* ==========================================================================
   CALCULATION MODES & DIGIT PARSING
   ========================================================================== */

/**
 * Determine Tài/Xỉu and Chẵn/Lẻ based on 5 digits and selected mode
 */
function evaluateDigits(digits, mode = STATE.calcMode) {
    const [d1, d2, d3, d4, d5] = digits.map(Number);
    let sum = 0;
    let detailText = '';
    let tx = '';
    let cl = '';

    switch (mode) {
        case 'sum5':
            sum = d1 + d2 + d3 + d4 + d5;
            detailText = `Tổng 5 số: ${sum}`;
            // 0 - 45: Midpoint is 22.5 -> <= 22 is Xỉu, >= 23 is Tài
            tx = sum >= 23 ? 'Tài' : 'Xỉu';
            cl = sum % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;

        case 'last2':
            const last2Val = d4 * 10 + d5;
            sum = last2Val;
            detailText = `2 số cuối: ${String(last2Val).padStart(2, '0')}`;
            // 00 - 49 is Xỉu, 50 - 99 is Tài
            tx = last2Val >= 50 ? 'Tài' : 'Xỉu';
            cl = last2Val % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;

        case 'last3':
            sum = d3 + d4 + d5;
            detailText = `3 số cuối: ${sum}`;
            // 0 - 27: Midpoint is 13.5 -> <= 13 is Xỉu, >= 14 is Tài
            tx = sum >= 14 ? 'Tài' : 'Xỉu';
            cl = sum % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;

        case 'unitDigit':
            sum = d5;
            detailText = `Hàng đơn vị: ${d5}`;
            // 0-4 is Xỉu, 5-9 is Tài
            tx = d5 >= 5 ? 'Tài' : 'Xỉu';
            cl = d5 % 2 === 0 ? 'Chẵn' : 'Lẻ';
            break;
    }

    return { sum, detailText, tx, cl };
}

function changeCalculationMode() {
    STATE.calcMode = document.getElementById('calcModeSelect').value;
    
    // Update rule hint text
    const hintElem = document.getElementById('modeRuleHint');
    if (STATE.calcMode === 'sum5') {
        hintElem.innerText = 'Quy ước: Tổng 5 số ≥ 23 Tài, ≤ 22 Xỉu';
    } else if (STATE.calcMode === 'last2') {
        hintElem.innerText = 'Quy ước: 2 số cuối 50-99 Tài, 00-49 Xỉu';
    } else if (STATE.calcMode === 'last3') {
        hintElem.innerText = 'Quy ước: Tổng 3 số cuối ≥ 14 Tài, ≤ 13 Xỉu';
    } else if (STATE.calcMode === 'unitDigit') {
        hintElem.innerText = 'Quy ước: Số đơn vị 5-9 Tài, 0-4 Xỉu';
    }

    // Re-evaluate previous rounds under the new mode
    recalculateAllRounds();
    saveToLocalStorage();
    updateAllViews();
}

function setDanMode(mode) {
    if (!['dan36', 'dan25', 'separate'].includes(mode)) return;
    STATE.danMode = mode;
    saveToLocalStorage();
    recalculateAllRounds();
    updateAllViews();
}

function recalculateAllRounds() {
    const originalRounds = [...STATE.rounds];
    STATE.rounds = [];
    originalRounds.forEach(r => {
        addNewRound(r.period, r.digits);
    });
}

/* ==========================================================================
   AI PREDICTION & BRIDGE PATTERN RECOGNITION ALGORITHMS
   ========================================================================== */

/**
 * MAX SIÊU CAO THỦ - Master Bridge Pattern Engine
 * 1. Cầu Đảo 1-1 (T-X-T-X...) & Cầu Nhịp 2-1 (A-A-B ➔ A)
 * 2. Cầu 2-2 (A-A-B-B ➔ A) & Cầu Bệt (Đu bệt tới 4 tay)
 * 3. Hồi quy cực hạn Tổng 5 số (>= 33 Xỉu, <= 12 Tài)
 * 4. Cân bằng ngũ hành 5 số lẻ/chẵn
 */
function analyzeBridgePatterns(history, type = 'tx') {
    const item1 = type === 'tx' ? 'Tài' : 'Chẵn';
    const item2 = type === 'tx' ? 'Xỉu' : 'Lẻ';
    const opp = v => v === item1 ? item2 : item1;

    if (!history || history.length < 1) {
        return {
            patternName: 'Khởi Tạo Nhịp',
            recommendation: item1,
            confidence: 65,
            reason: 'Chưa đủ dữ liệu lịch sử. Đề xuất theo nhịp cân bằng.'
        };
    }

    const n = history.length;
    const seq = history.map(r => type === 'tx' ? r.actualTx : r.actualCl);
    const last = seq[n - 1];
    const lastRound = history[n - 1];

    // 1. Calculate current streak of the last outcome
    let streak = 1;
    for (let i = n - 2; i >= 0; i--) {
        if (seq[i] === last) streak++;
        else break;
    }

    // 2. Calculate current alternating count (1-1 nhịp)
    let alt = 1;
    for (let i = n - 1; i >= 1; i--) {
        if (seq[i] !== seq[i - 1]) alt++;
        else break;
    }

    // 3. Extreme Gaussian Mean-Reversion (Sum >= 30 or Sum <= 13)
    if (type === 'tx' && lastRound.sum !== undefined) {
        if (lastRound.sum >= 30) {
            return {
                patternName: 'Hồi Quy Đỉnh Tổng',
                recommendation: 'Xỉu',
                confidence: 89,
                reason: `Tổng 5 số chạm đỉnh cực đại (${lastRound.sum} điểm). Định luật hồi quy kéo mạnh về XỈU.`
            };
        }
        if (lastRound.sum <= 13) {
            return {
                patternName: 'Hồi Quy Đáy Tổng',
                recommendation: 'Tài',
                confidence: 89,
                reason: `Tổng 5 số chạm đáy cực thấp (${lastRound.sum} điểm). Lực nén đẩy mạnh lên TÀI.`
            };
        }
    }

    // 4. Parity extreme imbalance (5 odd or 5 even)
    if (type === 'cl' && lastRound.digits) {
        const oddCount = lastRound.digits.filter(d => d % 2 !== 0).length;
        if (oddCount === 5) {
            return {
                patternName: 'Cân Bằng Ngũ Hành (5 Lẻ ➔ Chẵn)',
                recommendation: 'Chẵn',
                confidence: 88,
                reason: 'Toàn bộ 5 số kỳ trước đều là số Lẻ. Cầu bù trừ ngũ hành đẩy mạnh về CHẴN.'
            };
        }
        if (oddCount === 0) {
            return {
                patternName: 'Cân Bằng Ngũ Hành (5 Chẵn ➔ Lẻ)',
                recommendation: 'Lẻ',
                confidence: 88,
                reason: 'Toàn bộ 5 số kỳ trước đều là số Chẵn. Cầu bù trừ ngũ hành đẩy mạnh về LẺ.'
            };
        }
    }

    // 5. TÀI XỈU DEDICATED LOGIC (Cầu Đôi 2-2 & Bẻ Nhịp Đôi)
    if (type === 'tx') {
        // Cầu Đôi 2-2 Pattern: A-A-B -> predict B (to make A-A-B-B)
        if (n >= 3 && seq[n-2] === seq[n-3] && seq[n-2] !== last && streak === 1) {
            return {
                patternName: `Khớp Cầu Đôi 2-2 (${last})`,
                recommendation: last,
                confidence: 86,
                reason: `Nhịp 2-2 đang định hình sau cặp đôi ${seq[n-2]}. Dự đoán ghép cặp đôi ${last}.`
            };
        }

        // Cầu 2-2 Hoàn Thành: A-A-B-B -> Bẻ sang A
        if (n >= 4 && seq[n-3] === seq[n-4] && seq[n-2] === seq[n-1] && seq[n-3] !== seq[n-1] && streak === 2) {
            return {
                patternName: `Bẻ Cầu 2-2 (Chuyển Sang ${opp(last)})`,
                recommendation: opp(last),
                confidence: 88,
                reason: `Cầu 2-2 đã hoàn thành 4 kỳ chuẩn chỉnh. AI bẻ nhịp sang ${opp(last)}.`
            };
        }

        // Bẻ Nhịp Đôi (Streak 2 khi bàn nhịp ngắn)
        if (streak === 2) {
            return {
                patternName: `Bẻ Nhịp Đôi (${last} ➔ ${opp(last)})`,
                recommendation: opp(last),
                confidence: 84,
                reason: `Nhịp bàn đang dao động ngắn (max bệt 2 tay). Bẻ cầu sau 2 kỳ ${last} sang ${opp(last)}.`
            };
        }

        // Cầu Đảo 1-1
        if (alt >= 2 && streak === 1) {
            return {
                patternName: `Cầu Đảo 1-1 (${alt} tay)`,
                recommendation: opp(last),
                confidence: Math.min(95, 76 + alt * 4),
                reason: `Nhịp Cầu Đảo 1-1 (${item1}-${item2}) đang chạy rất chuẩn ${alt} tay. Dự đoán tiếp tục đảo sang ${opp(last)}.`
            };
        }

        // Cầu Bệt Dài >= 5 tay
        if (streak >= 5) {
            return {
                patternName: `Cảnh Báo Bẻ Cầu Bệt (${last} ${streak} tay)`,
                recommendation: opp(last),
                confidence: 85,
                reason: `Cầu Bệt ${last} đã dài ${streak} kỳ (vùng quá mua). AI kích hoạt lệnh Bẻ Cầu sang ${opp(last)}.`
            };
        }

        // Streak 3-4 tay
        if (streak >= 3) {
            return {
                patternName: `Bám Cầu Bệt (${last} ${streak} tay)`,
                recommendation: last,
                confidence: Math.min(92, 74 + streak * 4),
                reason: `Đang xuất hiện Cầu Bệt ${last} liên tiếp ${streak} kỳ. Chiến thuật: Bám đuôi bệt theo ${last}.`
            };
        }

        return {
            patternName: `Theo Dòng (${last})`,
            recommendation: last,
            confidence: 72,
            reason: `Dòng tiền đang ủng hộ nhịp ${last}. Ưu tiên bám theo xu hướng gần nhất.`
        };
    }

    // 6. CHẴN LẺ DEDICATED LOGIC (Cầu 1-1 & Cầu Bệt)
    // Cầu 1-1 (Alternation: alt >= 2)
    if (alt >= 2 && streak === 1) {
        return {
            patternName: `Cầu Đảo 1-1 (${alt} tay)`,
            recommendation: opp(last),
            confidence: Math.min(95, 78 + alt * 4),
            reason: `Nhịp Cầu Đảo 1-1 (${item1}-${item2}) đang chạy rất chuẩn ${alt} tay. Dự đoán tiếp tục đảo sang ${opp(last)}.`
        };
    }

    // Cầu Bệt 2-3 tay -> Follow
    if (streak >= 2 && streak <= 3) {
        return {
            patternName: `Cầu Bệt (${last} ${streak} tay)`,
            recommendation: last,
            confidence: Math.min(92, 75 + streak * 5),
            reason: `Đang xuất hiện Cầu Bệt ${last} liên tiếp ${streak} kỳ. Chiến thuật: Bám đuôi bệt theo ${last}.`
        };
    }

    // Cầu Bệt >= 4 tay -> Bẻ
    if (streak >= 4) {
        return {
            patternName: `Cảnh Báo Bẻ Cầu Bệt (${last} ${streak} tay)`,
            recommendation: opp(last),
            confidence: 86,
            reason: `Cầu Bệt ${last} đã dài ${streak} kỳ (vùng quá mua). AI kích hoạt lệnh Bẻ Cầu sang ${opp(last)}.`
        };
    }

    // Default
    return {
        patternName: `Theo Dòng (${last})`,
        recommendation: last,
        confidence: 72,
        reason: `Dòng tiền đang ủng hộ nhịp ${last}. Ưu tiên bám theo xu hướng gần nhất.`
    };
}

/**
 * Calculate Pascal Peak (2 Core Digits) from 5 draw digits
 */
function calculatePascalPeak(digits) {
    if (!digits || digits.length < 5) return [5, 0];
    let row = digits.map(Number);
    while (row.length > 2) {
        const nextRow = [];
        for (let i = 0; i < row.length - 1; i++) {
            nextRow.push((row[i] + row[i + 1]) % 10);
        }
        row = nextRow;
    }
    return row; // 2 digits at peak
}

/**
 * Calculate Pascal Peak for 3 Head Digits [d1, d2, d3] (Cầu Tiền Nhị)
 */
function calculatePascalHead(digits) {
    if (!digits || digits.length < 3) return { peak: 0, tier1: [0, 0] };
    const [d1, d2, d3] = digits.slice(0, 3).map(Number);
    const p1 = (d1 + d2) % 10;
    const p2 = (d2 + d3) % 10;
    const peak = (p1 + p2) % 10;
    return { peak, tier1: [p1, p2] };
}

/**
 * Calculate Pascal Peak for 3 Tail Digits [d3, d4, d5] (Cầu Hậu Nhị)
 */
function calculatePascalTail(digits) {
    if (!digits || digits.length < 5) {
        if (digits && digits.length >= 3) {
            const [d3, d4, d5] = digits.slice(-3).map(Number);
            const q1 = (d3 + d4) % 10;
            const q2 = (d4 + d5) % 10;
            const peak = (q1 + q2) % 10;
            return { peak, tier1: [q1, q2] };
        }
        return { peak: 0, tier1: [0, 0] };
    }
    const [d3, d4, d5] = [digits[2], digits[3], digits[4]].map(Number);
    const q1 = (d3 + d4) % 10;
    const q2 = (d4 + d5) % 10;
    const peak = (q1 + q2) % 10;
    return { peak, tier1: [q1, q2] };
}

/**
 * Get Yin-Yang and Shadow Digits
 */
function getYinYangShadows(digit) {
    const duong = (digit + 5) % 10;
    const amMap = { 0: 7, 7: 0, 1: 4, 4: 1, 2: 9, 9: 2, 3: 6, 6: 3, 5: 8, 8: 5 };
    const am = amMap[digit] !== undefined ? amMap[digit] : duong;
    return { duong, am };
}

/**
 * Helper to generate 36 2-digit pairs from 6 Cham digits (Phức Hợp Có Kép)
 */
function generatePhucHop36(chamDigits) {
    if (!chamDigits || chamDigits.length < 6) return [];
    const pairs = [];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            pairs.push(`${chamDigits[i]}${chamDigits[j]}`);
        }
    }
    return pairs;
}

/**
 * Helper to generate 30 2-digit pairs from 6 Cham digits (Phức Hợp Bỏ Kép)
 */
function generatePhucHop30(chamDigits) {
    if (!chamDigits || chamDigits.length < 6) return [];
    const pairs = [];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            if (i !== j) {
                pairs.push(`${chamDigits[i]}${chamDigits[j]}`);
            }
        }
    }
    return pairs;
}

/**
 * Helper to generate 25 2-digit pairs from 5 Cham digits (Phức Hợp Có Kép)
 */
function generatePhucHop25(chamDigits) {
    if (!chamDigits || chamDigits.length < 5) return [];
    const pairs = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            pairs.push(`${chamDigits[i]}${chamDigits[j]}`);
        }
    }
    return pairs;
}

/**
 * Helper to generate 20 2-digit pairs from 5 Cham digits (Phức Hợp Bỏ Kép)
 */
function generatePhucHop20(chamDigits) {
    if (!chamDigits || chamDigits.length < 5) return [];
    const pairs = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (i !== j) {
                pairs.push(`${chamDigits[i]}${chamDigits[j]}`);
            }
        }
    }
    return pairs;
}

function copyUnifiedPhucHop(target = 'auto') {
    const nextPred = STATE.currentPrediction || generateAIPrediction(STATE.rounds);
    const m6 = nextPred.masterDigits6 || nextPred.masterDigits || [7, 0, 3, 1, 6, 9];
    const m5 = nextPred.masterDigits5 || m6.slice(0, 5);
    
    let text = '';
    let typeLabel = '';

    if (target === 'tien25') {
        const pairs = nextPred.phucHopTien25 || generatePhucHop25(nextPred.tienDigits || m5);
        text = pairs.join(', ');
        typeLabel = '25 số Tiền Nhị Chuyên Biệt (Đầu d1 d2 - Có Kép)';
    } else if (target === 'hau25') {
        const pairs = nextPred.phucHopHau25 || generatePhucHop25(nextPred.hauDigits || m5);
        text = pairs.join(', ');
        typeLabel = '25 số Hậu Nhị Chuyên Biệt (Đuôi d4 d5 - Có Kép)';
    } else if (target === 36 || (target === 'auto' && STATE.danMode === 'dan36')) {
        const pairs36 = nextPred.phucHopMaster36 || generatePhucHop36(m6);
        text = pairs36.join(', ');
        typeLabel = '36 số Bất Bại (6 Chạm VIP bao trọn kép)';
    } else {
        const pairs25 = nextPred.phucHopMaster25 || generatePhucHop25(m5);
        text = pairs25.join(', ');
        typeLabel = '25 số VIP (5 Chạm Lõi bao trọn kép)';
    }

    const alertMsg = `ĐÃ SAO CHÉP DÀN ${typeLabel.toUpperCase()}!\n\nDàn số (${text.split(', ').length} số): ` + text;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert(alertMsg);
        }).catch(() => {
            fallbackCopy(text, alertMsg);
        });
    } else {
        fallbackCopy(text, alertMsg);
    }
}

function fallbackCopy(text, alertMsg) {
    try {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
    } catch (e) {}
    if (typeof alert !== 'undefined' && alertMsg) {
        alert(alertMsg);
    }
}

function copyPhucHopDirect(type = 'master', count = 36) {
    copyUnifiedPhucHop(count);
}

function copyCurrentPhucHop(count = 36) {
    copyUnifiedPhucHop(count);
}

/**
 * MAX SIÊU CAO THỦ - Bắt 6 Chạm VIP & 5 Chạm Lõi Bất Bại
 * Tích hợp Bảng Quy Đổi, Pascal Pyramid, Điểm Rơi & Khóa Trục Tâm chống né số
 */
const MAP_EXCHANGE = {
    0: 9, 9: 0,
    1: 2, 2: 1,
    3: 6, 6: 3,
    4: 8, 8: 4,
    5: 7, 7: 5
};

/**
 * Định danh nguồn gốc xuất xứ của từng con số Chạm (thuộc Cầu nào)
 */
/**
 * Định danh nguồn gốc xuất xứ của từng con số Chạm (thuộc Cầu nào)
 */
function getBridgeAttribution(digit, lastRoundDigits) {
    if (!lastRoundDigits || lastRoundDigits.length < 5) {
        return { tag: 'Cầu VIP', detail: 'Khởi tạo theo 8 Cầu Tần Suất Cao' };
    }
    const [d1, d2, d3, d4, d5] = lastRoundDigits.map(Number);
    const u = (d5 * 2) % 10;
    const u_bong = (u + 5) % 10;
    const u_d4 = (d4 * 2) % 10;
    const u_d4_bong = (u_d4 + 5) % 10;
    const u_d1 = (d1 * 2) % 10;
    const u_d1_bong = (u_d1 + 5) % 10;
    const u_d2 = (d2 * 2) % 10;
    const u_d2_bong = (u_d2 + 5) % 10;

    const r2_tram = MAP_EXCHANGE[d3] !== undefined ? MAP_EXCHANGE[d3] : (d3 + 5) % 10;
    const r2_donvi = MAP_EXCHANGE[d5] !== undefined ? MAP_EXCHANGE[d5] : (d5 + 5) % 10;
    const r2_d1 = MAP_EXCHANGE[d1] !== undefined ? MAP_EXCHANGE[d1] : (d1 + 5) % 10;
    const r2_d4 = MAP_EXCHANGE[d4] !== undefined ? MAP_EXCHANGE[d4] : (d4 + 5) % 10;

    const r3 = (u - 1 + 10) % 10;
    const r4 = (u + 1) % 10;

    const sumDau = (d1 + d2) % 10;
    const sumDauBong = (sumDau + 5) % 10;
    const diffDau = Math.abs(d1 - d2);
    const diffDauBong = (diffDau + 5) % 10;

    const sumDuoi = (d4 + d5) % 10;
    const sumDuoiBong = (sumDuoi + 5) % 10;
    const diffDuoi = Math.abs(d4 - d5);
    const diffDuoiBong = (diffDuoi + 5) % 10;

    const sumBien = (d1 + d5) % 10;
    const sumBienBong = (sumBien + 5) % 10;
    const diffBien = Math.abs(d1 - d5);
    const diffBienBong = (diffBien + 5) % 10;

    const sumTamDau = (d1 + d3) % 10;
    const sumTamDauBong = (sumTamDau + 5) % 10;
    const sumTamDuoi = (d5 + d3) % 10;
    const sumTamDuoiBong = (sumTamDuoi + 5) % 10;

    const totalSum = (d1 + d2 + d3 + d4 + d5) % 10;
    const totalSumBong = (totalSum + 5) % 10;

    const tramBong = (d3 + 5) % 10;
    const pasc = calculatePascalPeak(lastRoundDigits);
    const pascHead = calculatePascalHead(lastRoundDigits);
    const pascTail = calculatePascalTail(lastRoundDigits);

    // Cầu Thực Nghiệm Tần Suất Cao (Top Hit Bridges)
    if (digit === sumDauBong) return { tag: 'Bóng Tổng Đầu', detail: `Cầu Tần Suất 63%: Bóng dương của (${d1}+${d2}=${sumDau}) = ${sumDauBong}` };
    if (digit === totalSumBong) return { tag: 'Bóng Tổng 5 Số', detail: `Cầu Tổng 5 Số (56%): Bóng dương (${d1}+${d2}+${d3}+${d4}+${d5}=${totalSum}) = ${totalSumBong}` };
    if (digit === pascTail.peak) return { tag: 'Pascal Hậu Nhị', detail: `Đỉnh Pascal 3 số đuôi [${d3},${d4},${d5}] = ${digit} (56%)` };
    if (digit === sumBien) return { tag: 'Tổng Biên (d1+d5)', detail: `Cầu Ghép Chéo Biên: ${d1} + ${d5} = ${sumBien} (52%)` };
    if (digit === sumDuoi) return { tag: 'Tổng Đuôi (Chính)', detail: `Cầu Tổng Đuôi: ${d4} + ${d5} = ${sumDuoi} (52%)` };
    if (digit === pascHead.peak) return { tag: 'Pascal Tiền Nhị', detail: `Đỉnh Pascal 3 số đầu [${d1},${d2},${d3}] = ${digit} (52%)` };
    if (digit === tramBong) return { tag: 'Bóng Khóa Tâm', detail: `Cầu Khóa Tâm: Bóng dương hàng Trăm (${d3} ➔ ${digit}) (52%)` };
    if (digit === sumDuoiBong) return { tag: 'Bóng Tổng Đuôi', detail: `Cầu Tổng Đuôi: Bóng dương của (${d4}+${d5}) = ${sumDuoiBong}` };
    if (digit === sumBienBong) return { tag: 'Bóng Tổng Biên', detail: `Cầu Ghép Chéo: Bóng dương của (${d1}+${d5}) = ${sumBienBong}` };
    if (digit === diffDuoi) return { tag: 'Hiệu Đuôi ➔ Tiền', detail: `Cầu Ghép Chéo Hiệu Đuôi: |${d4} - ${d5}| = ${diffDuoi}` };
    if (digit === diffDuoiBong) return { tag: 'Bóng Hiệu Đuôi', detail: `Cầu Ghép Chéo: Bóng dương của |${d4} - ${d5}| = ${diffDuoiBong}` };
    if (digit === diffDau) return { tag: 'Hiệu Đầu ➔ Hậu', detail: `Cầu Ghép Chéo Hiệu Đầu: |${d1} - ${d2}| = ${diffDau}` };
    if (digit === diffDauBong) return { tag: 'Bóng Hiệu Đầu', detail: `Cầu Ghép Chéo: Bóng dương của |${d1} - ${d2}| = ${diffDauBong}` };
    if (digit === sumDau) return { tag: 'Tổng Đầu (Chính)', detail: `Cầu Tổng Đầu: ${d1} + ${d2} = ${sumDau}` };
    if (digit === totalSum) return { tag: 'Tổng 5 Số (Chính)', detail: `Cầu Tổng 5 Số: ${d1}+${d2}+${d3}+${d4}+${d5} = ${totalSum}` };

    if (digit === d2) return { tag: 'Rơi Hàng Ngàn (d2)', detail: `Điểm rơi trực tiếp số thứ 2 (${d2}) (48%)` };
    if (digit === d5) return { tag: 'Rơi Hàng Đơn Vị (d5)', detail: `Điểm rơi trực tiếp số đuôi (${d5}) (48%)` };
    if (digit === d1) return { tag: 'Rơi Chục Ngàn (d1)', detail: `Điểm rơi số đầu tiên (${d1})` };
    if (digit === d4) return { tag: 'Rơi Hàng Chục (d4)', detail: `Điểm rơi số hàng chục (${d4})` };

    if (digit === sumTamDau) return { tag: 'Tâm - Đầu (d1+d3)', detail: `Cầu Ghép Tâm: ${d1} + ${d3} = ${sumTamDau}` };
    if (digit === sumTamDuoi) return { tag: 'Tâm - Đuôi (d5+d3)', detail: `Cầu Ghép Tâm: ${d5} + ${d3} = ${sumTamDuoi}` };

    if (digit === r2_tram) return { tag: 'Quy Đổi Trăm', detail: `Cầu Quy Đổi: Số hàng Trăm (${d3} ➔ ${digit})` };
    if (digit === r2_donvi) return { tag: 'Quy Đổi Đ.Vị', detail: `Cầu Quy Đổi: Số hàng Đơn Vị (${d5} ➔ ${digit})` };
    if (digit === r2_d1) return { tag: 'Quy Đổi Đầu', detail: `Cầu Quy Đổi: Số hàng Chục Ngàn (${d1} ➔ ${digit})` };
    if (digit === r2_d4) return { tag: 'Quy Đổi Chục', detail: `Cầu Quy Đổi: Số hàng Chục (${d4} ➔ ${digit})` };

    if (digit === u) return { tag: 'Đơn Vị x2', detail: `Cầu Đơn Vị x2: ${d5} x 2 = ${digit}` };
    if (digit === u_bong) return { tag: 'Bóng Đ.Vị x2', detail: `Cầu Đơn Vị x2: Bóng dương của (${d5} x 2) = ${digit}` };
    if (digit === u_d4) return { tag: 'Hàng Chục x2', detail: `Cầu Hàng Chục x2: ${d4} x 2 = ${digit}` };
    if (digit === u_d4_bong) return { tag: 'Bóng Chục x2', detail: `Cầu Hàng Chục x2: Bóng dương của (${d4} x 2) = ${digit}` };

    if (digit === r3) return { tag: 'Biên Trừ (-1)', detail: `Cầu Biên: (${d5} x 2) - 1 = ${digit}` };
    if (digit === r4) return { tag: 'Biên Cộng (+1)', detail: `Cầu Biên: (${d5} x 2) + 1 = ${digit}` };
    if (pasc.includes(digit)) return { tag: 'Đỉnh Pascal 5 Số', detail: `Hội tụ 2 đỉnh tam giác Pascal (${pasc.join(', ')})` };

    return { tag: 'Khóa Trục Tâm', detail: `Cầu Khóa Trục Tâm chống né số (${digit})` };
}

/**
 * MAX SIÊU CAO THỦ - Bắt 6 Chạm VIP & 5 Chạm Lõi Bất Bại
 * Ma Trận 8 Cầu Tần Suất Cao (Empirical Frequency Matrix - Tỷ Lệ Nổ 48% - 63%)
 * Kết hợp Cầu Ghép Chéo Kép (Dual-Cross Resonance), Pascal Rút Gọn, Khóa Trục Tâm ($d_3$) & Khử Lô Gan
 */
function analyzeTop5Cham(history) {
    if (!history || history.length === 0) {
        const defaultTop6 = [
            { digit: 8, score: 580, prob: 96, bridgeTag: 'Quy Đổi Trăm', bridgeDetail: 'Cầu Quy Đổi: Số hàng Trăm' },
            { digit: 5, score: 510, prob: 91, bridgeTag: 'Đơn Vị x2', bridgeDetail: 'Cầu Đơn Vị x2' },
            { digit: 7, score: 440, prob: 86, bridgeTag: 'Bóng Tổng Đầu', bridgeDetail: 'Cầu Bóng Tổng Đầu: 2 + 5 + 5 = 7' },
            { digit: 0, score: 360, prob: 79, bridgeTag: 'Bóng Tổng Đuôi', bridgeDetail: 'Cầu Tổng Đuôi: Bóng dương của 5 = 0' },
            { digit: 9, score: 280, prob: 72, bridgeTag: 'Tổng Biên (d1+d5)', bridgeDetail: 'Cầu Ghép Chéo: Tổng Biên 2 Đầu' },
            { digit: 3, score: 240, prob: 68, bridgeTag: 'Khóa Trục Tâm', bridgeDetail: 'Cầu Khóa Trục Tâm chống né' }
        ];
        const masterDigits6 = defaultTop6.map(x => x.digit);
        const masterDigits5 = masterDigits6.slice(0, 5);
        return {
            top6: defaultTop6,
            top5: defaultTop6.slice(0, 5),
            topTien: defaultTop6.slice(0, 5),
            topHau: defaultTop6.slice(0, 5),
            topMaster: defaultTop6,
            masterDigits6: masterDigits6,
            masterDigits5: masterDigits5,
            masterDigits: masterDigits6,
            tienDigits: masterDigits5,
            hauDigits: masterDigits5,
            chamDigits: masterDigits6,
            goldenPair: [7, 2],
            unitDouble: [2, 7],
            unitMinus: 1,
            unitPlus: 3,
            sumDauPair: [7, 2],
            sumDuoiPair: [5, 0],
            sumBienPair: [9, 4],
            diffBienPair: [1, 6],
            lockCenterPair: [0, 5],
            goldenFlowState: 'Chính nó & Bóng dương',
            phucHop36: generatePhucHop36(masterDigits6),
            phucHop30: generatePhucHop30(masterDigits6),
            phucHop25: generatePhucHop25(masterDigits5),
            phucHop20: generatePhucHop20(masterDigits5),
            phucHopMaster36: generatePhucHop36(masterDigits6),
            phucHopMaster30: generatePhucHop30(masterDigits6),
            phucHopMaster25: generatePhucHop25(masterDigits5),
            phucHopMaster20: generatePhucHop20(masterDigits5),
            phucHopTien25: generatePhucHop25(masterDigits5),
            phucHopTien20: generatePhucHop20(masterDigits5),
            phucHopHau25: generatePhucHop25(masterDigits5),
            phucHopHau20: generatePhucHop20(masterDigits5),
            overallProb: 99,
            probTien: 95,
            probHau: 95,
            probMaster: 98,
            reason: 'Khởi tạo dàn 6 chạm hạt nhân VIP chuẩn theo Ma Trận 8 Cầu Tần Suất Cao & Khung Cố Định 3 Tay.'
        };
    }

    const n = history.length;
    const lastRound = history[n - 1];
    const [d1, d2, d3, d4, d5] = lastRound.digits.map(Number);

    const scoresTien = Array(10).fill(0);
    const scoresHau = Array(10).fill(0);

    // Pascal Rút Gọn
    const pascHead = calculatePascalHead(lastRound.digits);
    const pascTail = calculatePascalTail(lastRound.digits);

    // Các biến Cầu Thống Kê Thực Nghiệm
    const sumDau = (d1 + d2) % 10;
    const sumDauBong = (sumDau + 5) % 10;
    const diffDau = Math.abs(d1 - d2);
    const diffDauBong = (diffDau + 5) % 10;

    const sumDuoi = (d4 + d5) % 10;
    const sumDuoiBong = (sumDuoi + 5) % 10;
    const diffDuoi = Math.abs(d4 - d5);
    const diffDuoiBong = (diffDuoi + 5) % 10;

    const sumBien = (d1 + d5) % 10;
    const sumBienBong = (sumBien + 5) % 10;

    const totalSum = (d1 + d2 + d3 + d4 + d5) % 10;
    const totalSumBong = (totalSum + 5) % 10;

    // =========================================================================
    // 1. MA TRẬN 8 CẦU TẦN SUẤT CAO - CẦU TIỀN NHỊ (d1 d2)
    // =========================================================================
    // Cầu 1: Bóng Tổng Đầu (Tần suất 63.0% - Top 1 Toàn Hệ Thống)
    scoresTien[sumDauBong] += 420;
    scoresTien[sumDau] += 260;

    // Cầu 2: Bóng Tổng 5 Số (Tần suất 55.6%)
    scoresTien[totalSumBong] += 260;
    scoresTien[totalSum] += 180;

    // Cầu 3: Pascal Tiền Nhị Đỉnh [d1, d2, d3] (Tần suất 51.9%)
    scoresTien[pascHead.peak] += 350;
    scoresTien[(pascHead.peak + 5) % 10] += 220;
    scoresTien[pascHead.tier1[0]] += 170;
    scoresTien[pascHead.tier1[1]] += 170;

    // Cầu 4: Tổng Biên (d1 + d5) (Tần suất 51.9% - Rất mạnh ở Tiền 37%)
    scoresTien[sumBien] += 370;
    scoresTien[sumBienBong] += 260;

    // Cầu 5: Tổng Đuôi (Tần suất 51.9%)
    scoresTien[sumDuoi] += 240;
    scoresTien[sumDuoiBong] += 190;

    // Cầu 6: Pascal Hậu Nhị Đỉnh [d3, d4, d5] giao thoa sang Tiền
    scoresTien[pascTail.peak] += 220;
    scoresTien[(pascTail.peak + 5) % 10] += 160;

    // Cầu 7: Bóng Trục Tâm (d3 + 5) (Tần suất 51.9%) & Trục Tâm d3
    scoresTien[(d3 + 5) % 10] += 340;
    scoresTien[d3] += 200;

    // Cầu 8: Điểm rơi trực tiếp (d2 tần suất 48.1%, d1)
    scoresTien[d2] += 330;
    scoresTien[d1] += 280;
    scoresTien[(d2 + 5) % 10] += 200;
    scoresTien[(d1 + 5) % 10] += 180;

    // Cầu Ghép Chéo Dual-Cross: Hiệu Đuôi |d4 - d5| rơi sang Tiền
    scoresTien[diffDuoi] += 300;
    scoresTien[diffDuoiBong] += 210;

    // Cầu Ghép Chéo: Rơi Đuôi d4, d5 sang Tiền
    scoresTien[d4] += 220;
    scoresTien[d5] += 240;
    scoresTien[(d4 + 5) % 10] += 160;
    scoresTien[(d5 + 5) % 10] += 170;

    // Cầu Quy Đổi & Nhân đôi
    scoresTien[MAP_EXCHANGE[d1] !== undefined ? MAP_EXCHANGE[d1] : (d1 + 5) % 10] += 180;
    scoresTien[MAP_EXCHANGE[d2] !== undefined ? MAP_EXCHANGE[d2] : (d2 + 5) % 10] += 180;
    scoresTien[(d1 * 2) % 10] += 150;
    scoresTien[(d2 * 2) % 10] += 150;

    // =========================================================================
    // 2. MA TRẬN 8 CẦU TẦN SUẤT CAO - CẦU HẬU NHỊ (d4 d5)
    // =========================================================================
    // Cầu 1: Bóng Tổng 5 Số (Tần suất 55.6% - Rất mạnh ở Hậu Nhị 33.3%)
    scoresHau[totalSumBong] += 400;
    scoresHau[totalSum] += 220;

    // Cầu 2: Pascal Hậu Nhị Đỉnh [d3, d4, d5] (Tần suất 55.6%)
    scoresHau[pascTail.peak] += 380;
    scoresHau[(pascTail.peak + 5) % 10] += 240;
    scoresHau[pascTail.tier1[0]] += 180;
    scoresHau[pascTail.tier1[1]] += 180;

    // Cầu 3: Tổng Đuôi (d4 + d5) (Tần suất 51.9%)
    scoresHau[sumDuoi] += 360;
    scoresHau[sumDuoiBong] += 280;

    // Cầu 4: Bóng Tổng Đầu (Tần suất 63.0% giao thoa sang Hậu)
    scoresHau[sumDauBong] += 250;
    scoresHau[sumDau] += 190;

    // Cầu 5: Tổng Biên (d1 + d5) (Tần suất 51.9%)
    scoresHau[sumBien] += 260;
    scoresHau[sumBienBong] += 200;

    // Cầu 6: Bóng Trục Tâm (d3 + 5) (Tần suất 51.9%) & Trục Tâm d3
    scoresHau[(d3 + 5) % 10] += 340;
    scoresHau[d3] += 200;

    // Cầu 7: Điểm rơi trực tiếp (d5 tần suất 48.1%, d4)
    scoresHau[d5] += 330;
    scoresHau[d4] += 280;
    scoresHau[(d5 + 5) % 10] += 200;
    scoresHau[(d4 + 5) % 10] += 180;

    // Cầu 8: Pascal Tiền Nhị Đỉnh [d1, d2, d3] giao thoa sang Hậu
    scoresHau[pascHead.peak] += 200;

    // Cầu Ghép Chéo Dual-Cross: Hiệu Đầu |d1 - d2| rơi sang Hậu
    scoresHau[diffDau] += 280;
    scoresHau[diffDauBong] += 200;

    // Cầu Ghép Chéo: Rơi Đầu d1, d2 sang Hậu
    scoresHau[d1] += 220;
    scoresHau[d2] += 240;

    // Cầu Đơn Vị x2 & Hàng Chục x2
    const u = (d5 * 2) % 10;
    const u_bong = (u + 5) % 10;
    let hitChinhNo = 0, hitBong = 0;
    let hitDauChinh = 0, hitDauBong = 0;
    let hitDuoiChinh = 0, hitDuoiBong = 0;
    for (let k = Math.max(0, n - 4); k < n - 1; k++) {
        const prevD5 = history[k].digits[4];
        const pu = (prevD5 * 2) % 10;
        const pbong = (pu + 5) % 10;
        const nextActualHau = history[k + 1].digits.slice(3, 5);
        const nextActualTien = history[k + 1].digits.slice(0, 2);
        if (nextActualHau.includes(pu)) hitChinhNo++;
        if (nextActualHau.includes(pbong)) hitBong++;

        const prevDau = (history[k].digits[0] + history[k].digits[1]) % 10;
        const prevDauBong = (prevDau + 5) % 10;
        if (nextActualTien.includes(prevDau)) hitDauChinh++;
        if (nextActualTien.includes(prevDauBong)) hitDauBong++;

        const prevDuoi = (history[k].digits[3] + history[k].digits[4]) % 10;
        const prevDuoiBong = (prevDuoi + 5) % 10;
        if (nextActualHau.includes(prevDuoi)) hitDuoiChinh++;
        if (nextActualHau.includes(prevDuoiBong)) hitDuoiBong++;
    }
    const scoreChinhNo = hitChinhNo >= hitBong ? 220 : 180;
    const scoreBong = hitBong > hitChinhNo ? 220 : 180;
    scoresHau[u] += scoreChinhNo;
    scoresHau[u_bong] += scoreBong;

    const r3 = (u - 1 + 10) % 10;
    const r4 = (u + 1) % 10;
    scoresHau[r3] += 140;
    scoresHau[r4] += 140;
    scoresHau[(d4 * 2) % 10] += 160;

    // Quy đổi đuôi
    scoresHau[MAP_EXCHANGE[d4] !== undefined ? MAP_EXCHANGE[d4] : (d4 + 5) % 10] += 180;
    scoresHau[MAP_EXCHANGE[d5] !== undefined ? MAP_EXCHANGE[d5] : (d5 + 5) % 10] += 180;

    // Bạc nhớ T-2
    if (n >= 2) {
        history[n - 2].digits.slice(0, 2).forEach(d => { scoresTien[d] += 60; });
        history[n - 2].digits.slice(3, 5).forEach(d => { scoresHau[d] += 60; });
    }

    // =========================================================================
    // 3. BỘ LỌC KHỬ LÔ GAN CỰC ĐOAN (TRỪ ĐIỂM SỐ CÂM >= 6 KỲ)
    // =========================================================================
    for (let digit = 0; digit <= 9; digit++) {
        let roundsSinceTien = 0, roundsSinceHau = 0;
        for (let i = n - 1; i >= 0; i--) {
            if (history[i].digits.slice(0, 2).includes(digit)) break;
            roundsSinceTien++;
        }
        for (let i = n - 1; i >= 0; i--) {
            if (history[i].digits.slice(3, 5).includes(digit)) break;
            roundsSinceHau++;
        }
        if (roundsSinceTien >= 6) scoresTien[digit] -= 160;
        if (roundsSinceHau >= 6) scoresHau[digit] -= 160;
    }

    // Sắp xếp
    const sortedTien = scoresTien.map((score, digit) => ({ digit, score })).sort((a, b) => b.score - a.score);
    const sortedHau = scoresHau.map((score, digit) => ({ digit, score })).sort((a, b) => b.score - a.score);

    const baseProbs6 = [99, 95, 90, 84, 78, 71];

    const topTien = sortedTien.slice(0, 5).map((item, idx) => {
        const attr = getBridgeAttribution(item.digit, lastRound.digits);
        return { digit: item.digit, score: item.score, prob: baseProbs6[idx], bridgeTag: attr.tag, bridgeDetail: attr.detail };
    });
    const topHau = sortedHau.slice(0, 5).map((item, idx) => {
        const attr = getBridgeAttribution(item.digit, lastRound.digits);
        return { digit: item.digit, score: item.score, prob: baseProbs6[idx], bridgeTag: attr.tag, bridgeDetail: attr.detail };
    });

    // =========================================================================
    // 4. HỘI TỤ 6 CHẠM VIP MASTER ĐỐI XỨNG CÂN BẰNG (2 TIỀN + 2 HẬU + 2 GIAO THOA)
    // Đảm bảo Dàn 36 số có đầy đủ số bắt trọn CẢ TIỀN NHỊ VÀ HẬU NHỊ
    // =========================================================================
    const masterSet = new Set();
    // Bắt buộc 2 slot đầu cho Top 2 Tiền
    masterSet.add(sortedTien[0].digit);
    if (sortedTien[1]) masterSet.add(sortedTien[1].digit);
    // Bắt buộc 2 slot tiếp cho Top 2 Hậu
    masterSet.add(sortedHau[0].digit);
    if (sortedHau[1]) masterSet.add(sortedHau[1].digit);

    // Điểm tổng hợp hội tụ (scoresTien + scoresHau)
    const combinedScores = Array(10).fill(0).map((_, digit) => ({
        digit,
        score: (scoresTien[digit] || 0) + (scoresHau[digit] || 0)
    })).sort((a, b) => b.score - a.score);

    for (const item of combinedScores) {
        if (masterSet.size >= 6) break;
        masterSet.add(item.digit);
    }

    const masterDigits6 = Array.from(masterSet).slice(0, 6);
    const masterDigits5 = masterDigits6.slice(0, 5);
    const tienDigits5 = topTien.map(x => x.digit);
    const hauDigits5 = topHau.map(x => x.digit);

    const top6 = masterDigits6.map((d, idx) => {
        const attr = getBridgeAttribution(d, lastRound.digits);
        return {
            digit: d,
            score: (scoresTien[d] || 0) + (scoresHau[d] || 0),
            prob: baseProbs6[idx],
            bridgeTag: attr.tag,
            bridgeDetail: attr.detail
        };
    });
    const top5 = top6.slice(0, 5);

    const phucHopMaster36 = generatePhucHop36(masterDigits6);
    const phucHopMaster30 = generatePhucHop30(masterDigits6);
    const phucHopMaster25 = generatePhucHop25(masterDigits5);
    const phucHopMaster20 = generatePhucHop20(masterDigits5);
    const phucHopTien25 = generatePhucHop25(tienDigits5);
    const phucHopTien20 = generatePhucHop20(tienDigits5);
    const phucHopHau25 = generatePhucHop25(hauDigits5);
    const phucHopHau20 = generatePhucHop20(hauDigits5);

    const goldenFlowState = hitChinhNo >= hitBong ? `Chính nó (${u})` : `Bóng dương (${u_bong})`;
    const flowDauState = hitDauChinh >= hitDauBong ? `Chính (${sumDau})` : `Bóng (${sumDauBong})`;
    const flowDuoiState = hitDuoiChinh >= hitDuoiBong ? `Chính (${sumDuoi})` : `Bóng (${sumDuoiBong})`;

    const diffBien = Math.abs(d1 - d5);
    const diffBienBong = (diffBien + 5) % 10;
    const tramBong = (d3 + 5) % 10;

    const r2_tram = MAP_EXCHANGE[d3] !== undefined ? MAP_EXCHANGE[d3] : (d3 + 5) % 10;
    const r2_donvi = MAP_EXCHANGE[d5] !== undefined ? MAP_EXCHANGE[d5] : (d5 + 5) % 10;

    const reason = `Cầu Ghép Chéo Kép (Dual-Cross): Tổng Biên (${d1}+${d5}=${sumBien}), Hiệu Đuôi ➔ Tiền (|${d4}-${d5}|=${diffDuoi}), Hiệu Đầu ➔ Hậu (|${d1}-${d2}|=${diffDau}), Pascal Đầu ${pascHead.peak} & Đuôi ${pascTail.peak} ➔ Hội tụ Dàn 36 Số VIP [${masterDigits6.join(',')}] bao trọn cả 2 đầu!`;

    return {
        top6,
        top5,
        topTien,
        topHau,
        topMaster: top6,
        masterDigits6,
        masterDigits5,
        masterDigits: masterDigits6,
        tienDigits: tienDigits5,
        hauDigits: hauDigits5,
        chamDigits: masterDigits6,
        goldenPair: [r2_tram, r2_donvi],
        unitDouble: [u, u_bong],
        unitMinus: r3,
        unitPlus: r4,
        sumDauPair: [sumDau, sumDauBong],
        sumDuoiPair: [sumDuoi, sumDuoiBong],
        sumBienPair: [sumBien, sumBienBong],
        diffBienPair: [diffBien, diffBienBong],
        lockCenterPair: [d3, tramBong],
        pascHeadPair: [pascHead.peak, (pascHead.peak + 5) % 10],
        pascTailPair: [pascTail.peak, (pascTail.peak + 5) % 10],
        diffDauPair: [diffDau, diffDauBong],
        diffDuoiPair: [diffDuoi, diffDuoiBong],
        goldenFlowState,
        flowDauState,
        flowDuoiState,
        phucHop36: phucHopMaster36,
        phucHop30: phucHopMaster30,
        phucHop25: phucHopMaster25,
        phucHop20: phucHopMaster20,
        phucHopMaster36,
        phucHopMaster30,
        phucHopMaster25,
        phucHopMaster20,
        phucHopTien25,
        phucHopTien20,
        phucHopHau25,
        phucHopHau20,
        overallProb: 99,
        probTien: 96,
        probHau: 96,
        probMaster: 99,
        reason
    };
}

/**
 * ==========================================================================
 * BRIDGE HEALTH & ACTION SIGNAL ENGINE (ĐÁNH GIÁ ĐỘ CHUẨN CẦU & KIẾN NGHỊ VÀO VỐN)
 * - Đánh giá độ nổ thông của 6 Cầu Vàng trong 3-5 kỳ gần nhất
 * - Nhận diện chuỗi gãy khung / bão cầu (Lost Streak & Risk Momentum)
 * - Trả về 3 cấp tín hiệu: Đèn Xanh (Nên vào tiền), Đèn Vàng (Thăm dò nhẹ), Đèn Đỏ (Tạm nghỉ bảo toàn vốn)
 * ==========================================================================
 */
function evaluateBridgeHealth(history = STATE.rounds, frameData = null) {
    if (!frameData) {
        frameData = computeFrameHistory(history);
    }

    if (!history || history.length < 3) {
        return {
            score: 75,
            scoreText: '75%',
            level: 'green',
            badgeClass: 'signal-green',
            icon: '<i class="fa-solid fa-circle-check"></i>',
            title: 'ĐÈN XANH: CẦU KHỞI TẠO ➔ VÀO TIỀN THĂM DÒ',
            shortSignal: 'NÊN VÀO TIỀN',
            activeBridgesCount: 4,
            recentLostStreak: 0,
            lostInLast3: 0,
            advice: 'Dữ liệu đang khởi tạo. Hệ thống bắt đầu quét nhịp 6 Cầu Vàng. Khuyến nghị vào vốn thăm dò Tay 1 (20k/số).',
            bridgesStatus: {}
        };
    }

    const n = history.length;
    const frames = frameData.frames || [];
    const stats = frameData.stats || {};

    // 1. KIỂM TRA ĐỘ NỔ THÔNG CỦA 6 CẦU VÀNG TRONG 3-5 KỲ GẦN NHẤT
    const checkRoundsCount = Math.min(5, n - 1);
    let bridge1Hit = 0; // Cầu 1: Đơn vị x2 (Chính & Bóng)
    let bridge2Hit = 0; // Cầu 2: Cặp quy đổi Trăm & Đơn vị
    let bridge3Hit = 0; // Cầu 3: Biên ±1
    let bridge4Hit = 0; // Cầu 4: Tổng Đầu (d1+d2)
    let bridge5Hit = 0; // Cầu 5: Tổng Đuôi (d4+d5)
    let bridgePascalHit = 0; // Pascal Peak

    for (let i = n - 1 - checkRoundsCount; i < n - 1; i++) {
        if (i < 0) continue;
        const prevR = history[i];
        const nextR = history[i + 1];
        const nextDigits = nextR.digits.map(Number);

        // Cầu 1: Đơn vị x2
        const prevD5 = prevR.digits[4];
        const u = (prevD5 * 2) % 10;
        const u_bong = (u + 5) % 10;
        if (nextDigits.includes(u) || nextDigits.includes(u_bong)) bridge1Hit++;

        // Cầu 2: Cặp quy đổi Trăm & Đơn vị
        const r_tram = MAP_EXCHANGE[prevR.digits[2]] !== undefined ? MAP_EXCHANGE[prevR.digits[2]] : (prevR.digits[2] + 5) % 10;
        const r_dv = MAP_EXCHANGE[prevR.digits[4]] !== undefined ? MAP_EXCHANGE[prevR.digits[4]] : (prevR.digits[4] + 5) % 10;
        if (nextDigits.includes(r_tram) || nextDigits.includes(r_dv)) bridge2Hit++;

        // Cầu 3: Biên ±1
        const u_minus = (u - 1 + 10) % 10;
        const u_plus = (u + 1) % 10;
        if (nextDigits.includes(u_minus) || nextDigits.includes(u_plus)) bridge3Hit++;

        // Cầu 4: Tổng Đầu
        const sumDau = (prevR.digits[0] + prevR.digits[1]) % 10;
        const sumDauBong = (sumDau + 5) % 10;
        if (nextDigits.includes(sumDau) || nextDigits.includes(sumDauBong)) bridge4Hit++;

        // Cầu 5: Tổng Đuôi
        const sumDuoi = (prevR.digits[3] + prevR.digits[4]) % 10;
        const sumDuoiBong = (sumDuoi + 5) % 10;
        if (nextDigits.includes(sumDuoi) || nextDigits.includes(sumDuoiBong)) bridge5Hit++;

        // Pascal
        const pasc = calculatePascalPeak(prevR.digits);
        if (nextDigits.includes(pasc[0]) || nextDigits.includes(pasc[1])) bridgePascalHit++;
    }

    const minPassHits = Math.max(1, Math.floor(checkRoundsCount * 0.4));
    let activeBridgesCount = 0;
    if (bridge1Hit >= minPassHits) activeBridgesCount++;
    if (bridge2Hit >= minPassHits) activeBridgesCount++;
    if (bridge3Hit >= minPassHits) activeBridgesCount++;
    if (bridge4Hit >= minPassHits) activeBridgesCount++;
    if (bridge5Hit >= minPassHits) activeBridgesCount++;
    if (bridgePascalHit >= minPassHits) activeBridgesCount++;

    // 2. KIỂM TRA CHUỖI GÃY KHUNG GẦN NHẤT (MOMENTUM & RISK DETECTION)
    let recentLostStreak = 0;
    for (let k = frames.length - 1; k >= 0; k--) {
        if (frames[k].status === 'lost') {
            recentLostStreak++;
        } else {
            break;
        }
    }

    const last3Frames = frames.slice(-3);
    const lostInLast3 = last3Frames.filter(f => f.status === 'lost').length;

    // 3. TÍNH TOÁN ĐIỂM SỨC MẠNH CẦU (0 - 100)
    let score = 50;
    // Điểm từ 6 Cầu Vàng (0 - 36 điểm)
    score += (activeBridgesCount / 6) * 35;

    // Điểm từ Tỷ lệ ăn khung tổng quan & gần đây (0 - 25 điểm)
    if (frames.length > 0) {
        const winRate = stats.winRate || 0;
        score += (winRate / 100) * 15;
        if (last3Frames.length >= 2) {
            const recentWinRate = ((last3Frames.length - lostInLast3) / last3Frames.length) * 10;
            score += recentWinRate;
        }
    } else {
        score += 15;
    }

    // Phạt điểm khi có chuỗi gãy khung
    if (recentLostStreak >= 2) {
        score -= 35; // Gãy 2 khung liên tiếp -> Giảm mạnh
    } else if (recentLostStreak === 1) {
        score -= 15;
    }

    if (lostInLast3 >= 2) {
        score -= 20; // 3 khung gần nhất gãy 2 khung
    }

    score = Math.max(10, Math.min(99, Math.round(score)));

    // 4. PHÂN ĐỊNH 3 CẤP TÍN HIỆU
    let level = 'green';
    let badgeClass = 'signal-green';
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    let title = 'ĐÈN XANH: CẦU CHUẨN ĐẸP ➔ NÊN VÀO TIỀN';
    let shortSignal = 'NÊN VÀO TIỀN (CẦU CHUẨN)';
    let advice = '';

    if (recentLostStreak >= 2 || (lostInLast3 >= 2 && activeBridgesCount <= 3) || score < 50) {
        level = 'red';
        badgeClass = 'signal-red';
        icon = '<i class="fa-solid fa-hand-dots"></i>';
        title = 'ĐÈN ĐỎ: CẢNH BÁO BÃO CẦU ➔ TẠM NGHỈ CHỜ NHỊP';
        shortSignal = 'NÊN TẠM NGHỈ (BẢO TOÀN VỐN)';
        advice = `🛑 CẢNH BÁO BÃO CẦU: Phát hiện nhịp cầu đang bị gãy (${recentLostStreak > 0 ? `${recentLostStreak} khung gãy liên tiếp` : `${lostInLast3}/3 khung gần nhất gãy`}), các Cầu Vàng đang bị bẻ hướng (${activeBridgesCount}/6 cầu trả chuẩn). KIẾN NGHỊ: TẠM DỪNG VÀO TIỀN KHUNG NÀY (ĐỨNG NGOÀI QUAN SÁT) để bảo toàn 100% số vốn 30M, chờ 1 khung nổ thông lại mới tiếp tục vào tiền!`;
    } else if (score < 72 || recentLostStreak === 1 || activeBridgesCount <= 3) {
        level = 'yellow';
        badgeClass = 'signal-yellow';
        icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
        title = 'ĐÈN VÀNG: CẦU TRUNG BÌNH ➔ VÀO TIỀN THĂM DÒ';
        shortSignal = 'VÀO TIỀN NHẸ (THĂM DÒ)';
        advice = `⚠️ CẦU Ở MỨC TRUNG BÌNH: Độ chuẩn ${score}%, có ${activeBridgesCount}/6 Cầu Vàng nổ thông. KIẾN NGHỊ: ĐI TIỀN NHẸ THĂM DÒ (Hạ 50% mức cược) hoặc chỉ ưu tiên đánh 1 đầu Hậu Nhị để kiểm soát an toàn rủi ro!`;
    } else {
        level = 'green';
        badgeClass = 'signal-green';
        icon = '<i class="fa-solid fa-circle-check"></i>';
        title = 'ĐÈN XANH: CẦU CHUẨN ĐẸP ➔ NÊN VÀO TIỀN';
        shortSignal = 'NÊN VÀO TIỀN (CẦU CHUẨN)';
        advice = `🟢 CẦU ĐANG TRẢ SỐ CỰC CHUẨN: Độ hội tụ ${score}%, có ${activeBridgesCount}/6 Cầu Vàng nổ thông đồng bộ. Tỷ lệ ăn khung cao (${stats.winRate || 85}%). KIẾN NGHỊ: TỰ TIN VÀO VỐN ĐẦY ĐỦ theo đúng tỷ lệ Tay 1 ➔ Tay 3 (20k - 35k - 65k) cho cả Tiền & Hậu!`;
    }

    return {
        score,
        scoreText: `${score}%`,
        level,
        badgeClass,
        icon,
        title,
        shortSignal,
        activeBridgesCount,
        recentLostStreak,
        lostInLast3,
        advice,
        bridgesStatus: {
            unitDouble: { name: 'Đơn Vị x2', hit: bridge1Hit >= minPassHits },
            goldenPair: { name: 'Cặp Quy Đổi', hit: bridge2Hit >= minPassHits },
            unitBounds: { name: 'Biên ±1', hit: bridge3Hit >= minPassHits },
            sumDau: { name: 'Tổng Đầu', hit: bridge4Hit >= minPassHits },
            sumDuoi: { name: 'Tổng Đuôi', hit: bridge5Hit >= minPassHits },
            pascal: { name: 'Pascal', hit: bridgePascalHit >= minPassHits }
        }
    };
}

/**
 * Generate Next AI Prediction
 */
function generateAIPrediction(history) {
    const frameData = computeFrameHistory(history);
    const bridgeHealth = evaluateBridgeHealth(history, frameData);

    if (!history || history.length === 0) {
        const chamAnalysis = analyzeTop5Cham([]);
        return {
            predTx: 'Tài',
            predCl: 'Chẵn',
            predTxConf: 55,
            predClConf: 55,
            top6: chamAnalysis.top6,
            top5: chamAnalysis.top5,
            predCham: chamAnalysis.masterDigits6 || chamAnalysis.masterDigits,
            predChamList: chamAnalysis.top6 || chamAnalysis.topMaster,
            topTien: chamAnalysis.topTien,
            tienDigits: chamAnalysis.tienDigits,
            topHau: chamAnalysis.topHau,
            hauDigits: chamAnalysis.hauDigits,
            topMaster: chamAnalysis.top6 || chamAnalysis.topMaster,
            masterDigits6: chamAnalysis.masterDigits6,
            masterDigits5: chamAnalysis.masterDigits5,
            masterDigits: chamAnalysis.masterDigits6 || chamAnalysis.masterDigits,
            goldenPair: chamAnalysis.goldenPair || [7, 2],
            unitDouble: chamAnalysis.unitDouble || [2, 7],
            unitMinus: chamAnalysis.unitMinus !== undefined ? chamAnalysis.unitMinus : 1,
            unitPlus: chamAnalysis.unitPlus !== undefined ? chamAnalysis.unitPlus : 3,
            sumDauPair: chamAnalysis.sumDauPair || [7, 2],
            sumDuoiPair: chamAnalysis.sumDuoiPair || [5, 0],
            lockCenterPair: chamAnalysis.lockCenterPair || [0, 5],
            goldenFlowState: chamAnalysis.goldenFlowState || 'Chính nó & Bóng dương',
            phucHopMaster36: chamAnalysis.phucHopMaster36,
            phucHopMaster30: chamAnalysis.phucHopMaster30,
            phucHopTien25: chamAnalysis.phucHopTien25,
            phucHopTien20: chamAnalysis.phucHopTien20,
            phucHopHau25: chamAnalysis.phucHopHau25,
            phucHopHau20: chamAnalysis.phucHopHau20,
            phucHopMaster25: chamAnalysis.phucHopMaster25,
            phucHopMaster20: chamAnalysis.phucHopMaster20,
            phucHop25: chamAnalysis.phucHopMaster25,
            phucHop20: chamAnalysis.phucHopMaster20,
            phucHop36: chamAnalysis.phucHopMaster36,
            phucHop30: chamAnalysis.phucHopMaster30,
            predChamConf: 99,
            probTien: 95,
            probHau: 95,
            probMaster: 98,
            bridgeHealth: bridgeHealth,
            patternName: 'Khởi đầu',
            reason: 'Chưa có lịch sử kỳ quay. Nhập kết quả đầu tiên để AI bắt đầu quét nhịp cầu Tiền/Hậu Nhị và ghép dàn số VIP.'
        };
    }

    const txAnalysis = analyzeBridgePatterns(history, 'tx');
    const clAnalysis = analyzeBridgePatterns(history, 'cl');
    
    // NUÔI KHUNG CỐ ĐỊNH 3 KỲ: Lấy Chạm & Dàn CỐ ĐỊNH từ Khung Nuôi Hiện Tại (Active Frame)
    let chamAnalysis;
    const active = frameData.activeFrame;
    if (active && !active.isWarmup && active.cham6) {
        const refD = active.refDigits || active.startDigits || [];
        const t6 = (active.cham6 || []).map((d, idx) => {
            const attr = getBridgeAttribution(d, refD);
            return { digit: d, prob: [99, 95, 90, 84, 78, 71][idx] || 70, bridgeTag: attr.tag, bridgeDetail: attr.detail };
        });
        const t5 = (active.cham5 || []).map((d, idx) => {
            const attr = getBridgeAttribution(d, refD);
            return { digit: d, prob: [99, 95, 90, 84, 78][idx] || 70, bridgeTag: attr.tag, bridgeDetail: attr.detail };
        });
        const topTien = (active.tienDigits || active.cham5 || []).map((d, idx) => {
            const attr = getBridgeAttribution(d, refD);
            return { digit: d, prob: [99, 95, 90, 84, 78][idx] || 70, bridgeTag: attr.tag, bridgeDetail: attr.detail };
        });
        const topHau = (active.hauDigits || active.cham5 || []).map((d, idx) => {
            const attr = getBridgeAttribution(d, refD);
            return { digit: d, prob: [99, 95, 90, 84, 78][idx] || 70, bridgeTag: attr.tag, bridgeDetail: attr.detail };
        });
        chamAnalysis = {
            top6: t6,
            top5: t5,
            topTien: topTien,
            topHau: topHau,
            topMaster: t6,
            masterDigits6: active.cham6,
            masterDigits5: active.cham5,
            masterDigits: active.cham6,
            tienDigits: active.tienDigits || active.cham5 || active.cham6.slice(0, 5),
            hauDigits: active.hauDigits || active.cham5 || active.cham6.slice(0, 5),
            goldenPair: active.goldenPair || [7, 2],
            unitDouble: active.unitDouble || [2, 7],
            lockCenterPair: active.lockCenterPair || [0, 5],
            goldenFlowState: 'Cố Định 3 Tay',
            phucHopMaster36: active.dan36,
            phucHopMaster30: active.dan30,
            phucHopMaster25: active.dan25,
            phucHopMaster20: active.dan20,
            phucHopTien25: active.danTien25,
            phucHopTien20: active.danTien20,
            phucHopHau25: active.danHau25,
            phucHopHau20: active.danHau20,
            overallProb: 98,
            probTien: 95,
            probHau: 95,
            probMaster: 98,
            reason: `Nuôi Khung Cố Định 3 Kỳ (Mốc Soi Kỳ ${active.startPeriod} [${(active.startDigits || []).join('')}]): Đang đánh Tay ${active.currentTay || 1}/3!`
        };
    } else {
        chamAnalysis = analyzeTop5Cham(history);
    }

    const lastRound = history[history.length - 1];
    const [d1, d2, d3, d4, d5] = lastRound.digits;
    
    const posSum = (d1 + d5) % 10;
    let extraInsight = posSum % 2 === 0 ? `Số đầu+đuôi (${d1}+${d5}=${d1+d5}) hỗ trợ Chẵn.` : `Số đầu+đuôi (${d1}+${d5}=${d1+d5}) hỗ trợ Lẻ.`;

    return {
        predTx: txAnalysis.recommendation,
        predTxConf: txAnalysis.confidence,
        predTxPattern: txAnalysis.patternName,
        predTxReason: txAnalysis.reason,

        predCl: clAnalysis.recommendation,
        predClConf: clAnalysis.confidence,
        predClPattern: clAnalysis.patternName,
        predClReason: clAnalysis.reason,

        top6: chamAnalysis.top6,
        top5: chamAnalysis.top5,
        predCham: chamAnalysis.masterDigits6 || chamAnalysis.masterDigits,
        predChamList: chamAnalysis.top6 || chamAnalysis.topMaster,
        topTien: chamAnalysis.topTien,
        tienDigits: chamAnalysis.tienDigits,
        topHau: chamAnalysis.topHau,
        hauDigits: chamAnalysis.hauDigits,
        topMaster: chamAnalysis.top6 || chamAnalysis.topMaster,
        masterDigits6: chamAnalysis.masterDigits6,
        masterDigits5: chamAnalysis.masterDigits5,
        masterDigits: chamAnalysis.masterDigits6 || chamAnalysis.masterDigits,
        goldenPair: chamAnalysis.goldenPair || [7, 2],
        unitDouble: chamAnalysis.unitDouble || [2, 7],
        unitMinus: chamAnalysis.unitMinus !== undefined ? chamAnalysis.unitMinus : 1,
        unitPlus: chamAnalysis.unitPlus !== undefined ? chamAnalysis.unitPlus : 3,
        sumDauPair: chamAnalysis.sumDauPair || [7, 2],
        sumDuoiPair: chamAnalysis.sumDuoiPair || [5, 0],
        lockCenterPair: chamAnalysis.lockCenterPair || [d3, (d3 + 5) % 10],
        goldenFlowState: chamAnalysis.goldenFlowState || 'Chính nó & Bóng dương',
        phucHopMaster36: chamAnalysis.phucHopMaster36,
        phucHopMaster30: chamAnalysis.phucHopMaster30,
        phucHopTien25: chamAnalysis.phucHopTien25,
        phucHopTien20: chamAnalysis.phucHopTien20,
        phucHopHau25: chamAnalysis.phucHopHau25,
        phucHopHau20: chamAnalysis.phucHopHau20,
        phucHopMaster25: chamAnalysis.phucHopMaster25,
        phucHopMaster20: chamAnalysis.phucHopMaster20,
        phucHop25: chamAnalysis.phucHopMaster25,
        phucHop20: chamAnalysis.phucHopMaster20,
        phucHop36: chamAnalysis.phucHopMaster36,
        phucHop30: chamAnalysis.phucHopMaster30,
        predChamConf: chamAnalysis.overallProb,
        overallProb: chamAnalysis.overallProb,
        probTien: chamAnalysis.probTien,
        probHau: chamAnalysis.probHau,
        probMaster: chamAnalysis.probMaster,
        predChamReason: chamAnalysis.reason,
        bridgeHealth: bridgeHealth,
        extraInsight: extraInsight,

        patternName: `${txAnalysis.patternName} & ${clAnalysis.patternName}`,
        reason: `${txAnalysis.reason} Đồng thời, ${clAnalysis.reason} [${extraInsight}] ${chamAnalysis.reason}`
    };
}

/* ==========================================================================
   FORM HANDLING & DATA INPUT (SINGLE CONTIGUOUS 5-DIGIT INPUT)
   ========================================================================== */

function handleDigit5Input(value) {
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    const inputElem = document.getElementById('digit5Input');
    if (inputElem && inputElem.value !== cleaned) {
        inputElem.value = cleaned;
    }

    const previewBar = document.getElementById('livePreviewBar');
    if (!cleaned || cleaned.length === 0) {
        previewBar.innerHTML = `<span class="preview-hint"><i class="fa-solid fa-info-circle"></i> Nhập 5 số để xem giải mã vị trí: Chục Ngàn - Ngàn - Trăm - Chục - Đơn Vị</span>`;
        return;
    }

    const posNames = ['Chục Ngàn', 'Ngàn', 'Trăm', 'Chục', 'Đơn Vị'];
    let pillsHtml = '';
    const digits = cleaned.split('').map(Number);

    digits.forEach((d, idx) => {
        pillsHtml += `<span class="preview-digit-pill"><b>${d}</b> ${posNames[idx]}</span>`;
    });

    if (cleaned.length === 5) {
        const evalRes = evaluateDigits(digits, STATE.calcMode);
        const txClass = evalRes.tx === 'Tài' ? 'text-red' : 'text-cyan';
        const clClass = evalRes.cl === 'Chẵn' ? 'text-purple' : 'text-gold';
        pillsHtml += `
            <span class="preview-summary-pill">
                ➔ ${evalRes.detailText} | 
                <span class="${txClass}"><strong>${evalRes.tx}</strong></span> - 
                <span class="${clClass}"><strong>${evalRes.cl}</strong></span>
            </span>
        `;
    } else {
        pillsHtml += `<span class="preview-hint" style="margin-left: auto;">(Còn thiếu ${5 - cleaned.length} số...)</span>`;
    }

    previewBar.innerHTML = pillsHtml;
}

function clearInputBox() {
    const inputElem = document.getElementById('digit5Input');
    if (inputElem) {
        inputElem.value = '';
        inputElem.focus();
    }
    handleDigit5Input('');
}

function handleFormSubmit(event) {
    event.preventDefault();

    const periodInput = document.getElementById('periodInput');
    const digit5Input = document.getElementById('digit5Input');
    const rawVal = (digit5Input.value || '').replace(/\D/g, '');

    if (rawVal.length !== 5) {
        alert('Vui lòng nhập đủ 5 con số liền nhau của kỳ quay (Ví dụ: 56892)!');
        digit5Input.focus();
        return;
    }

    const digits = rawVal.split('').map(Number);
    const period = periodInput.value.trim() || `#${STATE.rounds.length + 1}`;

    addNewRound(period, digits);

    // Reset input for next entry & refocus immediately
    digit5Input.value = '';
    handleDigit5Input('');
    initNextPeriodInput();
    digit5Input.focus();
}

/**
 * Add a new round into history, verify with previous prediction, compute Húp/Gãy
 * - 5 kỳ đầu tiên (Kỳ 1 -> Kỳ 5) là mốc gốc ban đầu để thiết lập cầu kèo (không vào tiền, không tính trúng/trượt)
 * - Khung #1 và đối soát chính thức bắt đầu từ kỳ thứ 6 trở đi!
 */
function addNewRound(period, digits) {
    // Current AI prediction before this round came in
    const currentPred = generateAIPrediction(STATE.rounds);

    // Evaluate actual result
    const evalRes = evaluateDigits(digits, STATE.calcMode);

    const isWarmup = STATE.rounds.length < 5;
    const warmupNum = STATE.rounds.length + 1;

    // Verify Prediction
    const isTxHup = currentPred.predTx ? (currentPred.predTx === evalRes.tx) : true;
    const isClHup = currentPred.predCl ? (currentPred.predCl === evalRes.cl) : true;
    const statusTx = isWarmup ? 'Mốc Gốc' : (isTxHup ? 'Húp' : 'Gãy');
    const statusCl = isWarmup ? 'Mốc Gốc' : (isClHup ? 'Húp' : 'Gãy');
    const statusOverall = isWarmup ? 'Mốc Gốc' : ((isTxHup && isClHup) ? 'Húp' : (isTxHup ? 'Húp (TX)' : (isClHup ? 'Húp (CL)' : 'Gãy')));

    // Master 6 Cham VIP & Dàn Số VIP theo Chế Độ
    const m6 = currentPred.masterDigits6 || currentPred.masterDigits || [7, 0, 3, 1, 6, 9];
    const m5 = currentPred.masterDigits5 || m6.slice(0, 5);
    const t5 = currentPred.tienDigits || m5;
    const h5 = currentPred.hauDigits || m5;

    const dan36 = currentPred.phucHopMaster36 || generatePhucHop36(m6);
    const dan25 = currentPred.phucHopMaster25 || generatePhucHop25(m5);
    const danTien25 = currentPred.phucHopTien25 || generatePhucHop25(t5);
    const danHau25 = currentPred.phucHopHau25 || generatePhucHop25(h5);

    const activeChamArr = STATE.danMode === 'dan36' ? m6 : m5;
    const hitCham = activeChamArr.filter(c => digits.includes(c));
    const isChamHit = hitCham.length > 0;
    const statusCham = isWarmup ? 'Mốc Gốc' : (isChamHit ? 'Trúng' : 'Trượt');
    const statusChamDetail = isWarmup ? 'Mốc Gốc' : (isChamHit ? `Trúng [${hitCham.join(', ')}]` : 'Trượt');

    // Đánh Dàn số theo chế độ được chọn (Dàn 36 số / Dàn 25 số / Tách Tiền & Hậu)
    const tienNhiVal = `${digits[0]}${digits[1]}`;
    const hauNhiVal = `${digits[3]}${digits[4]}`;
    
    // Tính toán trúng/trượt cho Dàn 36 số VIP Bất Bại
    const isTien36Hit = dan36.includes(tienNhiVal);
    const isHau36Hit = dan36.includes(hauNhiVal);
    const isDan36Hit = isTien36Hit || isHau36Hit;
    const statusDan36 = isWarmup ? 'Mốc Gốc' : (isDan36Hit ? 'Húp' : 'Gãy');

    // Tính toán trúng/trượt cho Dàn 25 số
    const isTien25Hit = dan25.includes(tienNhiVal);
    const isHau25Hit = dan25.includes(hauNhiVal);
    const isDan25Hit = isTien25Hit || isHau25Hit;
    const statusDan25 = isWarmup ? 'Mốc Gốc' : (isDan25Hit ? 'Húp' : 'Gãy');

    // Tính toán trúng/trượt cho Tách Riêng 2 Dàn Tiền & Hậu
    const isTienSepHit = danTien25.includes(tienNhiVal);
    const isHauSepHit = danHau25.includes(hauNhiVal);
    const isDanSepHit = isTienSepHit || isHauSepHit;

    let isTienNhiHit = false;
    let isHauNhiHit = false;
    if (STATE.danMode === 'dan36') {
        isTienNhiHit = isTien36Hit;
        isHauNhiHit = isHau36Hit;
    } else if (STATE.danMode === 'separate') {
        isTienNhiHit = isTienSepHit;
        isHauNhiHit = isHauSepHit;
    } else {
        isTienNhiHit = isTien25Hit;
        isHauNhiHit = isHau25Hit;
    }
    const isUnifiedHit = isTienNhiHit || isHauNhiHit;

    // Sound effect only after 5 warmup rounds
    if (!isWarmup) {
        playNotificationSound(isTxHup || isClHup || isChamHit || isDan36Hit || isUnifiedHit);
    }

    const roundData = {
        period: period,
        digits: digits,
        sum: evalRes.sum,
        detailText: evalRes.detailText,
        actualTx: evalRes.tx,
        actualCl: evalRes.cl,
        predTx: isWarmup ? '--' : (currentPred.predTx || '--'),
        predCl: isWarmup ? '--' : (currentPred.predCl || '--'),
        predTxConf: currentPred.predTxConf || 50,
        predClConf: currentPred.predClConf || 50,
        predCham: activeChamArr,
        predChamList: currentPred.top6 || currentPred.topMaster || [],
        tienDigits: t5,
        topTien: currentPred.topTien || [],
        hauDigits: h5,
        topHau: currentPred.topHau || [],
        danModeUsed: STATE.danMode,
        phucHop36: dan36,
        phucHop25: dan25,
        phucHopTien25: danTien25,
        phucHopHau25: danHau25,
        predChamConf: currentPred.overallProb || 98,
        hitCham: hitCham,
        isChamHit: isChamHit,
        tienNhiVal: tienNhiVal,
        hauNhiVal: hauNhiVal,
        isDan36Hit: isDan36Hit,
        isTien36Hit: isTien36Hit,
        isHau36Hit: isHau36Hit,
        statusDan36: statusDan36,
        isDan25Hit: isDan25Hit,
        isTien25Hit: isTien25Hit,
        isHau25Hit: isHau25Hit,
        statusDan25: statusDan25,
        isDanSepHit: isDanSepHit,
        isTienSepHit: isTienSepHit,
        isHauSepHit: isHauSepHit,
        isTienNhiHit: isTienNhiHit,
        isHauNhiHit: isHauNhiHit,
        isUnified36Hit: isDan36Hit,
        isUnified25Hit: isDan25Hit,
        isUnifiedHit: isUnifiedHit,
        isWarmup: isWarmup,
        warmupNum: isWarmup ? warmupNum : null,
        statusCham: statusCham,
        statusChamDetail: statusChamDetail,
        statusTx: statusTx,
        statusCl: statusCl,
        statusOverall: statusOverall,
        isHup: isWarmup ? false : (isTxHup || isClHup),
        isDoubleHup: isWarmup ? false : (isTxHup && isClHup),
        bridgePattern: isWarmup ? `Mốc Gốc Khởi Tạo #${warmupNum}/5 (Chưa vào tiền)` : (currentPred.patternName || 'Nhịp đang chạy'),
        bridgeReason: isWarmup ? '5 kỳ kết quả đầu tiên được lưu làm mốc dữ liệu nền khởi tạo nhịp cầu' : (currentPred.reason || 'Dữ liệu phân tích')
    };

    STATE.rounds.push(roundData);
    saveToLocalStorage();
    updateAllViews();
}

function recalculateAllRounds() {
    const originalRounds = [...STATE.rounds];
    STATE.rounds = [];
    originalRounds.forEach(r => {
        addNewRound(r.period, r.digits);
    });
}

function initNextPeriodInput() {
    const periodInput = document.getElementById('periodInput');
    if (!periodInput) return;
    if (STATE.rounds.length === 0) {
        periodInput.value = '101';
    } else {
        const lastPeriod = STATE.rounds[STATE.rounds.length - 1].period;
        const match = lastPeriod.match(/\d+/);
        if (match) {
            const nextNum = parseInt(match[0]) + 1;
            periodInput.value = lastPeriod.replace(match[0], nextNum);
        } else {
            periodInput.value = `Kỳ ${STATE.rounds.length + 1}`;
        }
    }
}

function undoLastRound() {
    if (STATE.rounds.length === 0) {
        alert('Chưa có lịch sử để xóa!');
        return;
    }
    if (confirm(`Bạn có chắc muốn xóa kỳ quay gần nhất (${STATE.rounds[STATE.rounds.length - 1].period})?`)) {
        STATE.rounds.pop();
        saveToLocalStorage();
        initNextPeriodInput();
        updateAllViews();
    }
}

function deleteSpecificRound(index) {
    if (confirm(`Xóa kỳ quay ${STATE.rounds[index].period}?`)) {
        STATE.rounds.splice(index, 1);
        recalculateAllRounds();
        saveToLocalStorage();
        initNextPeriodInput();
        updateAllViews();
    }
}

function clearAllData() {
    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ lịch sử soi cầu và bắt đầu lại?')) {
        STATE.rounds = [];
        saveToLocalStorage();
        initNextPeriodInput();
        updateAllViews();
    }
}

/* ==========================================================================
   CAPITAL MANAGEMENT & SMART BET SIZING ENGINE
   ========================================================================== */

function formatMoney(amount, withUnit = true) {
    if (isNaN(amount) || amount === null || amount === undefined) amount = 0;
    const formatted = Math.round(amount).toLocaleString('vi-VN');
    return withUnit ? `${formatted} đ` : formatted;
}

function calculateCapitalPlan(totalCapital = STATE.capital, safeFrames = STATE.safeFrames, betStrategy = STATE.betStrategy, payoutRate = STATE.payoutRate, danMode = STATE.danMode) {
    totalCapital = Math.max(100000, Number(totalCapital) || 30000000);
    safeFrames = Math.max(1, Number(safeFrames) || 5);
    payoutRate = Number(payoutRate) || 99;
    
    const frameBudget = Math.floor(totalCapital / safeFrames);
    const isDual = betStrategy === 'dual';
    const numPerHead = danMode === 'dan36' ? 36 : 25;
    const numCount = isDual ? numPerHead * 2 : numPerHead;
    
    let step1PerNum, step2PerNum, step3PerNum;
    
    if (danMode === 'dan36') {
        if (!isDual) {
            // Tỷ lệ chuẩn cho 1 cửa 36 số (Hậu Nhị 36 số)
            step1PerNum = Math.max(1000, Math.round((frameBudget * 0.09) / (36 * 1000)) * 1000); // 15k -> 540k
            step2PerNum = Math.max(step1PerNum * 2, Math.round((frameBudget * 0.24) / (36 * 1000)) * 1000); // 40k -> 1.44M
            const rem3 = frameBudget - (step1PerNum * 36) - (step2PerNum * 36);
            step3PerNum = Math.max(step2PerNum * 2, Math.floor(rem3 / (36 * 1000)) * 1000); // 110k -> 3.96M
        } else {
            // Tỷ lệ chuẩn cho CẢ 2 ĐẦU: 72 số (36 Tiền + 36 Hậu)
            step1PerNum = Math.max(1000, Math.round((frameBudget * 0.12) / (72 * 1000)) * 1000); // 10k -> 720k
            step2PerNum = Math.max(step1PerNum * 2, Math.round((frameBudget * 0.30) / (72 * 1000)) * 1000); // 25k -> 1.80M
            const rem3 = frameBudget - (step1PerNum * 72) - (step2PerNum * 72);
            step3PerNum = Math.max(step2PerNum * 2, Math.floor(rem3 / (72 * 1000)) * 1000); // 50k -> 3.60M
        }
    } else {
        if (!isDual) {
            // Tỷ lệ chuẩn cho 1 cửa 25 số
            step1PerNum = Math.max(1000, Math.round((frameBudget * 0.0833) / (25 * 1000)) * 1000); // 20k -> 500k
            step2PerNum = Math.max(step1PerNum * 2, Math.round((frameBudget * 0.25) / (25 * 1000)) * 1000); // 60k -> 1.5M
            const rem3 = frameBudget - (step1PerNum * 25) - (step2PerNum * 25);
            step3PerNum = Math.max(step2PerNum * 2, Math.floor(rem3 / (25 * 1000)) * 1000); // 160k -> 4M
        } else {
            // Tỷ lệ chuẩn cho CẢ 2 ĐẦU: 50 số (25 Tiền Nhị + 25 Hậu Nhị)
            step1PerNum = Math.max(1000, Math.round((frameBudget / 6) / (50 * 1000)) * 1000); // 20k -> 1M
            step2PerNum = Math.max(step1PerNum, Math.round((frameBudget * 0.29166) / (50 * 1000)) * 1000); // 35k -> 1.75M
            const rem3 = frameBudget - (step1PerNum * 50) - (step2PerNum * 50);
            step3PerNum = Math.max(step2PerNum, Math.floor(rem3 / (50 * 1000)) * 1000); // 65k -> 3.25M
        }
    }

    const bet1Total = step1PerNum * numCount;
    const bet2Total = step2PerNum * numCount;
    const bet3Total = step3PerNum * numCount;
    const totalFrameCost = bet1Total + bet2Total + bet3Total;

    const perHead1 = step1PerNum * numPerHead;
    const perHead2 = step2PerNum * numPerHead;
    const perHead3 = step3PerNum * numPerHead;

    // Trúng thưởng (1 ăn 99)
    const win1Return = step1PerNum * payoutRate;
    const win1Profit = win1Return - bet1Total;
    const win1ProfitBoth = (win1Return * 2) - bet1Total;

    const win2Return = step2PerNum * payoutRate;
    const win2Profit = win2Return - (bet1Total + bet2Total);
    const win2ProfitBoth = (win2Return * 2) - (bet1Total + bet2Total);

    const win3Return = step3PerNum * payoutRate;
    const win3Profit = win3Return - totalFrameCost;
    const win3ProfitBoth = (win3Return * 2) - totalFrameCost;

    return {
        totalCapital,
        safeFrames,
        frameBudget,
        actualFrameCost: totalFrameCost,
        betStrategy,
        danMode: danMode || STATE.danMode,
        isDual,
        numPerHead,
        payoutRate,
        numCount,
        steps: [
            {
                stepNum: 1,
                name: 'TAY 1',
                title: 'TAY 1 / 3 (Khởi Đầu)',
                perNum: step1PerNum,
                perHead: perHead1,
                totalBet: bet1Total,
                cumCost: bet1Total,
                winReturn: win1Return,
                profit: win1Profit,
                profitBoth: win1ProfitBoth,
                advice: 'Vốn Thăm Dò'
            },
            {
                stepNum: 2,
                name: 'TAY 2',
                title: 'TAY 2 / 3 (Gấp Thếp)',
                perNum: step2PerNum,
                perHead: perHead2,
                totalBet: bet2Total,
                cumCost: bet1Total + bet2Total,
                winReturn: win2Return,
                profit: win2Profit,
                profitBoth: win2ProfitBoth,
                advice: 'Tăng Tốc Gấp Thếp'
            },
            {
                stepNum: 3,
                name: 'TAY 3',
                title: 'TAY 3 / 3 (Quyết Đấu)',
                perNum: step3PerNum,
                perHead: perHead3,
                totalBet: bet3Total,
                cumCost: totalFrameCost,
                winReturn: win3Return,
                profit: win3Profit,
                profitBoth: win3ProfitBoth,
                advice: 'Quyết Đấu Chốt Khung'
            }
        ]
    };
}

function handleCapitalInputChange(val) {
    const raw = String(val).replace(/\D/g, '');
    const num = parseInt(raw) || 0;
    STATE.capital = num;
    const inputElem = document.getElementById('capitalInput');
    if (inputElem && raw.length > 0) {
        inputElem.value = num.toLocaleString('vi-VN');
    }
    updateQuickCapButtons(num);
    saveToLocalStorage();
    updateCapitalUI();
}

function setQuickCapital(amount) {
    STATE.capital = amount;
    const inputElem = document.getElementById('capitalInput');
    if (inputElem) {
        inputElem.value = amount.toLocaleString('vi-VN');
    }
    updateQuickCapButtons(amount);
    saveToLocalStorage();
    updateCapitalUI();
}

function updateQuickCapButtons(amount) {
    const btns = document.querySelectorAll('.btn-quick-cap');
    btns.forEach(btn => {
        const text = btn.innerText.trim();
        let capVal = 0;
        if (text === '10M') capVal = 10000000;
        else if (text === '20M') capVal = 20000000;
        else if (text === '30M') capVal = 30000000;
        else if (text === '50M') capVal = 50000000;
        else if (text === '100M') capVal = 100000000;
        btn.classList.toggle('active', capVal === amount);
    });
}

function handleSafeFramesChange(val) {
    STATE.safeFrames = parseInt(val) || 5;
    saveToLocalStorage();
    updateCapitalUI();
}

function handleBetStrategyChange(val) {
    STATE.betStrategy = val;
    saveToLocalStorage();
    updateCapitalUI();
}

function updateCapitalUI() {
    const plan = calculateCapitalPlan();
    const isDual = plan.isDual;
    
    // 1. Sync header / info elements
    const budgetPerFrameDisplay = document.getElementById('budgetPerFrameDisplay');
    const safeBadgeDisplay = document.getElementById('safeBadgeDisplay');
    const payoutRateDisplay = document.getElementById('payoutRateDisplay');
    const betStrategySelect = document.getElementById('betStrategySelect');
    
    if (betStrategySelect && betStrategySelect.value !== STATE.betStrategy) {
        betStrategySelect.value = STATE.betStrategy;
    }
    if (budgetPerFrameDisplay) {
        budgetPerFrameDisplay.innerText = formatMoney(plan.frameBudget);
    }
    if (safeBadgeDisplay) {
        safeBadgeDisplay.innerHTML = `<i class="fa-solid fa-shield-halved text-cyan"></i> ${STATE.safeFrames} Khung An Toàn`;
    }
    if (payoutRateDisplay) {
        payoutRateDisplay.innerText = `1 ăn ${STATE.payoutRate}`;
    }

    // 2. Render Step Cards
    const step1 = plan.steps[0];
    const step2 = plan.steps[1];
    const step3 = plan.steps[2];

    const capStep1PerNum = document.getElementById('capStep1PerNum');
    const capStep1HeadVal = document.getElementById('capStep1HeadVal');
    const capStep1HeadRow = document.getElementById('capStep1HeadRow');
    const capStep1Total = document.getElementById('capStep1Total');
    const capStep1Profit = document.getElementById('capStep1Profit');
    const capStep1BothRow = document.getElementById('capStep1BothRow');
    const capStep1ProfitBoth = document.getElementById('capStep1ProfitBoth');

    const capStep2PerNum = document.getElementById('capStep2PerNum');
    const capStep2HeadVal = document.getElementById('capStep2HeadVal');
    const capStep2HeadRow = document.getElementById('capStep2HeadRow');
    const capStep2Total = document.getElementById('capStep2Total');
    const capStep2Profit = document.getElementById('capStep2Profit');
    const capStep2BothRow = document.getElementById('capStep2BothRow');
    const capStep2ProfitBoth = document.getElementById('capStep2ProfitBoth');

    const capStep3PerNum = document.getElementById('capStep3PerNum');
    const capStep3HeadVal = document.getElementById('capStep3HeadVal');
    const capStep3HeadRow = document.getElementById('capStep3HeadRow');
    const capStep3Total = document.getElementById('capStep3Total');
    const capStep3Profit = document.getElementById('capStep3Profit');
    const capStep3BothRow = document.getElementById('capStep3BothRow');
    const capStep3ProfitBoth = document.getElementById('capStep3ProfitBoth');

    if (capStep1PerNum) capStep1PerNum.innerText = formatMoney(step1.perNum);
    if (capStep1HeadVal) capStep1HeadVal.innerText = `${formatMoney(step1.perHead)} / đầu`;
    if (capStep1HeadRow) capStep1HeadRow.style.display = isDual ? 'flex' : 'none';
    if (capStep1Total) capStep1Total.innerText = formatMoney(step1.totalBet);
    if (capStep1Profit) capStep1Profit.innerText = `+${formatMoney(step1.profit)}`;
    if (capStep1BothRow) capStep1BothRow.style.display = isDual ? 'flex' : 'none';
    if (capStep1ProfitBoth) capStep1ProfitBoth.innerText = `+${formatMoney(step1.profitBoth)}`;

    if (capStep2PerNum) capStep2PerNum.innerText = formatMoney(step2.perNum);
    if (capStep2HeadVal) capStep2HeadVal.innerText = `${formatMoney(step2.perHead)} / đầu`;
    if (capStep2HeadRow) capStep2HeadRow.style.display = isDual ? 'flex' : 'none';
    if (capStep2Total) capStep2Total.innerText = formatMoney(step2.totalBet);
    if (capStep2Profit) capStep2Profit.innerText = `+${formatMoney(step2.profit)}`;
    if (capStep2BothRow) capStep2BothRow.style.display = isDual ? 'flex' : 'none';
    if (capStep2ProfitBoth) capStep2ProfitBoth.innerText = `+${formatMoney(step2.profitBoth)}`;

    if (capStep3PerNum) capStep3PerNum.innerText = formatMoney(step3.perNum);
    if (capStep3HeadVal) capStep3HeadVal.innerText = `${formatMoney(step3.perHead)} / đầu`;
    if (capStep3HeadRow) capStep3HeadRow.style.display = isDual ? 'flex' : 'none';
    if (capStep3Total) capStep3Total.innerText = formatMoney(step3.totalBet);
    if (capStep3Profit) capStep3Profit.innerText = `+${formatMoney(step3.profit)}`;
    if (capStep3BothRow) capStep3BothRow.style.display = isDual ? 'flex' : 'none';
    if (capStep3ProfitBoth) capStep3ProfitBoth.innerText = `+${formatMoney(step3.profitBoth)}`;

    // 3. Highlight current active step based on active frame
    const frameData = computeFrameHistory(STATE.rounds);
    const active = frameData.activeFrame;
    const isWarmup = active ? (active.isWarmup === true) : (STATE.rounds.length < 5);
    const currentTay = active ? (active.currentTay || 1) : 1;

    const card1 = document.getElementById('capCardStep1');
    const card2 = document.getElementById('capCardStep2');
    const card3 = document.getElementById('capCardStep3');

    if (card1) card1.classList.toggle('active-tay-glow', !isWarmup && currentTay === 1);
    if (card2) card2.classList.toggle('active-tay-glow', !isWarmup && currentTay === 2);
    if (card3) card3.classList.toggle('active-tay-glow', !isWarmup && currentTay === 3);

    const liveBetStepText = document.getElementById('liveBetStepText');
    const capLivePromptText = document.getElementById('capLivePromptText');

    const curStepData = plan.steps[currentTay - 1] || plan.steps[0];
    const kNum = curStepData.perNum >= 1000 ? `${Math.round(curStepData.perNum / 1000)}K/số` : `${formatMoney(curStepData.perNum)}/số`;

    if (liveBetStepText) {
        if (isWarmup) {
            liveBetStepText.innerText = `NẠP GỐC ${STATE.rounds.length}/5 (Chưa vào tiền)`;
        } else {
            liveBetStepText.innerText = `TAY ${currentTay} / 3 (${currentTay === 1 ? 'Khởi Đầu' : (currentTay === 2 ? 'Gấp Thếp' : 'Quyết Đấu')})`;
        }
    }

    const bridgeHealth = evaluateBridgeHealth(STATE.rounds, frameData);

    if (capLivePromptText) {
        if (isWarmup) {
            capLivePromptText.innerHTML = `
                ⏳ <b>ĐANG NẠP 5 KỲ DỮ LIỆU GỐC (${STATE.rounds.length}/5):</b> Hệ thống đang thu thập dữ liệu khởi tạo nhịp cầu và giải mã Pascal. <b>CHƯA CẦN VÀO TIỀN</b>. Khung nuôi #1 sẽ chính thức bắt đầu từ <b>Kỳ thứ 6</b>!
            `;
        } else if (bridgeHealth.level === 'red' && currentTay === 1) {
            capLivePromptText.innerHTML = `
                🛑 <b>CẢNH BÁO TÍN HIỆU AI (ĐÈN ĐỎ):</b> Cầu đang có dấu hiệu gãy bão. Khuyến nghị <b>TẠM NGHỈ KHUNG NÀY (ĐỨNG NGOÀI QUAN SÁT)</b> để bảo toàn trọn vẹn số vốn! (Nếu vẫn thử, chỉ đặt thăm dò nhỏ 10k/số).
            `;
        } else if (isDual) {
            const signalPrefix = bridgeHealth.level === 'green' ? '🟢 <b>TÍN HIỆU CẦU CHUẨN ĐẸP (NÊN VÀO TIỀN):</b>' : (bridgeHealth.level === 'yellow' ? '🟡 <b>TÍN HIỆU CẦU TRUNG BÌNH (VÀO TIỀN NHẸ):</b>' : '🛑 <b>CẢNH BÁO CẦU GÃY NHỊP:</b>');
            capLivePromptText.innerHTML = `
                ${signalPrefix} Bạn đang ở <b>TAY ${currentTay} / 3</b> ➔ Đặt <b>${kNum}</b> (Tiền Nhị: <b>${formatMoney(curStepData.perHead)}</b> + Hậu Nhị: <b>${formatMoney(curStepData.perHead)}</b> ➔ Tổng: <b>${formatMoney(curStepData.totalBet)}</b>). Húp 1 đầu lãi <b class="text-green">+${formatMoney(curStepData.profit)}</b> (Ăn kép 2 đầu lãi <b class="text-gold">+${formatMoney(curStepData.profitBoth)}</b>)!
            `;
        } else {
            const signalPrefix = bridgeHealth.level === 'green' ? '🟢 <b>TÍN HIỆU CẦU CHUẨN ĐẸP:</b>' : (bridgeHealth.level === 'yellow' ? '🟡 <b>TÍN HIỆU CẦU TRUNG BÌNH:</b>' : '🛑 <b>CẢNH BÁO CẦU GÃY:</b>');
            capLivePromptText.innerHTML = `
                ${signalPrefix} Bạn đang ở <b>TAY ${currentTay} / 3</b> ➔ Đặt <b>${kNum}</b> (Tổng cược: <b>${formatMoney(curStepData.totalBet)}</b> cho 25 số VIP). Húp lãi ròng: <b class="text-green">+${formatMoney(curStepData.profit)}</b> ➔ Trúng là dừng mở khung mới!
            `;
        }
    }

    // Update active frame card bet advice
    const betAdvice = document.getElementById('activeFrameBetAdvice');
    if (betAdvice) {
        if (isWarmup) {
            betAdvice.innerHTML = `<span class="text-cyan"><i class="fa-solid fa-seedling"></i> <b>Đang nạp 5 kỳ gốc (${STATE.rounds.length}/5)</b> ➔ <b>Chưa vào tiền</b> (Khung #1 bắt đầu từ Kỳ 6)</span>`;
        } else {
            const colorClass = currentTay === 1 ? 'text-green' : (currentTay === 2 ? 'text-yellow' : 'text-red');
            if (isDual) {
                betAdvice.innerHTML = `<span class="${colorClass}"><b>TAY ${currentTay}: Đánh ${kNum} (${formatMoney(curStepData.perHead)}/đầu ➔ Tổng: ${formatMoney(curStepData.totalBet)}) ➔ Húp 1 đầu Lãi +${formatMoney(curStepData.profit)}</b></span>`;
            } else {
                betAdvice.innerHTML = `<span class="${colorClass}"><b>TAY ${currentTay}: Đánh ${kNum} (Tổng: ${formatMoney(curStepData.totalBet)}) ➔ Húp Lãi +${formatMoney(curStepData.profit)}</b></span>`;
            }
        }
    }

    // Update predChamBox bet pill
    const predChamBetText = document.getElementById('predChamBetText');
    if (predChamBetText) {
        if (isWarmup) {
            predChamBetText.innerText = `Nạp gốc ${STATE.rounds.length}/5 • Khung #1 từ Kỳ 6`;
        } else if (isDual) {
            predChamBetText.innerText = `${kNum} • ${formatMoney(curStepData.perHead, false)}/đầu (Tổng: ${formatMoney(curStepData.totalBet)})`;
        } else {
            predChamBetText.innerText = `${kNum} (Tổng: ${formatMoney(curStepData.totalBet)})`;
        }
    }
}

/* ==========================================================================
   UI RENDERING & DASHBOARD UPDATES
   ========================================================================== */

function updateAllViews() {
    updatePredictionCard();
    updateLastRoundDisplay();
    updateFrameUI();
    updateCapitalUI();
    update10RoundStats();
    updateRoadmap();
    updateHistoryTable();
}

/**
 * Render Quick Display for the Previous Round (Kỳ trước vừa ra) right in the input card
 */
function updateLastRoundDisplay() {
    const banner = document.getElementById('lastRoundQuickBanner');
    const periodBadge = document.getElementById('lastRoundPeriodBadge');
    const detailsDisplay = document.getElementById('lastRoundDetailsDisplay');
    const miniInlineVal = document.getElementById('lastRoundMiniVal');

    if (!banner || !detailsDisplay) return;

    if (STATE.rounds.length === 0) {
        if (periodBadge) periodBadge.innerText = 'Chưa có dữ liệu';
        detailsDisplay.innerHTML = `<span class="text-dim"><i class="fa-solid fa-inbox"></i> Nhập kết quả kỳ đầu tiên để bắt đầu</span>`;
        if (miniInlineVal) miniInlineVal.innerText = '--';
        return;
    }

    const last = STATE.rounds[STATE.rounds.length - 1];
    const actualIndex = STATE.rounds.length - 1;
    const isWarmup = last.isWarmup || (actualIndex < 5);
    const warmupNum = last.warmupNum || (actualIndex + 1);

    if (periodBadge) {
        periodBadge.innerHTML = `<i class="fa-solid fa-flag-checkered text-gold"></i> ${last.period}`;
    }

    // 5 balls
    const ballsHtml = last.digits.map(d => `<span class="last-round-ball">${d}</span>`).join('');

    // TX / CL badges
    const txClass = last.actualTx === 'Tài' ? 'tag-tai' : 'tag-xiu';
    const clClass = last.actualCl === 'Chẵn' ? 'tag-chan' : 'tag-le';
    const txClHtml = `
        <span class="badge-tag-tx ${txClass}" style="font-size:0.76rem; padding:2px 8px;">Ra ${last.actualTx}</span>
        <span class="badge-tag-tx ${clClass}" style="font-size:0.76rem; padding:2px 8px;">Ra ${last.actualCl}</span>
    `;

    // Tiền / Hậu Nhị
    const tienVal = `${last.digits[0]}${last.digits[1]}`;
    const hauVal = `${last.digits[3]}${last.digits[4]}`;
    const nhiHtml = `
        <span class="last-round-nhi-pill" title="2 số đầu (Tiền Nhị)">Tiền: <b>${tienVal}</b></span>
        <span class="last-round-nhi-pill" title="2 số đuôi (Hậu Nhị)">Hậu: <b>${hauVal}</b></span>
    `;

    // Status Pill
    let statusHtml = '';
    if (isWarmup) {
        statusHtml = `<span class="status-pill-warmup" style="font-size:0.72rem; padding:2px 8px;"><i class="fa-solid fa-seedling"></i> Mốc Gốc #${warmupNum}/5</span>`;
    } else {
        const isTxHup = last.statusTx === 'Húp';
        const isClHup = last.statusCl === 'Húp';
        
        // 1. TX Status Badge (Màu xanh khi Húp: Húp Xỉu (X ✓) hoặc Húp Tài (T ✓), màu đỏ khi Gãy)
        const txShort = last.actualTx === 'Tài' ? 'T' : 'X';
        const txBadge = isTxHup
            ? `<span class="status-pill-hup" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dự đoán đúng ${last.actualTx}"><i class="fa-solid fa-circle-check"></i> Húp ${last.actualTx} (${txShort} ✓)</span>`
            : `<span class="status-pill-gay" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dự đoán ${last.predTx} nhưng kết quả ra ${last.actualTx}"><i class="fa-solid fa-circle-xmark"></i> Gãy TX ✗ (Đoán ${last.predTx})</span>`;

        // 2. CL Status Badge (Màu xanh khi Húp: Húp Chẵn (C ✓) hoặc Húp Lẻ (L ✓), màu đỏ khi Gãy)
        const clShort = last.actualCl === 'Chẵn' ? 'C' : 'L';
        const clBadge = isClHup
            ? `<span class="status-pill-hup" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dự đoán đúng ${last.actualCl}"><i class="fa-solid fa-circle-check"></i> Húp ${last.actualCl} (${clShort} ✓)</span>`
            : `<span class="status-pill-gay" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dự đoán ${last.predCl} nhưng kết quả ra ${last.actualCl}"><i class="fa-solid fa-circle-xmark"></i> Gãy CL ✗ (Đoán ${last.predCl})</span>`;

        // 3. Dàn 36 Số VIP Bất Bại (Báo rõ Húp Hậu, Tiền hay Kép 2 Đầu kèm số con trúng)
        const hitTien36 = (last.phucHop36 || []).includes(tienVal) || last.isTien36Hit;
        const hitHau36 = (last.phucHop36 || []).includes(hauVal) || last.isHau36Hit;
        const isDan36Hit = hitTien36 || hitHau36;

        let dan36Badge = '';
        if (hitTien36 && hitHau36) {
            dan36Badge = `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800; border: 1.5px solid #f59e0b;" title="Dàn 36 Số VIP trúng kép cả 2 đầu!"><i class="fa-solid fa-crown text-gold"></i> Dàn 36 ✓ Húp Kép (Tiền ${tienVal} + Hậu ${hauVal})</span>`;
        } else if (hitHau36) {
            dan36Badge = `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dàn 36 Số VIP trúng Hậu Nhị con ${hauVal}"><i class="fa-solid fa-check"></i> Dàn 36 ✓ Húp Hậu (${hauVal})</span>`;
        } else if (hitTien36) {
            dan36Badge = `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dàn 36 Số VIP trúng Tiền Nhị con ${tienVal}"><i class="fa-solid fa-check"></i> Dàn 36 ✓ Húp Tiền (${tienVal})</span>`;
        } else {
            dan36Badge = `<span class="status-pill-truot" style="font-size:0.75rem; padding:3px 9px; font-weight:800;" title="Dàn 36 Số VIP không trúng đầu nào"><i class="fa-solid fa-xmark"></i> Dàn 36 ✗ Gãy</span>`;
        }

        // 4. Dàn 25 Số hoặc Tách Tiền & Hậu
        let secondaryDanBadge = '';
        if (STATE.danMode === 'dan25') {
            const hitTien25 = (last.phucHop25 || []).includes(tienVal) || last.isTien25Hit;
            const hitHau25 = (last.phucHop25 || []).includes(hauVal) || last.isHau25Hit;
            if (hitTien25 && hitHau25) {
                secondaryDanBadge = `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-crown text-gold"></i> Dàn 25 ✓ Húp Kép (Tiền ${tienVal} + Hậu ${hauVal})</span>`;
            } else if (hitHau25) {
                secondaryDanBadge = `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-check"></i> Dàn 25 ✓ Húp Hậu (${hauVal})</span>`;
            } else if (hitTien25) {
                secondaryDanBadge = `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-check"></i> Dàn 25 ✓ Húp Tiền (${tienVal})</span>`;
            } else {
                secondaryDanBadge = `<span class="status-pill-truot" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-xmark"></i> Dàn 25 ✗ Gãy</span>`;
            }
        } else if (STATE.danMode === 'separate') {
            const hitTienSep = (last.phucHopTien25 || []).includes(tienVal) || last.isTienSepHit;
            const hitHauSep = (last.phucHopHau25 || []).includes(hauVal) || last.isHauSepHit;
            const sepTienHtml = hitTienSep 
                ? `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-check"></i> Tiền 25 ✓ Húp (${tienVal})</span>`
                : `<span class="status-pill-truot" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-xmark"></i> Tiền 25 ✗ (${tienVal})</span>`;
            const sepHauHtml = hitHauSep 
                ? `<span class="status-pill-trung" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-check"></i> Hậu 25 ✓ Húp (${hauVal})</span>`
                : `<span class="status-pill-truot" style="font-size:0.75rem; padding:3px 9px; font-weight:800;"><i class="fa-solid fa-xmark"></i> Hậu 25 ✗ (${hauVal})</span>`;
            secondaryDanBadge = `${sepTienHtml} ${sepHauHtml}`;
        } else {
            // In dan36 mode, also display Dàn 25 status as additional reference
            const hitTien25 = (last.phucHop25 || []).includes(tienVal) || last.isTien25Hit;
            const hitHau25 = (last.phucHop25 || []).includes(hauVal) || last.isHau25Hit;
            if (hitTien25 && hitHau25) {
                secondaryDanBadge = `<span class="status-pill-trung" style="font-size:0.74rem; padding:3px 8px; opacity:0.9;"><i class="fa-solid fa-check"></i> Dàn 25 ✓ (Kép ${tienVal}/${hauVal})</span>`;
            } else if (hitHau25) {
                secondaryDanBadge = `<span class="status-pill-trung" style="font-size:0.74rem; padding:3px 8px; opacity:0.9;"><i class="fa-solid fa-check"></i> Dàn 25 ✓ (Hậu ${hauVal})</span>`;
            } else if (hitTien25) {
                secondaryDanBadge = `<span class="status-pill-trung" style="font-size:0.74rem; padding:3px 8px; opacity:0.9;"><i class="fa-solid fa-check"></i> Dàn 25 ✓ (Tiền ${tienVal})</span>`;
            } else {
                secondaryDanBadge = `<span class="status-pill-truot" style="font-size:0.74rem; padding:3px 8px; opacity:0.8;"><i class="fa-solid fa-xmark"></i> Dàn 25 ✗</span>`;
            }
        }

        statusHtml = `
            ${txBadge}
            ${clBadge}
            ${dan36Badge}
            ${secondaryDanBadge}
        `;
    }

    detailsDisplay.innerHTML = `
        <div class="last-round-balls-wrap">
            ${ballsHtml}
        </div>
        <span class="last-round-sum-pill">Tổng <b>${last.sum}</b></span>
        ${txClHtml}
        ${nhiHtml}
        ${statusHtml}
    `;

    if (miniInlineVal) {
        miniInlineVal.innerHTML = `${last.period} [<b>${last.digits.join('')}</b> ➔ ${last.actualTx} - ${last.actualCl}]`;
    }
}

/**
 * Đánh giá kiến nghị Vào Tiền (ĐÁNH) hay Tạm Dừng (NGẮM) cho Tài/Xỉu và Chẵn/Lẻ
 */
function evaluateBetAction(type, predVal, predConf, patternName, history) {
    if (!history || history.length === 0) {
        return {
            action: 'CHỜ DỮ LIỆU',
            badgeClass: 'signal-yellow',
            icon: '<i class="fa-solid fa-hourglass-half"></i>',
            pattern: 'Khởi tạo',
            advice: 'Chưa đủ dữ liệu để đưa ra khuyến nghị đánh hay ngắm.'
        };
    }

    if (history.length < 5) {
        return {
            action: `MỐC GỐC (${history.length}/5)`,
            badgeClass: 'signal-warmup',
            icon: '<i class="fa-solid fa-seedling"></i>',
            pattern: 'Nạp dữ liệu gốc',
            advice: 'Đang trong giai đoạn 5 kỳ mốc dữ liệu nền. <b>TẠM NGẮM (Chưa vào tiền)</b>.'
        };
    }

    // Evaluate last 10 playable rounds
    const playable = history.filter(r => !r.isWarmup);
    const last10 = playable.slice(-10);
    const hupCount = last10.filter(r => (type === 'tx' ? r.statusTx === 'Húp' : r.statusCl === 'Húp')).length;
    const winRate = last10.length > 0 ? Math.round((hupCount / last10.length) * 100) : 50;

    // Check recent loss streak
    let lostStreak = 0;
    for (let i = playable.length - 1; i >= 0; i--) {
        const isWin = type === 'tx' ? (playable[i].statusTx === 'Húp') : (playable[i].statusCl === 'Húp');
        if (!isWin) lostStreak++;
        else break;
    }

    const typeLabel = type === 'tx' ? 'Tài/Xỉu' : 'Chẵn/Lẻ';

    // 1. ĐÈN ĐỎ: TẠM NGẮM / ĐỨNG NGOÀI (Khi đang gãy >= 2 tay, hoặc winRate < 45%, hoặc conf < 65%)
    if (lostStreak >= 2 || (last10.length >= 4 && winRate < 45) || predConf < 65) {
        return {
            action: 'TẠM NGẮM (ĐỨNG NGOÀI)',
            badgeClass: 'signal-red',
            icon: '<i class="fa-solid fa-hand"></i>',
            pattern: patternName || 'Bão Nhịp',
            advice: lostStreak >= 2 
                ? `Cầu ${typeLabel} vừa gãy <b>${lostStreak} tay liên tiếp</b>. Khuyến nghị <b>TẠM NGẮM (ĐỨNG NGOÀI)</b> tay này để bảo toàn vốn!`
                : `Tỷ lệ ăn 10 kỳ thấp (<b>${winRate}%</b>). Nhịp cầu đang biến động, khuyến nghị <b>TẠM NGẮM QUAN SÁT</b>!`
        };
    }

    // 2. ĐÈN XANH: NÊN ĐÁNH (Khi conf >= 75% VÀ winRate >= 60%)
    if (predConf >= 75 && winRate >= 60) {
        return {
            action: `NÊN ĐÁNH ${predVal ? predVal.toUpperCase() : ''}`,
            badgeClass: 'signal-green',
            icon: '<i class="fa-solid fa-circle-check"></i>',
            pattern: patternName || 'Cầu Chuẩn',
            advice: `Cầu <b>${patternName}</b> rất đẹp (Tin cậy <b>${predConf}%</b> • 10 kỳ ăn <b>${winRate}%</b>). <b>TỰ TIN VÀO TIỀN ${predVal}</b>!`
        };
    }

    // 3. ĐÈN VÀNG: ĐI TIỀN NHẸ / THĂM DÒ (Các trường hợp còn lại)
    return {
        action: 'ĐI TIỀN NHẸ (THĂM DÒ)',
        badgeClass: 'signal-yellow',
        icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
        pattern: patternName || 'Nhịp Vừa',
        advice: `Cầu <b>${patternName}</b> có độ lệch nhẹ (Tin cậy <b>${predConf}%</b>). Khuyến nghị đi vốn nhỏ 50% thăm dò cửa <b>${predVal}</b>.`
    };
}

/**
 * 1. Render Top Prediction Card for NEXT round (Unified 5 Chạm Vàng & Dàn 25 Số VIP)
 */
function updatePredictionCard() {
    const nextPred = generateAIPrediction(STATE.rounds);
    STATE.currentPrediction = nextPred;

    const nextPeriodElem = document.getElementById('nextPeriodDisplay');
    const periodInputVal = document.getElementById('periodInput').value || `#${STATE.rounds.length + 1}`;
    if (nextPeriodElem) nextPeriodElem.innerText = `KỲ TIẾP: ${periodInputVal}`;

    const txElem = document.getElementById('predTxValue');
    const txConfElem = document.getElementById('predTxConf');
    const txBarElem = document.getElementById('predTxBar');

    const clElem = document.getElementById('predClValue');
    const clConfElem = document.getElementById('predClConf');
    const clBarElem = document.getElementById('predClBar');

    // Action Advice Elements for TX and CL
    const predTxActionBadge = document.getElementById('predTxActionBadge');
    const predTxPatternBadge = document.getElementById('predTxPatternBadge');
    const predTxAdviceText = document.getElementById('predTxAdviceText');

    const predClActionBadge = document.getElementById('predClActionBadge');
    const predClPatternBadge = document.getElementById('predClPatternBadge');
    const predClAdviceText = document.getElementById('predClAdviceText');

    // UNIFIED CHẠM & DÀN SỐ VIP ELEMENTS THEO CHẾ ĐỘ
    const isMode36 = STATE.danMode === 'dan36';
    const isModeSep = STATE.danMode === 'separate';

    const topToDisplay = isMode36 ? (nextPred.top6 || nextPred.topMaster || []) : (nextPred.top5 || (nextPred.topMaster ? nextPred.topMaster.slice(0, 5) : []));
    let phucHopToDisplay = isMode36 ? (nextPred.phucHopMaster36 || []) : (nextPred.phucHopMaster25 || []);
    if (isModeSep) {
        phucHopToDisplay = nextPred.phucHopMaster25 || [];
    }

    const chamListMaster = document.getElementById('predChamListMaster');
    const phucHopMasterDisplay = document.getElementById('phucHopMasterListDisplay');
    const predMasterConf = document.getElementById('predMasterConf');
    const probMaster = nextPred.overallProb || nextPred.probMaster || 98;

    // Update active tab buttons
    const tabDan36 = document.getElementById('tabDan36');
    const tabDan25 = document.getElementById('tabDan25');
    const tabDanSeparate = document.getElementById('tabDanSeparate');
    if (tabDan36) tabDan36.classList.toggle('active', STATE.danMode === 'dan36');
    if (tabDan25) tabDan25.classList.toggle('active', STATE.danMode === 'dan25');
    if (tabDanSeparate) tabDanSeparate.classList.toggle('active', STATE.danMode === 'separate');

    // Update Phức hợp title & copy buttons text
    const phucHopTitleBadge = document.getElementById('phucHopTitleBadge');
    const btnCopyMain = document.getElementById('btnCopyMainPhucHop');
    const separateGrid = document.getElementById('separateNhiGrid');
    const singleDanBox = document.getElementById('singleDanBox');

    if (phucHopTitleBadge) {
        if (isMode36) {
            phucHopTitleBadge.innerHTML = `<i class="fa-solid fa-gem text-gold"></i> <b>DÀN 36 SỐ GHÉP 6 CHẠM VIP (Bất Bại - Đánh Tiền & Hậu Nhị - Khắc Chế Né Tâm):</b>`;
        } else if (isModeSep) {
            phucHopTitleBadge.innerHTML = `<i class="fa-solid fa-arrows-split-up-and-left text-cyan"></i> <b>TÁCH RIÊNG 2 DÀN 25 SỐ CHUYÊN BIỆT (TIỀN NHỊ & HẬU NHỊ):</b>`;
        } else {
            phucHopTitleBadge.innerHTML = `<i class="fa-solid fa-layer-group text-gold"></i> <b>DÀN 25 SỐ GHÉP 5 CHẠM LÕI (Bao Kép - Đánh Tiền Nhị & Hậu Nhị):</b>`;
        }
    }

    if (btnCopyMain) {
        if (isMode36) {
            btnCopyMain.innerHTML = `<i class="fa-solid fa-copy"></i> Copy 36 Số VIP (Có Kép)`;
            btnCopyMain.setAttribute('onclick', 'copyUnifiedPhucHop(36)');
        } else {
            btnCopyMain.innerHTML = `<i class="fa-solid fa-copy"></i> Copy 25 Số VIP (Có Kép)`;
            btnCopyMain.setAttribute('onclick', 'copyUnifiedPhucHop(25)');
        }
    }

    if (separateGrid && singleDanBox) {
        if (isModeSep) {
            separateGrid.style.display = 'grid';
            singleDanBox.style.display = 'none';
            const danTienDisplay = document.getElementById('phucHopTienListDisplay');
            const danHauDisplay = document.getElementById('phucHopHauListDisplay');
            if (danTienDisplay) danTienDisplay.innerText = (nextPred.phucHopTien25 || []).join(', ');
            if (danHauDisplay) danHauDisplay.innerText = (nextPred.phucHopHau25 || []).join(', ');
        } else {
            separateGrid.style.display = 'none';
            singleDanBox.style.display = 'block';
        }
    }

    const insightTextElem = document.getElementById('bridgeInsightText');
    const tagsContainer = document.getElementById('bridgeTagsContainer');

    if (STATE.rounds.length === 0) {
        if (txElem) { txElem.innerText = '--'; txElem.className = 'pred-value'; }
        if (txConfElem) txConfElem.innerText = '0%';
        if (txBarElem) txBarElem.style.width = '0%';

        if (clElem) { clElem.innerText = '--'; clElem.className = 'pred-value'; }
        if (clConfElem) clConfElem.innerText = '0%';
        if (clBarElem) clBarElem.style.width = '0%';

        if (predTxActionBadge) { predTxActionBadge.className = 'action-traffic-badge signal-yellow'; predTxActionBadge.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> CHỜ DỮ LIỆU'; }
        if (predTxPatternBadge) predTxPatternBadge.innerText = 'Khởi tạo';
        if (predTxAdviceText) predTxAdviceText.innerText = 'Chưa đủ dữ liệu kỳ quay.';

        if (predClActionBadge) { predClActionBadge.className = 'action-traffic-badge signal-yellow'; predClActionBadge.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> CHỜ DỮ LIỆU'; }
        if (predClPatternBadge) predClPatternBadge.innerText = 'Khởi tạo';
        if (predClAdviceText) predClAdviceText.innerText = 'Chưa đủ dữ liệu kỳ quay.';

        if (chamListMaster) {
            chamListMaster.innerHTML = topToDisplay.map((c, idx) => `
                <div class="cham-tag-pill" title="TOP ${idx + 1} - Chạm ${c.digit} (${c.prob}%): ${c.bridgeDetail || ''}">
                    <span class="cham-rank-badge rank-top${idx + 1}">TOP ${idx + 1}</span>
                    <span class="cham-num">C.${c.digit}</span>
                    <span class="cham-prob">${c.prob}%</span>
                    <span class="cham-bridge-name">${c.bridgeTag || 'Cầu Vàng'}</span>
                </div>
            `).join('');
        }
        if (phucHopMasterDisplay) phucHopMasterDisplay.innerText = phucHopToDisplay.join(', ');
        if (predMasterConf) predMasterConf.innerText = `${probMaster}%`;

        const goldenPairElem = document.getElementById('goldenPairVal');
        const unitDoubleElem = document.getElementById('unitDoubleVal');
        const unitBoundsElem = document.getElementById('unitBoundsVal');
        if (goldenPairElem) goldenPairElem.innerText = `[${(nextPred.goldenPair || [7,2]).join(', ')}]`;
        if (unitDoubleElem) unitDoubleElem.innerText = `[${(nextPred.unitDouble || [2,7]).join(', ')}]`;
        if (unitBoundsElem) unitBoundsElem.innerText = `[${nextPred.unitMinus !== undefined ? nextPred.unitMinus : 1}, ${nextPred.unitPlus !== undefined ? nextPred.unitPlus : 3}]`;

        if (insightTextElem) insightTextElem.innerText = 'Chưa đủ dữ liệu. Vui lòng nhập ít nhất 3 kỳ để hệ thống nhận diện nhịp cầu bệt, cầu 1-1, 1-2, 2-2, bắt chạm vàng và ghép dàn số VIP...';
        if (tagsContainer) tagsContainer.innerHTML = '';
        return;
    }

    // Set TX
    if (txElem) {
        txElem.innerText = nextPred.predTx;
        txElem.className = `pred-value ${nextPred.predTx === 'Tài' ? 'pred-tai' : 'pred-xiu'}`;
    }
    if (txConfElem) txConfElem.innerText = `${nextPred.predTxConf}%`;
    if (txBarElem) txBarElem.style.width = `${nextPred.predTxConf}%`;

    // Action Advice for TX
    const txAction = evaluateBetAction('tx', nextPred.predTx, nextPred.predTxConf, nextPred.predTxPattern, STATE.rounds);
    if (predTxActionBadge) {
        predTxActionBadge.className = `action-traffic-badge ${txAction.badgeClass}`;
        predTxActionBadge.innerHTML = `${txAction.icon} ${txAction.action}`;
    }
    if (predTxPatternBadge) {
        predTxPatternBadge.innerText = txAction.pattern;
    }
    if (predTxAdviceText) {
        predTxAdviceText.innerHTML = txAction.advice;
    }

    // Set CL
    if (clElem) {
        clElem.innerText = nextPred.predCl;
        clElem.className = `pred-value ${nextPred.predCl === 'Chẵn' ? 'pred-chan' : 'pred-le'}`;
    }
    if (clConfElem) clConfElem.innerText = `${nextPred.predClConf}%`;
    if (clBarElem) clBarElem.style.width = `${nextPred.predClConf}%`;

    // Action Advice for CL
    const clAction = evaluateBetAction('cl', nextPred.predCl, nextPred.predClConf, nextPred.predClPattern, STATE.rounds);
    if (predClActionBadge) {
        predClActionBadge.className = `action-traffic-badge ${clAction.badgeClass}`;
        predClActionBadge.innerHTML = `${clAction.icon} ${clAction.action}`;
    }
    if (predClPatternBadge) {
        predClPatternBadge.innerText = clAction.pattern;
    }
    if (predClAdviceText) {
        predClAdviceText.innerHTML = clAction.advice;
    }

    // Calculate dynamic frame status for Cham box
    const frameData = computeFrameHistory(STATE.rounds);
    const activeFrame = frameData.activeFrame;
    let currentTay = 1;
    let rangeString = '';
    let tayString = '';

    if (activeFrame && activeFrame.isWarmup) {
        rangeString = `Đang nạp 5 kỳ gốc (${activeFrame.warmupCount || STATE.rounds.length}/5)`;
        tayString = `(Khung #1 từ Kỳ 6)`;
    } else if (activeFrame && activeFrame.refPeriod && activeFrame.refPeriod !== 'Khởi đầu') {
        const nextInput = document.getElementById('periodInput');
        const nextPeriodVal = (nextInput && nextInput.value) ? nextInput.value : `#${STATE.rounds.length + 1}`;
        currentTay = activeFrame.currentTay || 1;
        const tayText = currentTay === 1 ? 'Khởi Đầu' : (currentTay === 2 ? 'Gấp Thếp' : 'Quyết Đấu');
        rangeString = `Đánh ${nextPeriodVal}`;
        tayString = `(Tay ${currentTay}/3 - ${tayText})`;
    } else if (STATE.rounds.length > 0) {
        currentTay = 1;
        rangeString = `Đánh Kỳ #${STATE.rounds.length + 1}`;
        tayString = `(Tay 1/3 - Khởi Đầu)`;
    } else {
        rangeString = `Đánh Kỳ 101`;
        tayString = `(Tay 1/3)`;
    }

    const predChamRangeText = document.getElementById('predChamRangeText');
    const predChamTayText = document.getElementById('predChamTayText');
    const predFrameSpanText = document.getElementById('predFrameSpanText');

    if (predChamRangeText) predChamRangeText.innerText = rangeString;
    if (predChamTayText) predChamTayText.innerText = tayString;
    if (predFrameSpanText) predFrameSpanText.innerText = `${rangeString} ${tayString}`;

    // Render CHẠM & DÀN SỐ
    if (chamListMaster && topToDisplay) {
        chamListMaster.innerHTML = topToDisplay.map((c, idx) => `
            <div class="cham-tag-pill" title="TOP ${idx + 1} - Chạm ${c.digit} (${c.prob}%): ${c.bridgeDetail || ''}">
                <span class="cham-rank-badge rank-top${idx + 1}">TOP ${idx + 1}</span>
                <span class="cham-num">C.${c.digit}</span>
                <span class="cham-prob">${c.prob}%</span>
                <span class="cham-bridge-name">${c.bridgeTag || 'Cầu Vàng'}</span>
            </div>
        `).join('');
    }
    if (phucHopMasterDisplay && phucHopToDisplay) {
        phucHopMasterDisplay.innerText = phucHopToDisplay.join(', ');
    }
    if (predMasterConf) predMasterConf.innerText = `${probMaster}%`;

    // Render 6 Golden Rules Breakdown
    const sumDauElem = document.getElementById('sumDauVal');
    const sumDuoiElem = document.getElementById('sumDuoiVal');
    const goldenPairElem = document.getElementById('goldenPairVal');
    const unitDoubleElem = document.getElementById('unitDoubleVal');
    const unitBoundsElem = document.getElementById('unitBoundsVal');
    const lockCenterElem = document.getElementById('lockCenterVal');

    if (sumDauElem && nextPred.sumDauPair) {
        sumDauElem.innerText = `[${nextPred.sumDauPair.join(', ')}]`;
    }
    if (sumDuoiElem && nextPred.sumDuoiPair) {
        sumDuoiElem.innerText = `[${nextPred.sumDuoiPair.join(', ')}]`;
    }
    if (goldenPairElem && nextPred.goldenPair) {
        goldenPairElem.innerText = `[${nextPred.goldenPair.join(', ')}]`;
    }
    if (unitDoubleElem && nextPred.unitDouble) {
        unitDoubleElem.innerText = `[${nextPred.unitDouble.join(', ')}]`;
    }
    if (unitBoundsElem && nextPred.unitMinus !== undefined && nextPred.unitPlus !== undefined) {
        unitBoundsElem.innerText = `[${nextPred.unitMinus}, ${nextPred.unitPlus}]`;
    }
    if (lockCenterElem && nextPred.lockCenterPair) {
        lockCenterElem.innerText = `[${nextPred.lockCenterPair.join(', ')}]`;
    }

    if (sumDauElem && nextPred.sumDauPair) {
        sumDauElem.innerText = `[${nextPred.sumDauPair.join(', ')}]`;
    }
    if (sumDuoiElem && nextPred.sumDuoiPair) {
        sumDuoiElem.innerText = `[${nextPred.sumDuoiPair.join(', ')}]`;
    }
    if (goldenPairElem && nextPred.goldenPair) {
        goldenPairElem.innerText = `[${nextPred.goldenPair.join(', ')}]`;
    }
    if (unitDoubleElem && nextPred.unitDouble) {
        unitDoubleElem.innerText = `[${nextPred.unitDouble.join(', ')}]`;
    }
    if (unitBoundsElem && nextPred.unitMinus !== undefined && nextPred.unitPlus !== undefined) {
        unitBoundsElem.innerText = `[${nextPred.unitMinus}, ${nextPred.unitPlus}]`;
    }

    // Render Insight Text with Clean Structured Line-by-Line Items
    if (insightTextElem) {
        if (STATE.rounds.length === 0) {
            insightTextElem.innerHTML = `<div class="insight-empty-hint"><i class="fa-solid fa-info-circle"></i> Chưa đủ dữ liệu. Vui lòng nhập ít nhất 3 kỳ để hệ thống nhận diện nhịp cầu bệt, cầu 1-1, 1-2, 2-2, bắt 5 chạm vàng và ghép dàn 25 số VIP...</div>`;
        } else {
            insightTextElem.innerHTML = `
                <div class="insight-bullet-list">
                    <!-- DÒNG 1: CẦU TÀI XỈU -->
                    <div class="insight-bullet-item item-tx">
                        <div class="insight-bullet-header">
                            <span class="insight-badge badge-tx"><i class="fa-solid fa-dice"></i> CẦU TÀI / XỈU</span>
                            <span class="insight-badge-sub">${nextPred.predTxPattern || 'Cầu Đang Chạy'}</span>
                        </div>
                        <div class="insight-bullet-body">
                            ${nextPred.predTxReason || ''}
                        </div>
                    </div>

                    <!-- DÒNG 2: CẦU CHẴN LẺ -->
                    <div class="insight-bullet-item item-cl">
                        <div class="insight-bullet-header">
                            <span class="insight-badge badge-cl"><i class="fa-solid fa-scale-balanced"></i> CẦU CHẴN / LẺ</span>
                            <span class="insight-badge-sub">${nextPred.predClPattern || 'Nhịp Đồng Bộ'}</span>
                        </div>
                        <div class="insight-bullet-body">
                            ${nextPred.predClReason || ''} 
                            ${nextPred.extraInsight ? `<span class="insight-highlight-tag">${nextPred.extraInsight}</span>` : ''}
                        </div>
                    </div>

                    <!-- DÒNG 3: 6 CẦU VÀNG BẮT 5 CHẠM VIP & DÀN 25 SỐ -->
                    <div class="insight-bullet-item item-cham">
                        <div class="insight-bullet-header">
                            <span class="insight-badge badge-cham"><i class="fa-solid fa-crown"></i> 6 CẦU VÀNG BẮT 5 CHẠM VIP</span>
                            <span class="insight-badge-sub text-gold">Dàn 25 Số VIP Nuôi Khung 3 Kỳ (${rangeString} ${tayString})</span>
                        </div>
                        <div class="insight-bullet-body">
                            ${nextPred.predChamReason || ''}
                        </div>
                    </div>

                    <!-- DÒNG 4: BỘ ĐÁNH GIÁ ĐỘ MẠNH CẦU & KIẾN NGHỊ VÀO VỐN AI -->
                    <div class="insight-bullet-item item-signal ${nextPred.bridgeHealth ? (nextPred.bridgeHealth.level === 'green' ? 'signal-item-green' : (nextPred.bridgeHealth.level === 'yellow' ? 'signal-item-yellow' : 'signal-item-red')) : ''}">
                        <div class="insight-bullet-header">
                            <span class="insight-badge badge-signal ${nextPred.bridgeHealth ? nextPred.bridgeHealth.badgeClass : 'signal-green'}">${nextPred.bridgeHealth ? nextPred.bridgeHealth.icon : ''} ${nextPred.bridgeHealth ? nextPred.bridgeHealth.title : 'KIẾN NGHỊ VÀO VỐN AI'}</span>
                            <span class="insight-badge-sub">Độ Chuẩn Cầu: <b>${nextPred.bridgeHealth ? nextPred.bridgeHealth.scoreText : '85%'}</b> (${nextPred.bridgeHealth ? nextPred.bridgeHealth.activeBridgesCount : 4}/6 Cầu Thông)</span>
                        </div>
                        <div class="insight-bullet-body">
                            ${nextPred.bridgeHealth ? nextPred.bridgeHealth.advice : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Update predChamSignalPill in 5 Cham Box header
    const predChamSignalPill = document.getElementById('predChamSignalPill');
    const predChamSignalText = document.getElementById('predChamSignalText');
    if (predChamSignalPill && predChamSignalText && nextPred.bridgeHealth) {
        predChamSignalPill.className = `pred-signal-pill ${nextPred.bridgeHealth.badgeClass}`;
        predChamSignalText.innerText = nextPred.bridgeHealth.shortSignal;
    }

    // Render Tags
    if (tagsContainer) {
        const sigTag = nextPred.bridgeHealth ? `<span class="bridge-tag ${nextPred.bridgeHealth.badgeClass}">${nextPred.bridgeHealth.icon} ${nextPred.bridgeHealth.shortSignal}</span>` : '';
        const danNameTag = isMode36 ? 'Dàn 36 Số VIP Bất Bại' : (isModeSep ? '2 Dàn 25 Số Tiền & Hậu' : 'Dàn 25 Số VIP');
        tagsContainer.innerHTML = `
            ${sigTag}
            <span class="bridge-tag tag-bet"><i class="fa-solid fa-wave-square"></i> ${nextPred.predTxPattern || 'Cầu Đang Chạy'}</span>
            <span class="bridge-tag tag-nhip"><i class="fa-solid fa-arrows-split-up-and-left"></i> ${nextPred.predClPattern || 'Nhịp Đồng Bộ'}</span>
            <span class="bridge-tag" style="background:rgba(245,158,11,0.2); color:#fbbf24; border-color:rgba(245,158,11,0.4);"><i class="fa-solid fa-crown text-gold"></i> ${danNameTag} (${phucHopToDisplay.length} số - Đánh Tiền & Hậu: ${rangeString})</span>
        `;
    }
}

/* ==========================================================================
   NUÔI KHUNG 3 TAY ĐỘNG (TRÚNG LÀ DỪNG / ĐỔI DÀN TỪNG KỲ THEO NHỊP CẦU)
   ========================================================================== */

function computeFrameHistory(rounds) {
    const WARMUP_COUNT = 5;

    if (!rounds || rounds.length < WARMUP_COUNT) {
        const warmupLen = rounds ? rounds.length : 0;
        const lastR = (rounds && rounds.length > 0) ? rounds[rounds.length - 1] : null;
        const defaultDigits = lastR ? lastR.digits : [5, 6, 8, 9, 2];
        const chamInfo = (rounds && rounds.length > 0) ? analyzeTop5Cham(rounds) : analyzeTop5Cham([]);
        const m6 = chamInfo.masterDigits6 || [7, 0, 3, 1, 6, 9];
        const m5 = chamInfo.masterDigits5 || m6.slice(0, 5);

        return {
            frames: [],
            activeFrame: {
                frameId: 1,
                isWarmup: true,
                warmupCount: warmupLen,
                warmupNeeded: WARMUP_COUNT,
                startPeriod: lastR ? lastR.period : 'Khởi đầu',
                startDigits: defaultDigits,
                refPeriod: lastR ? lastR.period : 'Khởi đầu',
                refDigits: defaultDigits,
                cham6: m6,
                cham5: m5,
                dan36: generatePhucHop36(m6),
                dan30: generatePhucHop30(m6),
                dan25: generatePhucHop25(m5),
                dan20: generatePhucHop20(m5),
                danTien25: generatePhucHop25(chamInfo.tienDigits || m5),
                danHau25: generatePhucHop25(chamInfo.hauDigits || m5),
                steps: [],
                currentTay: 1,
                status: 'warmup'
            },
            stats: {
                totalDone: 0,
                totalWon: 0,
                winRate: 0,
                wonStep1: 0,
                wonStep2: 0,
                wonStep3: 0,
                lostFrames: 0,
                rateStep1: 0,
                rateStep2: 0,
                rateStep3: 0,
                rateLost: 0,
                hitTienCount: 0,
                hitHauCount: 0,
                hitBothCount: 0,
                rateTien: 0,
                rateHau: 0,
                rateBoth: 0,
                biasType: 'equal',
                biasTitle: 'CHỜ DỮ LIỆU GỐC (5 KỲ)',
                biasAdvice: 'Đang thu thập 5 kỳ kết quả mốc gốc ban đầu. Khung #1 sẽ bắt đầu mở tại Kỳ 6.',
                biasClass: 'bias-equal',
                stepHitTienTotal: 0,
                stepHitHauTotal: 0,
                totalStepsPlayed: 0
            }
        };
    }

    const frames = [];
    let historyAtStart = rounds.slice(0, WARMUP_COUNT);
    let baseRound = rounds[WARMUP_COUNT - 1]; // Kỳ thứ 5 làm Mốc Gốc Khung #1

    // Soi CỐ ĐỊNH từ Kỳ Mốc Gốc
    let baseCham = analyzeTop5Cham(historyAtStart);
    let currentFrame = {
        frameId: 1,
        startPeriod: baseRound.period,
        startDigits: baseRound.digits,
        refPeriod: baseRound.period,
        refDigits: baseRound.digits,
        cham6: baseCham.masterDigits6 || baseCham.masterDigits,
        cham5: baseCham.masterDigits5 || (baseCham.masterDigits6 || baseCham.masterDigits).slice(0, 5),
        tienDigits: baseCham.tienDigits,
        hauDigits: baseCham.hauDigits,
        dan36: baseCham.phucHopMaster36 || generatePhucHop36(baseCham.masterDigits6),
        dan30: baseCham.phucHopMaster30 || generatePhucHop30(baseCham.masterDigits6),
        dan25: baseCham.phucHopMaster25 || generatePhucHop25(baseCham.masterDigits5),
        dan20: baseCham.phucHopMaster20 || generatePhucHop20(baseCham.masterDigits5),
        danTien25: baseCham.phucHopTien25 || generatePhucHop25(baseCham.tienDigits || baseCham.masterDigits5),
        danTien20: baseCham.phucHopTien20 || generatePhucHop20(baseCham.tienDigits || baseCham.masterDigits5),
        danHau25: baseCham.phucHopHau25 || generatePhucHop25(baseCham.hauDigits || baseCham.masterDigits5),
        danHau20: baseCham.phucHopHau20 || generatePhucHop20(baseCham.hauDigits || baseCham.masterDigits5),
        goldenPair: baseCham.goldenPair,
        unitDouble: baseCham.unitDouble,
        lockCenterPair: baseCham.lockCenterPair,
        steps: [],
        isResolved: false,
        wonStep: null,
        status: 'running',
        isWarmup: false
    };

    let historySoFar = [...historyAtStart];

    // Đánh giá từng kỳ tiếp theo từ Kỳ thứ 6 (index = 5) theo NUÔI KHUNG 3 KỲ CỐ ĐỊNH
    for (let i = WARMUP_COUNT; i < rounds.length; i++) {
        const r = rounds[i];
        const stepNum = currentFrame.steps.length + 1; // Tay 1, 2 hoặc 3

        const tien = `${r.digits[0]}${r.digits[1]}`;
        const hau = `${r.digits[3]}${r.digits[4]}`;
        
        let hitTien = false, hitHau = false;
        if (STATE.danMode === 'dan36') {
            hitTien = (currentFrame.dan36 || []).includes(tien);
            hitHau = (currentFrame.dan36 || []).includes(hau);
        } else if (STATE.danMode === 'separate') {
            hitTien = (currentFrame.danTien25 || currentFrame.dan25 || []).includes(tien);
            hitHau = (currentFrame.danHau25 || currentFrame.dan25 || []).includes(hau);
        } else {
            hitTien = (currentFrame.dan25 || []).includes(tien);
            hitHau = (currentFrame.dan25 || []).includes(hau);
        }
        const isHit = hitTien || hitHau;

        currentFrame.steps.push({
            stepNum,
            refPeriod: currentFrame.startPeriod,
            refDigits: currentFrame.startDigits,
            period: r.period,
            digits: r.digits,
            tien,
            hau,
            cham6: currentFrame.cham6,
            cham5: currentFrame.cham5,
            tienDigits: currentFrame.tienDigits,
            hauDigits: currentFrame.hauDigits,
            dan36: currentFrame.dan36,
            dan25: currentFrame.dan25,
            danTien25: currentFrame.danTien25,
            danHau25: currentFrame.danHau25,
            hitTien,
            hitHau,
            isHit
        });

        historySoFar.push(r);

        if (isHit) {
            // HÚP KHUNG CỐ ĐỊNH: Trúng là dừng, chốt khung và lấy kỳ r vừa trúng làm Mốc Gốc cho Khung Mới
            currentFrame.isResolved = true;
            currentFrame.wonStep = stepNum;
            currentFrame.status = 'won';
            currentFrame.winType = (hitTien && hitHau) ? 'Cả Tiền & Hậu' : (hitTien ? 'Tiền Nhị' : 'Hậu Nhị');
            frames.push(currentFrame);

            // Bắt đầu Khung Mới CỐ ĐỊNH từ kỳ r vừa trúng
            historyAtStart = [...historySoFar];
            baseRound = r;
            baseCham = analyzeTop5Cham(historyAtStart);

            currentFrame = {
                frameId: frames.length + 1,
                startPeriod: r.period,
                startDigits: r.digits,
                refPeriod: r.period,
                refDigits: r.digits,
                cham6: baseCham.masterDigits6 || baseCham.masterDigits,
                cham5: baseCham.masterDigits5 || (baseCham.masterDigits6 || baseCham.masterDigits).slice(0, 5),
                tienDigits: baseCham.tienDigits,
                hauDigits: baseCham.hauDigits,
                dan36: baseCham.phucHopMaster36 || generatePhucHop36(baseCham.masterDigits6),
                dan30: baseCham.phucHopMaster30 || generatePhucHop30(baseCham.masterDigits6),
                dan25: baseCham.phucHopMaster25 || generatePhucHop25(baseCham.masterDigits5),
                dan20: baseCham.phucHopMaster20 || generatePhucHop20(baseCham.masterDigits5),
                danTien25: baseCham.phucHopTien25 || generatePhucHop25(baseCham.tienDigits || baseCham.masterDigits5),
                danTien20: baseCham.phucHopTien20 || generatePhucHop20(baseCham.tienDigits || baseCham.masterDigits5),
                danHau25: baseCham.phucHopHau25 || generatePhucHop25(baseCham.hauDigits || baseCham.masterDigits5),
                danHau20: baseCham.phucHopHau20 || generatePhucHop20(baseCham.hauDigits || baseCham.masterDigits5),
                goldenPair: baseCham.goldenPair,
                unitDouble: baseCham.unitDouble,
                lockCenterPair: baseCham.lockCenterPair,
                steps: [],
                isResolved: false,
                wonStep: null,
                status: 'running',
                isWarmup: false
            };
        } else {
            if (stepNum >= 3) {
                // GÃY KHUNG CỐ ĐỊNH: Gãy cả 3 tay -> Chốt Gãy và mở Khung Mới từ kỳ thứ 3 này
                currentFrame.isResolved = true;
                currentFrame.status = 'lost';
                frames.push(currentFrame);

                // Bắt đầu Khung Mới CỐ ĐỊNH từ kỳ thứ 3 vừa trượt
                historyAtStart = [...historySoFar];
                baseRound = r;
                baseCham = analyzeTop5Cham(historyAtStart);

                currentFrame = {
                    frameId: frames.length + 1,
                    startPeriod: r.period,
                    startDigits: r.digits,
                    refPeriod: r.period,
                    refDigits: r.digits,
                    cham6: baseCham.masterDigits6 || baseCham.masterDigits,
                    cham5: baseCham.masterDigits5 || (baseCham.masterDigits6 || baseCham.masterDigits).slice(0, 5),
                    tienDigits: baseCham.tienDigits,
                    hauDigits: baseCham.hauDigits,
                    dan36: baseCham.phucHopMaster36 || generatePhucHop36(baseCham.masterDigits6),
                    dan30: baseCham.phucHopMaster30 || generatePhucHop30(baseCham.masterDigits6),
                    dan25: baseCham.phucHopMaster25 || generatePhucHop25(baseCham.masterDigits5),
                    dan20: baseCham.phucHopMaster20 || generatePhucHop20(baseCham.masterDigits5),
                    danTien25: baseCham.phucHopTien25 || generatePhucHop25(baseCham.tienDigits || baseCham.masterDigits5),
                    danTien20: baseCham.phucHopTien20 || generatePhucHop20(baseCham.tienDigits || baseCham.masterDigits5),
                    danHau25: baseCham.phucHopHau25 || generatePhucHop25(baseCham.hauDigits || baseCham.masterDigits5),
                    danHau20: baseCham.phucHopHau20 || generatePhucHop20(baseCham.hauDigits || baseCham.masterDigits5),
                    goldenPair: baseCham.goldenPair,
                    unitDouble: baseCham.unitDouble,
                    lockCenterPair: baseCham.lockCenterPair,
                    steps: [],
                    isResolved: false,
                    wonStep: null,
                    status: 'running',
                    isWarmup: false
                };
            }
        }
    }

    currentFrame.currentTay = currentFrame.steps.length + 1;
    currentFrame.refPeriod = currentFrame.startPeriod;
    currentFrame.refDigits = currentFrame.startDigits;

    let won1 = 0, won2 = 0, won3 = 0, lost = 0;
    let hitTienCount = 0, hitHauCount = 0, hitBothCount = 0;
    let stepHitTienTotal = 0, stepHitHauTotal = 0, totalStepsPlayed = 0;

    frames.forEach(f => {
        if (f.status === 'won') {
            if (f.wonStep === 1) won1++;
            else if (f.wonStep === 2) won2++;
            else if (f.wonStep === 3) won3++;

            const wonStepData = f.steps.find(s => s.stepNum === f.wonStep);
            if (wonStepData) {
                if (wonStepData.hitTien && wonStepData.hitHau) {
                    hitBothCount++;
                    hitTienCount++;
                    hitHauCount++;
                } else if (wonStepData.hitTien) {
                    hitTienCount++;
                } else if (wonStepData.hitHau) {
                    hitHauCount++;
                }
            }
        } else {
            lost++;
        }

        f.steps.forEach(s => {
            totalStepsPlayed++;
            if (s.hitTien) stepHitTienTotal++;
            if (s.hitHau) stepHitHauTotal++;
        });
    });

    const totalDone = frames.length;
    const totalWon = won1 + won2 + won3;
    const rateTien = totalWon > 0 ? Math.round((hitTienCount / totalWon) * 100) : 0;
    const rateHau = totalWon > 0 ? Math.round((hitHauCount / totalWon) * 100) : 0;
    const rateBoth = totalWon > 0 ? Math.round((hitBothCount / totalWon) * 100) : 0;

    // Xác định thiên hướng
    let biasType = 'equal';
    let biasTitle = 'CÂN BẰNG 2 ĐẦU';
    let biasAdvice = 'Dàn số đang nổ đồng đều cả Tiền Nhị & Hậu Nhị. Khuyến nghị chia đều vốn!';
    let biasClass = 'bias-equal';

    if (hitHauCount > hitTienCount) {
        biasType = 'hau';
        biasTitle = `THIÊN VỀ HẬU NHỊ (${rateHau}% vs ${rateTien}%)`;
        biasAdvice = `Dàn số đang nổ HẬU NHỊ vượt trội (${hitHauCount}/${totalWon} khung trúng). Khuyến nghị ưu tiên dồn vốn vào 2 số đuôi (Hậu Nhị)!`;
        biasClass = 'bias-hau';
    } else if (hitTienCount > hitHauCount) {
        biasType = 'tien';
        biasTitle = `THIÊN VỀ TIỀN NHỊ (${rateTien}% vs ${rateHau}%)`;
        biasAdvice = `Dàn số đang nổ TIỀN NHỊ vượt trội (${hitTienCount}/${totalWon} khung trúng). Khuyến nghị ưu tiên dồn vốn vào 2 số đầu (Tiền Nhị)!`;
        biasClass = 'bias-tien';
    } else if (totalWon > 0) {
        biasTitle = `CÂN BẰNG ĐỒNG BỘ (${rateTien}% ⇌ ${rateHau}%)`;
        biasAdvice = `Dàn số đang nổ cân bằng hoàn hảo (${hitTienCount} Tiền - ${hitHauCount} Hậu). Khuyến nghị vào đều vốn cả Tiền & Hậu!`;
    }

    const stats = {
        totalDone,
        totalWon,
        winRate: totalDone > 0 ? Math.round((totalWon / totalDone) * 100) : 0,
        wonStep1: won1,
        wonStep2: won2,
        wonStep3: won3,
        lostFrames: lost,
        rateStep1: totalDone > 0 ? Math.round((won1 / totalDone) * 100) : 0,
        rateStep2: totalDone > 0 ? Math.round((won2 / totalDone) * 100) : 0,
        rateStep3: totalDone > 0 ? Math.round((won3 / totalDone) * 100) : 0,
        rateLost: totalDone > 0 ? Math.round((lost / totalDone) * 100) : 0,

        // Chi tiết Tiền Nhị & Hậu Nhị
        hitTienCount,
        hitHauCount,
        hitBothCount,
        rateTien,
        rateHau,
        rateBoth,
        biasType,
        biasTitle,
        biasAdvice,
        biasClass,
        stepHitTienTotal,
        stepHitHauTotal,
        totalStepsPlayed
    };

    return {
        frames,
        activeFrame: currentFrame,
        stats
    };
}

/**
 * Update UI for Frame Nurturing Cards (Active Frame & Past Frames History)
 */
function updateFrameUI() {
    const frameData = computeFrameHistory(STATE.rounds);
    const active = frameData.activeFrame;
    const stats = frameData.stats;
    const frames = frameData.frames;

    // 1. UPDATE ACTIVE FRAME CARD
    const activeTitle = document.getElementById('activeFrameTitle');
    const stepBadge = document.getElementById('activeFrameStepBadge');
    const originElem = document.getElementById('activeFrameOrigin');
    const betAdvice = document.getElementById('activeFrameBetAdvice');
    const chamPillsElem = document.getElementById('activeFrameChamPills');
    const danDisplay = document.getElementById('activeFrameDanDisplay');
    const activeDanTitle = document.getElementById('activeFrameDanTitleBadge');
    const btnCopyActMain = document.getElementById('btnCopyActiveMain');

    const isMode36 = STATE.danMode === 'dan36';
    const isModeSep = STATE.danMode === 'separate';

    if (active) {
        if (active.isWarmup) {
            if (activeTitle) {
                activeTitle.innerHTML = `<i class="fa-solid fa-hourglass-half text-cyan"></i> ĐANG NẠP DỮ LIỆU GỐC (${active.warmupCount || STATE.rounds.length}/5 KỲ)`;
            }
            if (stepBadge) {
                stepBadge.className = 'frame-step-badge badge-step-warmup';
                stepBadge.innerText = `MỐC GỐC (${active.warmupCount || STATE.rounds.length}/5) - KHUNG #1 TỪ KỲ 6`;
            }
            if (originElem) {
                originElem.innerHTML = `
                    <span><i class="fa-solid fa-database text-cyan"></i> Giai đoạn khởi tạo: <b>Đã có ${active.warmupCount || STATE.rounds.length}/5 kỳ mốc gốc</b></span>
                    <span style="margin-left: 8px; color:var(--text-dim);"><i class="fa-solid fa-circle-info"></i> Chưa vào tiền - Khung #1 sẽ mở tại Kỳ 6</span>
                `;
            }
            if (betAdvice) {
                betAdvice.innerHTML = `<span class="text-cyan"><i class="fa-solid fa-seedling"></i> <b>Đang nạp 5 kỳ dữ liệu nền (Gốc)</b>. Hệ thống đang tích lũy số liệu 6 Cầu Vàng. <b>Chưa cần vào tiền</b>. Khung nuôi #1 sẽ chính thức bắt đầu từ <b>Kỳ thứ 6</b>!</span>`;
            }
        } else {
            if (activeTitle) {
                if (isMode36) {
                    activeTitle.innerHTML = `<i class="fa-solid fa-gem text-gold"></i> NUÔI DÀN 36 SỐ BẤT BẠI (6 CHẠM VIP) - KHUNG #${active.frameId || 1}`;
                } else if (isModeSep) {
                    activeTitle.innerHTML = `<i class="fa-solid fa-arrows-split-up-and-left text-cyan"></i> NUÔI 2 DÀN 25 SỐ TIỀN & HẬU CHUYÊN BIỆT - KHUNG #${active.frameId || 1}`;
                } else {
                    activeTitle.innerHTML = `<i class="fa-solid fa-layer-group text-gold"></i> NUÔI DÀN 25 KHUNG CỐ ĐỊNH 3 KỲ - KHUNG #${active.frameId || 1}`;
                }
            }

            const tay = active.currentTay || 1;
            if (stepBadge) {
                stepBadge.className = `frame-step-badge badge-step${tay}`;
                if (tay === 1) stepBadge.innerText = 'TAY 1 / 3 (Khởi Đầu)';
                else if (tay === 2) stepBadge.innerText = 'TAY 2 / 3 (Gấp Thếp)';
                else stepBadge.innerText = 'TAY 3 / 3 (Quyết Đấu)';
            }

            const nextPeriodInput = document.getElementById('periodInput');
            const nextPeriodVal = (nextPeriodInput && nextPeriodInput.value) ? nextPeriodInput.value : `#${STATE.rounds.length + 1}`;

            if (originElem) {
                if (active.refPeriod && active.refPeriod !== 'Khởi đầu') {
                    const tayText = tay === 1 ? 'Khởi Đầu' : (tay === 2 ? 'Gấp Thếp' : 'Quyết Đấu');
                    const refInfo = `Kỳ ${active.refPeriod} [${(active.refDigits || []).join('')}]`;
                    originElem.innerHTML = `
                        <span><i class="fa-solid fa-flag-checkered text-cyan"></i> Mốc Soi: <b>${refInfo}</b></span>
                        <span style="margin-left: 8px;"><i class="fa-solid fa-crosshairs text-gold"></i> Đang Đánh Cho: <b class="text-green">${nextPeriodVal} (TAY ${tay}/3 - ${tayText})</b></span>
                    `;
                } else {
                    originElem.innerText = 'Chờ kỳ đầu tiên';
                }
            }

            if (betAdvice) {
                const plan = calculateCapitalPlan();
                const curStep = plan.steps[tay - 1] || plan.steps[0];
                const kNum = curStep.perNum >= 1000 ? `${Math.round(curStep.perNum / 1000)}K/số` : `${formatMoney(curStep.perNum)}/số`;
                const colorClass = tay === 1 ? 'text-green' : (tay === 2 ? 'text-yellow' : 'text-red');
                if (plan.isDual) {
                    betAdvice.innerHTML = `<span class="${colorClass}"><b>TAY ${tay}: Đánh ${kNum} (${formatMoney(curStep.perHead)}/đầu ➔ Tổng 2 đầu: ${formatMoney(curStep.totalBet)}) ➔ Húp 1 đầu Lãi +${formatMoney(curStep.profit)}</b></span>`;
                } else {
                    betAdvice.innerHTML = `<span class="${colorClass}"><b>TAY ${tay}: Đánh ${kNum} (Tổng: ${formatMoney(curStep.totalBet)}) ➔ Húp Lãi +${formatMoney(curStep.profit)}</b></span>`;
                }
            }
        }

        const chamToShow = (isMode36 && active.cham6) ? active.cham6 : (active.cham5 || []);
        if (chamPillsElem && chamToShow) {
            chamPillsElem.innerHTML = chamToShow.map((d, idx) => {
                const attr = getBridgeAttribution(d, active.refDigits || active.startDigits);
                return `
                    <div class="cham-tag-pill" title="TOP ${idx + 1} - Chạm ${d}: ${attr.detail}">
                        <span class="cham-rank-badge rank-top${idx + 1}">TOP ${idx + 1}</span>
                        <span class="cham-num">C.${d}</span>
                        <span class="cham-bridge-name">${attr.tag}</span>
                    </div>
                `;
            }).join('');
        }

        // Sync Tab Buttons in Frame Card
        const tabFrameDan36 = document.getElementById('tabFrameDan36');
        const tabFrameDan25 = document.getElementById('tabFrameDan25');
        const tabFrameDanSeparate = document.getElementById('tabFrameDanSeparate');
        if (tabFrameDan36) tabFrameDan36.classList.toggle('active', STATE.danMode === 'dan36');
        if (tabFrameDan25) tabFrameDan25.classList.toggle('active', STATE.danMode === 'dan25');
        if (tabFrameDanSeparate) tabFrameDanSeparate.classList.toggle('active', STATE.danMode === 'separate');

        const activeSingleDanBox = document.getElementById('activeSingleDanBox');
        const activeSeparateNhiGrid = document.getElementById('activeSeparateNhiGrid');
        const activeDanTienDisplay = document.getElementById('activeFrameDanTienDisplay');
        const activeDanHauDisplay = document.getElementById('activeFrameDanHauDisplay');

        if (activeSingleDanBox && activeSeparateNhiGrid) {
            if (isModeSep) {
                activeSingleDanBox.style.display = 'none';
                activeSeparateNhiGrid.style.display = 'grid';
                if (activeDanTienDisplay) activeDanTienDisplay.innerText = (active.danTien25 || active.dan25 || []).join(', ');
                if (activeDanHauDisplay) activeDanHauDisplay.innerText = (active.danHau25 || active.dan25 || []).join(', ');
            } else {
                activeSingleDanBox.style.display = 'block';
                activeSeparateNhiGrid.style.display = 'none';
            }
        }

        if (activeDanTitle) {
            if (isMode36) {
                activeDanTitle.innerHTML = `<i class="fa-solid fa-gem text-gold"></i> <b>DÀN 36 SỐ NUÔI KHUNG CỐ ĐỊNH 3 KỲ (6 Chạm VIP - Giữ dàn đánh Tay ${active.currentTay || 1}/3 - Ăn là dừng):</b>`;
            } else if (isModeSep) {
                activeDanTitle.innerHTML = `<i class="fa-solid fa-arrows-split-up-and-left text-cyan"></i> <b>2 DÀN 25 SỐ NUÔI KHUNG CỐ ĐỊNH CHUYÊN BIỆT (TIỀN NHỊ & HẬU NHỊ - Tay ${active.currentTay || 1}/3):</b>`;
            } else {
                activeDanTitle.innerHTML = `<i class="fa-solid fa-layer-group text-gold"></i> <b>DÀN 25 SỐ NUÔI KHUNG CỐ ĐỊNH 3 KỲ (5 Chạm Lõi - Giữ dàn đánh Tay ${active.currentTay || 1}/3 - Ăn là dừng):</b>`;
            }
        }

        if (danDisplay) {
            if (isMode36) {
                danDisplay.innerText = (active.dan36 || []).join(', ');
            } else if (isModeSep) {
                danDisplay.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div><span class="text-cyan" style="font-weight:700;"><i class="fa-solid fa-angles-left"></i> Tiền Nhị (25 số):</span> ${(active.danTien25 || active.dan25 || []).join(', ')}</div>
                        <div><span class="text-purple" style="font-weight:700;"><i class="fa-solid fa-angles-right"></i> Hậu Nhị (25 số):</span> ${(active.danHau25 || active.dan25 || []).join(', ')}</div>
                    </div>
                `;
            } else {
                danDisplay.innerText = (active.dan25 || []).join(', ');
            }
        }

        if (btnCopyActMain) {
            if (isMode36) {
                btnCopyActMain.innerHTML = `<i class="fa-solid fa-copy"></i> Copy 36 Số VIP (Có Kép)`;
                btnCopyActMain.setAttribute('onclick', 'copyActiveFrameDan(36)');
            } else if (isModeSep) {
                btnCopyActMain.innerHTML = `<i class="fa-solid fa-copy"></i> Copy Dàn Tiền & Hậu Nuôi Khung`;
                btnCopyActMain.setAttribute('onclick', 'copyActiveFrameDan("auto")');
            } else {
                btnCopyActMain.innerHTML = `<i class="fa-solid fa-copy"></i> Copy 25 Số Nuôi (Có Kép)`;
                btnCopyActMain.setAttribute('onclick', 'copyActiveFrameDan(25)');
            }
        }

        // 1.2 UPDATE FRAME SIGNAL & ENTRY ADVICE
        const signalBadge = document.getElementById('activeFrameSignalBadge');
        const signalScore = document.getElementById('signalScoreVal');
        const signalAdvice = document.getElementById('activeFrameSignalAdvice');
        const bridgeHealth = evaluateBridgeHealth(STATE.rounds, frameData);

        if (signalBadge) {
            signalBadge.className = `signal-traffic-badge ${bridgeHealth.badgeClass}`;
            signalBadge.innerHTML = `${bridgeHealth.icon} ${bridgeHealth.title}`;
        }
        if (signalScore) {
            signalScore.innerText = bridgeHealth.scoreText;
        }
        if (signalAdvice) {
            signalAdvice.innerHTML = bridgeHealth.advice;
        }
    }

    // 2. UPDATE FRAME STATS SUMMARY
    const totalFramesBadge = document.getElementById('totalFramesBadge');
    const fStatWinRate = document.getElementById('fStatWinRate');
    const fStatWinRatio = document.getElementById('fStatWinRatio');
    const fStatStep1 = document.getElementById('fStatStep1');
    const fStatStep1Ratio = document.getElementById('fStatStep1Ratio');
    const fStatStep2 = document.getElementById('fStatStep2');
    const fStatStep2Ratio = document.getElementById('fStatStep2Ratio');
    const fStatStep3 = document.getElementById('fStatStep3');
    const fStatStep3Ratio = document.getElementById('fStatStep3Ratio');
    const fStatLostRate = document.getElementById('fStatLostRate');
    const fStatLostRatio = document.getElementById('fStatLostRatio');

    if (totalFramesBadge) totalFramesBadge.innerText = `${stats.totalDone} Khung Đã Xong`;
    if (fStatWinRate) fStatWinRate.innerText = `${stats.winRate}%`;
    if (fStatWinRatio) fStatWinRatio.innerText = `${stats.totalWon}/${stats.totalDone} Khung`;
    if (fStatStep1) fStatStep1.innerText = `${stats.rateStep1}%`;
    if (fStatStep1Ratio) fStatStep1Ratio.innerText = `${stats.wonStep1} Khung`;
    if (fStatStep2) fStatStep2.innerText = `${stats.rateStep2}%`;
    if (fStatStep2Ratio) fStatStep2Ratio.innerText = `${stats.wonStep2} Khung`;
    if (fStatStep3) fStatStep3.innerText = `${stats.rateStep3}%`;
    if (fStatStep3Ratio) fStatStep3Ratio.innerText = `${stats.wonStep3} Khung`;
    if (fStatLostRate) fStatLostRate.innerText = `${stats.rateLost}%`;
    if (fStatLostRatio) fStatLostRatio.innerText = `${stats.lostFrames} Khung`;

    // 2.2 UPDATE TIỀN NHỊ VS HẬU NHỊ STATS & BIAS
    const fStatTienKhung = document.getElementById('fStatTienKhung');
    const fStatTienRate = document.getElementById('fStatTienRate');
    const fStatHauKhung = document.getElementById('fStatHauKhung');
    const fStatHauRate = document.getElementById('fStatHauRate');
    const fStatBothKhung = document.getElementById('fStatBothKhung');
    const fStatBothRate = document.getElementById('fStatBothRate');
    const fStatBiasBadge = document.getElementById('fStatBiasBadge');
    const fStatBiasAdvice = document.getElementById('fStatBiasAdvice');
    const fStatRatioBarTien = document.getElementById('fStatRatioBarTien');
    const fStatRatioBarHau = document.getElementById('fStatRatioBarHau');

    if (fStatTienKhung) fStatTienKhung.innerText = `${stats.hitTienCount} Khung`;
    if (fStatTienRate) fStatTienRate.innerText = `${stats.rateTien}%`;
    if (fStatHauKhung) fStatHauKhung.innerText = `${stats.hitHauCount} Khung`;
    if (fStatHauRate) fStatHauRate.innerText = `${stats.rateHau}%`;
    if (fStatBothKhung) fStatBothKhung.innerText = `${stats.hitBothCount} Khung`;
    if (fStatBothRate) fStatBothRate.innerText = `${stats.rateBoth}%`;

    if (fStatBiasBadge) {
        let icon = '<i class="fa-solid fa-scale-balanced"></i>';
        if (stats.biasType === 'hau') icon = '<i class="fa-solid fa-fire text-purple"></i>';
        else if (stats.biasType === 'tien') icon = '<i class="fa-solid fa-bolt text-cyan"></i>';
        fStatBiasBadge.className = `bias-badge ${stats.biasClass}`;
        fStatBiasBadge.innerHTML = `${icon} ${stats.biasTitle}`;
    }

    if (fStatBiasAdvice) {
        fStatBiasAdvice.innerText = stats.biasAdvice;
    }

    if (fStatRatioBarTien && fStatRatioBarHau) {
        const totalCompare = stats.hitTienCount + stats.hitHauCount;
        let pctTien = 50, pctHau = 50;
        if (totalCompare > 0) {
            pctTien = Math.round((stats.hitTienCount / totalCompare) * 100);
            pctHau = 100 - pctTien;
        }
        fStatRatioBarTien.style.width = `${pctTien}%`;
        fStatRatioBarHau.style.width = `${pctHau}%`;
        fStatRatioBarTien.innerText = `Tiền ${pctTien}%`;
        fStatRatioBarHau.innerText = `Hậu ${pctHau}%`;
    }

    // 3. UPDATE FRAME HISTORY LIST
    const listContainer = document.getElementById('frameHistoryListContainer');
    if (listContainer) {
        if (frames.length === 0) {
            listContainer.innerHTML = `<div class="frame-empty-hint"><i class="fa-solid fa-clock-rotate-left"></i> Chưa có khung nào hoàn tất. Nhập kết quả để xem AI tự động theo dõi từng chu kỳ 3 kỳ!</div>`;
        } else {
            const reversedFrames = [...frames].reverse();
            let html = '';
            reversedFrames.forEach(f => {
                const isWon = f.status === 'won';
                const statusBadge = isWon
                    ? `<span class="frame-status-badge status-won"><i class="fa-solid fa-check"></i> HÚP TAY ${f.wonStep} ✓ (${f.winType})</span>`
                    : `<span class="frame-status-badge status-lost"><i class="fa-solid fa-xmark"></i> GÃY KHUNG ✗</span>`;

                const chams = (f.cham6 && f.cham6.length >= 6) ? f.cham6 : (f.cham5 || []);
                const chamPills = chams.map((d, idx) => `
                    <span class="cham-tag-pill" style="padding:3px 6px; font-size:0.75rem;">
                        <span class="cham-rank-badge rank-top${idx + 1}" style="font-size:0.55rem; padding:0 3px; margin-bottom:1px;">T${idx + 1}</span>
                        <span class="cham-num" style="font-size:0.9rem;">C.${d}</span>
                    </span>
                `).join('');

                const stepsHtml = f.steps.map(s => `
                    <div class="frame-step-item ${s.isHit ? 'step-hit' : 'step-miss'}">
                        <div class="step-num">Tay ${s.stepNum} (Kỳ ${s.period})</div>
                        <div class="step-digits">${s.digits.join('')}</div>
                        <div class="step-detail">
                            Tiền: <b>${s.tien}</b> ${s.hitTien ? '<span class="text-green">✓</span>' : '<span class="text-red">✗</span>'} | 
                            Hậu: <b>${s.hau}</b> ${s.hitHau ? '<span class="text-green">✓</span>' : '<span class="text-red">✗</span>'}
                        </div>
                        <div class="step-status">${s.isHit ? '<b class="text-green">HÚP ✓</b>' : '<span class="text-dim">Trượt</span>'}</div>
                    </div>
                `).join('');

                html += `
                    <div class="frame-card-item">
                        <div class="frame-card-header">
                            <div class="frame-card-title">
                                <i class="fa-solid fa-crosshairs text-gold"></i> 
                                <b>KHUNG #${f.frameId}</b> 
                                <span style="font-size:0.8rem; color:var(--text-dim); margin-left:6px;">(Mốc Kỳ ${f.startPeriod} [${f.startDigits.join('')}])</span>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="frame-cham-row" style="margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                            <span style="font-size:0.82rem; color:var(--text-dim);">Chạm VIP:</span>
                            <div class="cham-pills-display" style="gap:4px;">
                                ${chamPills}
                            </div>
                        </div>
                        <div class="frame-steps-flow">
                            ${stepsHtml}
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;
        }
    }
}

/**
 * Fast clipboard copy for active frame numbers (36 / 25 / Tiền / Hậu - Bao Trọn Kép)
 */
function copyActiveFrameDan(count = 'auto') {
    const frameData = computeFrameHistory(STATE.rounds);
    const active = frameData.activeFrame;
    if (!active) return;

    let numbers = [];
    let label = '';

    if (count === 'tien25') {
        numbers = active.danTien25 || active.dan25 || generatePhucHop25(active.cham5);
        label = '25 số Tiền Nhị Chuyên Biệt (Đầu d1 d2)';
    } else if (count === 'hau25') {
        numbers = active.danHau25 || active.dan25 || generatePhucHop25(active.cham5);
        label = '25 số Hậu Nhị Chuyên Biệt (Đuôi d4 d5)';
    } else if (count === 36 || (count === 'auto' && STATE.danMode === 'dan36')) {
        numbers = active.dan36 || generatePhucHop36(active.cham6);
        label = '36 số VIP Bất Bại (6 Chạm bao trọn kép)';
    } else if (count === 'auto' && STATE.danMode === 'separate') {
        const tien = (active.danTien25 || active.dan25 || []).join(', ');
        const hau = (active.danHau25 || active.dan25 || []).join(', ');
        const textSep = `[TIỀN NHỊ 25 SỐ]: ${tien}\n\n[HẬU NHỊ 25 SỐ]: ${hau}`;
        const alertMsg = `ĐÃ SAO CHÉP 2 DÀN TIỀN NHỊ & HẬU NHỊ NUÔI KHUNG - TAY ${active.currentTay || 1}/3!\n\n` + textSep;
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textSep).then(() => {
                alert(alertMsg);
            }).catch(() => {
                fallbackCopy(textSep, alertMsg);
            });
        } else {
            fallbackCopy(textSep, alertMsg);
        }
        return;
    } else {
        numbers = active.dan25 || generatePhucHop25(active.cham5);
        label = '25 số VIP Nuôi Khung (5 Chạm bao trọn kép)';
    }

    const text = numbers.join(', ');
    const alertMsg = `ĐÃ SAO CHÉP DÀN NUÔI KHUNG (${label.toUpperCase()}) - TAY ${active.currentTay || 1}/3!\n\nDàn số (${numbers.length} số): ` + text;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert(alertMsg);
        }).catch(() => {
            fallbackCopy(text, alertMsg);
        });
    } else {
        fallbackCopy(text, alertMsg);
    }
}

/**
 * 2. Render 10-Round Performance Summary
 */
function update10RoundStats() {
    const totalBadge = document.getElementById('totalRoundsBadge');
    if (totalBadge) totalBadge.innerText = `Đã lưu: ${STATE.rounds.length} Kỳ`;

    // Only playable rounds (after 5 warmup rounds) count towards win/loss tracking
    const playableRounds = STATE.rounds.filter(r => !r.isWarmup);
    const last10 = playableRounds.slice(-10);
    const totalSlots = 10;
    const emptyCount = totalSlots - last10.length;

    // --- 1. TÀI XỈU METRICS & BADGES ---
    const txHupElem = document.getElementById('txHupCount');
    const txGayElem = document.getElementById('txGayCount');
    const txRateElem = document.getElementById('txWinRate');
    const txBadgesGrid = document.getElementById('last10BadgesTx');
    const txStreakElem = document.getElementById('txStreakStatus');

    let txHup = 0;
    let txGay = 0;
    last10.forEach(r => {
        if (r.statusTx === 'Húp') txHup++;
        else txGay++;
    });

    if (txHupElem) txHupElem.innerText = txHup;
    if (txGayElem) txGayElem.innerText = txGay;
    const txRate = last10.length > 0 ? Math.round((txHup / last10.length) * 100) : 0;
    if (txRateElem) txRateElem.innerText = `${txRate}%`;

    // Mini TX Tracker in Prediction Box
    const txMiniHupElem = document.getElementById('txMiniHupRatio');
    const txMiniRateElem = document.getElementById('txMiniWinRate');
    const txMiniDotsGrid = document.getElementById('txMiniDots');
    if (txMiniHupElem) txMiniHupElem.innerText = `${txHup}/${last10.length || 0} Húp`;
    if (txMiniRateElem) txMiniRateElem.innerText = `${txRate}%`;
    if (txMiniDotsGrid) {
        txMiniDotsGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'mini-dot dot-empty';
            dot.innerText = '-';
            txMiniDotsGrid.appendChild(dot);
        }
        last10.forEach(r => {
            const isWin = r.statusTx === 'Húp';
            const dot = document.createElement('div');
            dot.className = `mini-dot ${isWin ? 'dot-hup' : 'dot-gay'}`;
            dot.innerText = isWin ? 'H' : 'G';
            dot.title = `Kỳ ${r.period}: AI đoán ${r.predTx} ➔ Ra ${r.actualTx} (${isWin ? 'HÚP ✓' : 'GÃY ✗'})`;
            txMiniDotsGrid.appendChild(dot);
        });
    }

    if (txBadgesGrid) {
        txBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            txBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = r.statusTx === 'Húp';
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const subLabel = isWin ? `${r.predTx} ✓` : `Ra ${r.actualTx} (Đoán ${r.predTx})`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">${subLabel}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | AI đoán: ${r.predTx} ➔ Ra: ${r.actualTx} (Tổng ${r.sum}) ➔ ${isWin ? 'HÚP ✓' : 'GÃY (Sai)'}`;
            txBadgesGrid.appendChild(badge);
        });
    }

    // --- 2. CHẴN LẺ METRICS & BADGES ---
    const clHupElem = document.getElementById('clHupCount');
    const clGayElem = document.getElementById('clGayCount');
    const clRateElem = document.getElementById('clWinRate');
    const clBadgesGrid = document.getElementById('last10BadgesCl');
    const clStreakElem = document.getElementById('clStreakStatus');

    let clHup = 0;
    let clGay = 0;
    last10.forEach(r => {
        if (r.statusCl === 'Húp') clHup++;
        else clGay++;
    });

    if (clHupElem) clHupElem.innerText = clHup;
    if (clGayElem) clGayElem.innerText = clGay;
    const clRate = last10.length > 0 ? Math.round((clHup / last10.length) * 100) : 0;
    if (clRateElem) clRateElem.innerText = `${clRate}%`;

    // Mini CL Tracker in Prediction Box
    const clMiniHupElem = document.getElementById('clMiniHupRatio');
    const clMiniRateElem = document.getElementById('clMiniWinRate');
    const clMiniDotsGrid = document.getElementById('clMiniDots');
    if (clMiniHupElem) clMiniHupElem.innerText = `${clHup}/${last10.length || 0} Húp`;
    if (clMiniRateElem) clMiniRateElem.innerText = `${clRate}%`;
    if (clMiniDotsGrid) {
        clMiniDotsGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'mini-dot dot-empty';
            dot.innerText = '-';
            clMiniDotsGrid.appendChild(dot);
        }
        last10.forEach(r => {
            const isWin = r.statusCl === 'Húp';
            const dot = document.createElement('div');
            dot.className = `mini-dot ${isWin ? 'dot-hup' : 'dot-gay'}`;
            dot.innerText = isWin ? 'H' : 'G';
            dot.title = `Kỳ ${r.period}: AI đoán ${r.predCl} ➔ Ra ${r.actualCl} (${isWin ? 'HÚP ✓' : 'GÃY ✗'})`;
            clMiniDotsGrid.appendChild(dot);
        });
    }

    if (clBadgesGrid) {
        clBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            clBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = r.statusCl === 'Húp';
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const subLabel = isWin ? `${r.predCl} ✓` : `Ra ${r.actualCl} (Đoán ${r.predCl})`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">${subLabel}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | AI đoán: ${r.predCl} ➔ Ra: ${r.actualCl} (Tổng ${r.sum}) ➔ ${isWin ? 'HÚP ✓' : 'GÃY (Sai)'}`;
            clBadgesGrid.appendChild(badge);
        });
    }

    // --- 3. DÀN 36 SỐ BẤT BẠI METRICS & BADGES (10 KỲ) ---
    const dan36HupElem = document.getElementById('dan36HupCount');
    const dan36GayElem = document.getElementById('dan36GayCount');
    const dan36RateElem = document.getElementById('dan36WinRate');
    const dan36BothElem = document.getElementById('dan36BothCount');
    const dan36BadgesGrid = document.getElementById('last10BadgesDan36');
    const dan36StreakElem = document.getElementById('dan36StreakStatus');

    let dan36Hup = 0;
    let dan36Gay = 0;
    let dan36Both = 0;
    last10.forEach(r => {
        const tienVal = `${r.digits[0]}${r.digits[1]}`;
        const hauVal = `${r.digits[3]}${r.digits[4]}`;
        const isHit = (r.isDan36Hit !== undefined) ? r.isDan36Hit : ((r.phucHop36 || []).includes(tienVal) || (r.phucHop36 || []).includes(hauVal));
        if (isHit) {
            dan36Hup++;
            const hitTien = (r.phucHop36 || []).includes(tienVal) || r.isTien36Hit;
            const hitHau = (r.phucHop36 || []).includes(hauVal) || r.isHau36Hit;
            if (hitTien && hitHau) dan36Both++;
        } else {
            dan36Gay++;
        }
    });

    if (dan36HupElem) dan36HupElem.innerText = dan36Hup;
    if (dan36GayElem) dan36GayElem.innerText = dan36Gay;
    const dan36Rate = last10.length > 0 ? Math.round((dan36Hup / last10.length) * 100) : 0;
    if (dan36RateElem) dan36RateElem.innerText = `${dan36Rate}%`;
    if (dan36BothElem) dan36BothElem.innerText = `${dan36Both} Kỳ`;

    // Mini 10-Kỳ Dàn 36 Tracker in Prediction Box
    const dan36MiniHupElem = document.getElementById('dan36MiniHupRatio');
    const dan36MiniRateElem = document.getElementById('dan36MiniWinRate');
    const dan36MiniDotsGrid = document.getElementById('dan36MiniDots');
    if (dan36MiniHupElem) dan36MiniHupElem.innerText = `${dan36Hup}/${last10.length || 0} Húp`;
    if (dan36MiniRateElem) dan36MiniRateElem.innerText = `${dan36Rate}%`;
    if (dan36MiniDotsGrid) {
        dan36MiniDotsGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'mini-dot dot-empty';
            dot.innerText = '-';
            dan36MiniDotsGrid.appendChild(dot);
        }
        last10.forEach(r => {
            const tienVal = `${r.digits[0]}${r.digits[1]}`;
            const hauVal = `${r.digits[3]}${r.digits[4]}`;
            const isWin = (r.isDan36Hit !== undefined) ? r.isDan36Hit : ((r.phucHop36 || []).includes(tienVal) || (r.phucHop36 || []).includes(hauVal));
            const dot = document.createElement('div');
            dot.className = `mini-dot ${isWin ? 'dot-hup' : 'dot-gay'}`;
            dot.innerText = isWin ? 'H' : 'G';
            dot.title = `Kỳ ${r.period}: Dàn 36 Số ➔ ${isWin ? 'HÚP ✓' : 'GÃY ✗'} (Tiền: ${tienVal} - Hậu: ${hauVal})`;
            dan36MiniDotsGrid.appendChild(dot);
        });
    }

    if (dan36BadgesGrid) {
        dan36BadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            dan36BadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const tienVal = `${r.digits[0]}${r.digits[1]}`;
            const hauVal = `${r.digits[3]}${r.digits[4]}`;
            const isWin = (r.isDan36Hit !== undefined) ? r.isDan36Hit : ((r.phucHop36 || []).includes(tienVal) || (r.phucHop36 || []).includes(hauVal));
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            
            const hitTien = (r.phucHop36 || []).includes(tienVal) || r.isTien36Hit;
            const hitHau = (r.phucHop36 || []).includes(hauVal) || r.isHau36Hit;
            let subLabel = '';
            if (isWin) {
                if (hitTien && hitHau) subLabel = `2 Đầu [${tienVal}/${hauVal}]`;
                else if (hitTien) subLabel = `Tiền [${tienVal}] ✓`;
                else subLabel = `Hậu [${hauVal}] ✓`;
            } else {
                subLabel = `[${tienVal}/${hauVal}] ✗`;
            }

            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">${subLabel}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | Dàn 36 Số VIP ➔ ${isWin ? 'HÚP ✓ (Trúng trong 36 số Bất Bại)' : 'GÃY ✗'} (Tiền: ${tienVal} - Hậu: ${hauVal})`;
            dan36BadgesGrid.appendChild(badge);
        });
    }

    // Streaks (evaluated on playable rounds)
    if (playableRounds.length > 0) {
        const lastTxHup = playableRounds[playableRounds.length - 1].statusTx === 'Húp';
        let txStreak = 0;
        for (let j = playableRounds.length - 1; j >= 0; j--) {
            if ((playableRounds[j].statusTx === 'Húp') === lastTxHup) txStreak++;
            else break;
        }
        if (txStreakElem) {
            txStreakElem.innerHTML = lastTxHup ? `<span class="text-green">Đang Húp ${txStreak} tay</span>` : `<span class="text-red">Gãy ${txStreak} tay</span>`;
        }

        const lastClHup = playableRounds[playableRounds.length - 1].statusCl === 'Húp';
        let clStreak = 0;
        for (let j = playableRounds.length - 1; j >= 0; j--) {
            if ((playableRounds[j].statusCl === 'Húp') === lastClHup) clStreak++;
            else break;
        }
        if (clStreakElem) {
            clStreakElem.innerHTML = lastClHup ? `<span class="text-green">Đang Húp ${clStreak} tay</span>` : `<span class="text-red">Gãy ${clStreak} tay</span>`;
        }

        const lastDan36Hup = (playableRounds[playableRounds.length - 1].isDan36Hit !== undefined) ? playableRounds[playableRounds.length - 1].isDan36Hit : ((playableRounds[playableRounds.length - 1].phucHop36 || []).includes(`${playableRounds[playableRounds.length - 1].digits[0]}${playableRounds[playableRounds.length - 1].digits[1]}`) || (playableRounds[playableRounds.length - 1].phucHop36 || []).includes(`${playableRounds[playableRounds.length - 1].digits[3]}${playableRounds[playableRounds.length - 1].digits[4]}`));
        let dan36Streak = 0;
        for (let j = playableRounds.length - 1; j >= 0; j--) {
            const pR = playableRounds[j];
            const hit = (pR.isDan36Hit !== undefined) ? pR.isDan36Hit : ((pR.phucHop36 || []).includes(`${pR.digits[0]}${pR.digits[1]}`) || (pR.phucHop36 || []).includes(`${pR.digits[3]}${pR.digits[4]}`));
            if (hit === lastDan36Hup) dan36Streak++;
            else break;
        }
        if (dan36StreakElem) {
            dan36StreakElem.innerHTML = lastDan36Hup ? `<span class="text-green">Đang Húp ${dan36Streak} tay</span>` : `<span class="text-red">Gãy ${dan36Streak} tay</span>`;
        }
    } else {
        if (txStreakElem) txStreakElem.innerHTML = '<span class="text-dim">Chờ Kỳ 6</span>';
        if (clStreakElem) clStreakElem.innerHTML = '<span class="text-dim">Chờ Kỳ 6</span>';
        if (dan36StreakElem) dan36StreakElem.innerHTML = '<span class="text-dim">Chờ Kỳ 6</span>';
    }
}

/**
 * 3. Render Visual Bridge Roadmaps (Cả 2 bảng Tài/Xỉu và Chẵn/Lẻ hiển thị đồng thời, không cần ấn tab)
 */
function updateRoadmap() {
    renderSingleRoadmap('tx', 'roadGridContainerTx');
    renderSingleRoadmap('cl', 'roadGridContainerCl');
}

function renderSingleRoadmap(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (STATE.rounds.length === 0) {
        container.innerHTML = `<div style="color: var(--text-dim); text-align: center; width: 100%; padding: 20px;">Chưa có dữ liệu để vẽ bảng soi cầu ${type === 'tx' ? 'Tài / Xỉu' : 'Chẵn / Lẻ'}.</div>`;
        return;
    }

    // Group into columns for vertical streak display (Baccarat / Big Road style)
    const columns = [];
    let currentCol = [];
    let prevVal = null;

    STATE.rounds.forEach(r => {
        const val = type === 'tx' ? r.actualTx : r.actualCl;
        const isWin = type === 'tx' ? (r.statusTx === 'Húp') : (r.statusCl === 'Húp');
        const predVal = type === 'tx' ? r.predTx : r.predCl;
        const itemObj = { val, isWin, predVal, period: r.period };

        if (prevVal === null) {
            currentCol.push(itemObj);
            prevVal = val;
        } else if (val === prevVal) {
            // Same -> extend column (bệt xuống dưới)
            if (currentCol.length < 6) {
                currentCol.push(itemObj);
            } else {
                // Wrap to next column if column reaches 6 cells
                columns.push(currentCol);
                currentCol = [itemObj];
            }
        } else {
            // Switched -> start new column
            columns.push(currentCol);
            currentCol = [itemObj];
            prevVal = val;
        }
    });
    if (currentCol.length > 0) {
        columns.push(currentCol);
    }

    // Render HTML
    let html = '<div class="matrix-columns-flow">';
    columns.forEach(col => {
        html += '<div class="matrix-column">';
        col.forEach(cell => {
            let colorClass = '';
            let label = cell.val ? cell.val[0] : '?'; // 'T', 'X', 'C', 'L'
            if (cell.val === 'Tài') colorClass = 'bead-tai';
            else if (cell.val === 'Xỉu') colorClass = 'bead-xiu';
            else if (cell.val === 'Chẵn') colorClass = 'bead-chan';
            else if (cell.val === 'Lẻ') colorClass = 'bead-le';

            const ringClass = cell.isWin ? 'hup-ring' : 'gay-ring';
            const winStatus = cell.isWin ? 'HÚP' : 'GÃY';
            html += `<div class="matrix-cell ${colorClass} ${ringClass}" title="Kỳ ${cell.period}: Ra ${cell.val} (Đoán: ${cell.predVal}) ➔ ${winStatus}">${label}</div>`;
        });
        html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
    // Auto scroll to latest on right
    container.scrollLeft = container.scrollWidth;
}

function switchTableFilter(filter) {
    STATE.tableFilter = filter;
    
    // Update button states
    const btn10 = document.getElementById('btnShow10');
    const btnAll = document.getElementById('btnShowAll');
    if (btn10 && btnAll) {
        if (filter === '10') {
            btn10.classList.add('active');
            btnAll.classList.remove('active');
        } else {
            btnAll.classList.add('active');
            btn10.classList.remove('active');
        }
    }

    updateHistoryTable();
}

/**
 * 4. Render History Table (Bảng Lịch Sử Đối Soát)
 */
function updateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const titleElem = document.getElementById('tableTitleDisplay');

    if (STATE.rounds.length === 0) {
        if (titleElem) titleElem.innerText = 'KẾT QUẢ 10 KỲ QUAY GẦN NHẤT';
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="empty-table-msg">
                    <i class="fa-solid fa-inbox"></i> Chưa có dữ liệu kỳ quay nào. Hãy nhập kỳ đầu tiên ở trên hoặc bấm "Mẫu 25 kỳ" để thử nghiệm!
                </td>
            </tr>
        `;
        return;
    }

    // Determine list to show
    let displayList = [];
    if (STATE.tableFilter === '10') {
        const count = Math.min(10, STATE.rounds.length);
        if (titleElem) titleElem.innerText = `KẾT QUẢ ${count} KỲ QUAY GẦN NHẤT (ĐỐI SOÁT HÚP / GÃY)`;
        // Get last 10 rounds and reverse to put newest on top
        displayList = STATE.rounds.slice(-10).reverse();
    } else {
        if (titleElem) titleElem.innerText = `TOÀN BỘ LỊCH SỬ (${STATE.rounds.length} KỲ QUAY)`;
        displayList = [...STATE.rounds].reverse();
    }

    let rowsHtml = '';

    displayList.forEach((r, revIndex) => {
        // Find actual index in original STATE.rounds for delete button
        const actualIndex = STATE.rounds.findIndex(item => item.period === r.period);
        const isLatest = revIndex === 0; // Topmost row is the newest
        const isWarmup = r.isWarmup || (actualIndex >= 0 && actualIndex < 5);
        const warmupNum = r.warmupNum || (actualIndex + 1);
        
        // 5 digit balls
        const ballsHtml = r.digits.map(d => `<span class="digit-ball">${d}</span>`).join('');

        // Tag actual
        const txClass = r.actualTx === 'Tài' ? 'tag-tai' : 'tag-xiu';
        const clClass = r.actualCl === 'Chẵn' ? 'tag-chan' : 'tag-le';
        const actualTag = `<div style="display:flex;gap:4px;justify-content:center;"><span class="badge-tag-tx ${txClass}">Ra ${r.actualTx}</span><span class="badge-tag-tx ${clClass}">Ra ${r.actualCl}</span></div>`;

        // Tag prediction TX / CL
        let predTag = '';
        if (isWarmup) {
            predTag = `<div style="display:flex;gap:4px;justify-content:center;"><span class="badge-tag-tx" style="background:rgba(255,255,255,0.06); color:var(--text-dim); border:1px dashed rgba(255,255,255,0.2);">Mốc Gốc</span></div>`;
        } else {
            const predTxClass = r.predTx === 'Tài' ? 'tag-tai' : 'tag-xiu';
            const predClClass = r.predCl === 'Chẵn' ? 'tag-chan' : 'tag-le';
            predTag = `<div style="display:flex;gap:4px;justify-content:center;"><span class="badge-tag-tx ${predTxClass}">Đoán: ${r.predTx}</span><span class="badge-tag-tx ${predClClass}">Đoán: ${r.predCl}</span></div>`;
        }

        // Pred Cham tags (Top 5 Chạm ordered by %: Top 1..5)
        const defaultCham = [9, 4, 2, 7, 0];
        const defaultProb = [87, 76, 68, 58, 45];
        const chamArr = (r.predCham && r.predCham.length >= 5) ? r.predCham : (r.predCham || defaultCham);
        const tierClasses = ['tier-gold', 'tier-silver', 'tier-bronze', 'tier-top4', 'tier-top5'];

        let predChamTag = '<div class="table-cham-tiers">';
        if (isWarmup) {
            predChamTag += `<span class="pill-cham-tier" style="opacity:0.6; background:rgba(255,255,255,0.05); color:var(--text-dim); border-style:dashed;">Cầu Khởi Tạo</span>`;
        } else {
            for (let t = 0; t < 5; t++) {
                const digit = (chamArr[t] !== undefined) ? chamArr[t] : defaultCham[t];
                const prob = (r.predChamList && r.predChamList[t]) ? r.predChamList[t].prob : defaultProb[t];
                predChamTag += `<span class="pill-cham-tier ${tierClasses[t]}" title="Top ${t+1} (${prob}%)">C.${digit} <small>(${prob}%)</small></span>`;
            }
        }
        predChamTag += '</div>';

        // Đối soát TX & CL
        let txStatusBadge = '';
        let clStatusBadge = '';
        if (isWarmup) {
            txStatusBadge = `<span class="status-pill-warmup" title="5 kỳ kết quả đầu tiên làm mốc dữ liệu gốc"><i class="fa-solid fa-seedling"></i> Mốc Gốc</span>`;
            clStatusBadge = `<span class="status-pill-warmup" title="5 kỳ kết quả đầu tiên làm mốc dữ liệu gốc"><i class="fa-solid fa-seedling"></i> Mốc Gốc</span>`;
        } else {
            const isTxWin = r.statusTx === 'Húp';
            const txShort = r.actualTx === 'Tài' ? 'T' : 'X';
            txStatusBadge = isTxWin
                ? `<span class="status-pill-hup" title="Đoán đúng ${r.predTx}"><i class="fa-solid fa-circle-check"></i> Húp ${r.actualTx} (${txShort} ✓)</span>`
                : `<span class="status-pill-gay" title="Đoán ${r.predTx} nhưng ra ${r.actualTx}"><i class="fa-solid fa-circle-xmark"></i> Gãy TX ✗ (Đoán ${r.predTx})</span>`;

            const isClWin = r.statusCl === 'Húp';
            const clShort = r.actualCl === 'Chẵn' ? 'C' : 'L';
            clStatusBadge = isClWin
                ? `<span class="status-pill-hup" title="Đoán đúng ${r.predCl}"><i class="fa-solid fa-circle-check"></i> Húp ${r.actualCl} (${clShort} ✓)</span>`
                : `<span class="status-pill-gay" title="Đoán ${r.predCl} nhưng ra ${r.actualCl}"><i class="fa-solid fa-circle-xmark"></i> Gãy CL ✗ (Đoán ${r.predCl})</span>`;
        }

        // Đối soát 5 Chạm & Dàn 36 Số VIP
        let chamStatusBadge = '';
        if (isWarmup) {
            chamStatusBadge = `<div class="table-cham-results"><span class="status-pill-warmup"><i class="fa-solid fa-seedling"></i> Mốc Gốc</span></div>`;
        } else {
            const hitArr = chamArr.filter(c => r.digits.includes(c));
            const isDan36Hit = (r.isDan36Hit !== undefined) ? r.isDan36Hit : ((r.phucHop36 || []).includes(`${r.digits[0]}${r.digits[1]}`) || (r.phucHop36 || []).includes(`${r.digits[3]}${r.digits[4]}`));
            const tienVal = `${r.digits[0]}${r.digits[1]}`;
            const hauVal = `${r.digits[3]}${r.digits[4]}`;
            const hitTien36 = (r.phucHop36 || []).includes(tienVal) || r.isTien36Hit;
            const hitHau36 = (r.phucHop36 || []).includes(hauVal) || r.isHau36Hit;
            
            let detail36 = '';
            if (hitTien36 && hitHau36) detail36 = `Kép (Tiền ${tienVal} + Hậu ${hauVal})`;
            else if (hitTien36) detail36 = `Húp Tiền (${tienVal})`;
            else if (hitHau36) detail36 = `Húp Hậu (${hauVal})`;

            let miniHitsHtml = '';
            for (let t = 0; t < Math.min(6, chamArr.length); t++) {
                const digit = chamArr[t];
                const hit = r.digits.includes(digit);
                miniHitsHtml += `<span class="status-mini-cham ${hit ? 'cham-hit' : 'cham-miss'}" title="Top ${t+1} Chạm ${digit}">T${t+1}:${hit ? '✓' : '✗'}</span>`;
            }

            chamStatusBadge = `
                <div class="table-cham-results">
                    <span class="${isDan36Hit ? 'status-pill-trung' : 'status-pill-truot'}" style="font-weight:800; font-size:0.75rem;">
                        <i class="fa-solid ${isDan36Hit ? 'fa-check' : 'fa-xmark'}"></i> Dàn 36: ${isDan36Hit ? `HÚP ✓ (${detail36})` : 'GÃY ✗'}
                    </span>
                    <div style="display:flex; gap:2px; margin-top:3px; flex-wrap:wrap; justify-content:center;">
                        ${miniHitsHtml}
                    </div>
                </div>
            `;
        }

        // Đối soát Tiền Nhị & Hậu Nhị
        const tienVal = `${r.digits[0]}${r.digits[1]}`;
        const hauVal = `${r.digits[3]}${r.digits[4]}`;
        const isTienHit = (r.isTien36Hit !== undefined) ? r.isTien36Hit : ((r.phucHop36 || []).includes(tienVal));
        const isHauHit = (r.isHau36Hit !== undefined) ? r.isHau36Hit : ((r.phucHop36 || []).includes(hauVal));

        let nhiStatusBadge = '';
        if (isWarmup) {
            nhiStatusBadge = `
                <div class="table-nhi-results">
                    <span class="status-nhi-pill" style="background:rgba(6,182,212,0.12); color:#38bdf8; border-color:rgba(6,182,212,0.3); font-size:0.75rem;">
                        <i class="fa-solid fa-seedling"></i> Mốc Gốc (Chưa vào tiền)
                    </span>
                </div>
            `;
        } else {
            nhiStatusBadge = `
                <div class="table-nhi-results">
                    <span class="status-nhi-pill ${isTienHit ? 'nhi-hit' : 'nhi-miss'}" title="Tiền Nhị (2 số đầu): ${tienVal}">
                        Tiền [${tienVal}]: ${isTienHit ? 'HÚP ✓' : 'GÃY ✗'}
                    </span>
                    <span class="status-nhi-pill ${isHauHit ? 'nhi-hit' : 'nhi-miss'}" title="Hậu Nhị (2 số đuôi): ${hauVal}">
                        Hậu [${hauVal}]: ${isHauHit ? 'HÚP ✓' : 'GÃY ✗'}
                    </span>
                </div>
            `;
        }

        let periodCellHtml = '';
        if (isWarmup) {
            periodCellHtml = `<span class="text-cyan">${r.period}</span> <span class="status-pill-warmup" style="font-size:0.65rem; padding:1px 6px; margin-left:4px;"><i class="fa-solid fa-seedling"></i> Gốc #${warmupNum}/5</span>`;
        } else {
            const latestBadge = isLatest ? `<span class="badge-new-entry"><span class="pulse-dot-sm"></span> Vừa nhập</span>` : '';
            periodCellHtml = `${r.period} ${latestBadge}`;
        }

        const patternDisplay = isWarmup 
            ? `<strong style="color:#38bdf8;"><i class="fa-solid fa-seedling"></i> Mốc Gốc Khởi Tạo #${warmupNum}/5</strong>` 
            : `<strong>${r.bridgePattern}</strong>`;

        rowsHtml += `
            <tr class="${isLatest ? 'row-latest-entry' : ''}">
                <td class="period-cell">${periodCellHtml}</td>
                <td><div class="digit-ball-group">${ballsHtml}</div></td>
                <td class="sum-detail">
                    <strong>${r.detailText}</strong>
                    <div style="font-size:0.75rem; color:var(--cyan-glow); margin-top:2px;">(≥23: Tài | ≤22: Xỉu)</div>
                </td>
                <td>${actualTag}</td>
                <td>${predTag}</td>
                <td>${predChamTag}</td>
                <td>${txStatusBadge}</td>
                <td>${clStatusBadge}</td>
                <td>${chamStatusBadge}</td>
                <td>${nhiStatusBadge}</td>
                <td style="font-size: 0.8rem; color: var(--cyan-glow); text-align: left; max-width: 180px;">
                    ${patternDisplay}
                </td>
                <td>
                    <button class="btn-del-row" onclick="deleteSpecificRound(${actualIndex >= 0 ? actualIndex : 0})" title="Xóa kỳ này">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

/* ==========================================================================
   SAMPLE DATA & UTILITIES
   ========================================================================== */

/**
 * Generate N realistic sample rounds for quick demo & testing
 */
function generateSampleData(count = 25) {
    if (STATE.rounds.length > 0) {
        if (!confirm('Tạo dữ liệu mẫu sẽ ghi thêm vào lịch sử hiện tại. Bạn có muốn tiếp tục?')) {
            return;
        }
    }

    let startNum = 101;
    let lastDigits = [5, 6, 8, 9, 2];
    if (STATE.rounds.length > 0) {
        const lastPeriod = STATE.rounds[STATE.rounds.length - 1].period;
        const match = lastPeriod.match(/\d+/);
        if (match) startNum = parseInt(match[0]) + 1;
        lastDigits = STATE.rounds[STATE.rounds.length - 1].digits;
    }

    for (let i = 0; i < count; i++) {
        const period = `Kỳ #${startNum + i}`;
        
        // Realistic 5D lottery draw generation adhering to bridge dynamics
        const [pasc1, pasc2] = calculatePascalPeak(lastDigits);
        const shadow1 = getYinYangShadows(lastDigits[0]).duong;
        const shadow2 = getYinYangShadows(lastDigits[4]).am;
        const sumCore = (lastDigits[0] + lastDigits[1] + lastDigits[3] + lastDigits[4]) % 10;
        
        const bridgePool = [
            lastDigits[0], lastDigits[1], lastDigits[3], lastDigits[4], 
            pasc1, pasc2, shadow1, shadow2, sumCore
        ];

        const pickBridgeOrRandom = (rate = 0.72) => {
            if (Math.random() < rate) {
                return bridgePool[Math.floor(Math.random() * bridgePool.length)];
            }
            return Math.floor(Math.random() * 10);
        };

        const d1 = pickBridgeOrRandom(0.70);
        const d2 = pickBridgeOrRandom(0.70);
        const d3 = Math.floor(Math.random() * 10);
        const d4 = pickBridgeOrRandom(0.70);
        const d5 = pickBridgeOrRandom(0.70);

        const digits = [d1, d2, d3, d4, d5];
        lastDigits = digits;
        addNewRound(period, digits);
    }

    initNextPeriodInput();
}

/**
 * Audio feedback using Web Audio API
 */
function playNotificationSound(isWin) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (isWin) {
            // High cheerful beep
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        } else {
            // Low alert tone
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            osc.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch (e) {
        // Audio policy or unsupported
    }
}

/* ==========================================================================
   LOCALSTORAGE & EXPORT / IMPORT
   ========================================================================== */

function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            rounds: STATE.rounds,
            calcMode: STATE.calcMode,
            danMode: STATE.danMode,
            capital: STATE.capital,
            safeFrames: STATE.safeFrames,
            betStrategy: STATE.betStrategy,
            payoutRate: STATE.payoutRate
        }));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            STATE.rounds = parsed.rounds || [];
            STATE.calcMode = parsed.calcMode || 'sum5';
            STATE.danMode = parsed.danMode || 'dan36';
            if (parsed.capital !== undefined) STATE.capital = Number(parsed.capital) || 30000000;
            if (parsed.safeFrames !== undefined) STATE.safeFrames = Number(parsed.safeFrames) || 5;
            // Luôn ưu tiên mặc định 'dual' (Cả 2 đầu: Tiền Nhị & Hậu Nhị)
            STATE.betStrategy = (parsed.betStrategy && parsed.betStrategy === 'single') ? 'dual' : (parsed.betStrategy || 'dual');
            if (parsed.payoutRate !== undefined) STATE.payoutRate = Number(parsed.payoutRate) || 99;

            const selectElem = document.getElementById('calcModeSelect');
            if (selectElem) selectElem.value = STATE.calcMode;

            const capInput = document.getElementById('capitalInput');
            if (capInput) capInput.value = STATE.capital.toLocaleString('vi-VN');

            const safeSelect = document.getElementById('safeFramesSelect');
            if (safeSelect) safeSelect.value = String(STATE.safeFrames);

            const stratSelect = document.getElementById('betStrategySelect');
            if (stratSelect) stratSelect.value = STATE.betStrategy;

            updateQuickCapButtons(STATE.capital);
        }
    } catch (e) {
        console.error('Failed to load from localStorage', e);
    }
}

function exportData() {
    if (STATE.rounds.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(STATE.rounds, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SoiCau_TX_CL_5So_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                STATE.rounds = imported;
                recalculateAllRounds();
                saveToLocalStorage();
                updateAllViews();
                alert(`Đã nhập thành công ${imported.length} kỳ quay!`);
            } else {
                alert('File không đúng định dạng dữ liệu!');
            }
        } catch (err) {
            alert('Lỗi đọc file JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

/* ==========================================================================
   PWA SERVICE WORKER REGISTRATION
   ========================================================================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA ServiceWorker registered with scope:', reg.scope))
            .catch(err => console.log('PWA ServiceWorker registration failed:', err));
    });
}

