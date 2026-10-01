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

function recalculateAllRounds() {
    const originalRounds = [...STATE.rounds];
    STATE.rounds = [];

    for (let i = 0; i < originalRounds.length; i++) {
        const item = originalRounds[i];
        // 1. Predict based on existing history at step i
        const pred = generateAIPrediction(STATE.rounds);
        
        // 2. Evaluate actual result
        const evalRes = evaluateDigits(item.digits, STATE.calcMode);
        
        // 3. Determine TX / CL status
        const isTxHup = pred.predTx ? (pred.predTx === evalRes.tx) : true;
        const isClHup = pred.predCl ? (pred.predCl === evalRes.cl) : true;
        const statusTx = isTxHup ? 'Húp' : 'Gãy';
        const statusCl = isClHup ? 'Húp' : 'Gãy';
        const statusOverall = (isTxHup && isClHup) ? 'Húp' : (isTxHup ? 'Húp (TX)' : (isClHup ? 'Húp (CL)' : 'Gãy'));

        // 4. Determine Master 5 Cham & Dàn 25 Số status
        const predChamArr = pred.masterDigits || pred.predCham || [9, 4, 2, 7, 0];
        const hitCham = predChamArr.filter(c => item.digits.includes(c));
        const isChamHit = hitCham.length > 0;
        const statusCham = isChamHit ? 'Trúng' : 'Trượt';
        const statusChamDetail = isChamHit ? `Trúng [${hitCham.join(', ')}]` : 'Trượt';

        // Đánh chung Dàn 25 số cho Tiền Nhị (d1 d2) & Hậu Nhị (d4 d5)
        const tienNhiVal = `${item.digits[0]}${item.digits[1]}`;
        const hauNhiVal = `${item.digits[3]}${item.digits[4]}`;
        const isTienNhiHit = predChamArr.includes(item.digits[0]) && predChamArr.includes(item.digits[1]);
        const isHauNhiHit = predChamArr.includes(item.digits[3]) && predChamArr.includes(item.digits[4]);
        const isUnified25Hit = isTienNhiHit || isHauNhiHit;

        STATE.rounds.push({
            period: item.period,
            digits: item.digits,
            sum: evalRes.sum,
            detailText: evalRes.detailText,
            actualTx: evalRes.tx,
            actualCl: evalRes.cl,
            predTx: pred.predTx || '--',
            predCl: pred.predCl || '--',
            predTxConf: pred.predTxConf || 50,
            predClConf: pred.predClConf || 50,
            predCham: predChamArr,
            predChamList: pred.predChamList || pred.topMaster || [],
            tienDigits: predChamArr,
            topTien: pred.topMaster || [],
            hauDigits: predChamArr,
            topHau: pred.topMaster || [],
            phucHop25: pred.phucHopMaster25 || pred.phucHop25 || [],
            predChamConf: pred.predChamConf || 96,
            hitCham: hitCham,
            isChamHit: isChamHit,
            tienNhiVal: tienNhiVal,
            isTienNhiHit: isTienNhiHit,
            hauNhiVal: hauNhiVal,
            isHauNhiHit: isHauNhiHit,
            isUnified25Hit: isUnified25Hit,
            statusCham: statusCham,
            statusChamDetail: statusChamDetail,
            statusTx: statusTx,
            statusCl: statusCl,
            statusOverall: statusOverall,
            isHup: isTxHup || isClHup,
            isDoubleHup: isTxHup && isClHup,
            bridgePattern: pred.patternName || 'Nhịp khởi tạo',
            bridgeReason: pred.reason || 'Dữ liệu phân tích ban đầu'
        });
    }
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
 * Get Yin-Yang and Shadow Digits
 */
function getYinYangShadows(digit) {
    const duong = (digit + 5) % 10;
    const amMap = { 0: 7, 7: 0, 1: 4, 4: 1, 2: 9, 9: 2, 3: 6, 6: 3, 5: 8, 8: 5 };
    const am = amMap[digit] !== undefined ? amMap[digit] : duong;
    return { duong, am };
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

function copyUnifiedPhucHop(count = 25) {
    const nextPred = STATE.currentPrediction || generateAIPrediction(STATE.rounds);
    const digits = nextPred.masterDigits || nextPred.predCham || [8, 5, 7, 0, 9];
    
    let text = '';
    let typeLabel = '';
    if (count === 20) {
        const pairs20 = generatePhucHop20(digits);
        text = pairs20.join(', ');
        typeLabel = '20 số VIP bỏ kép (Đánh Tiền Nhị & Hậu Nhị)';
    } else {
        const pairs25 = generatePhucHop25(digits);
        text = pairs25.join(', ');
        typeLabel = '25 số VIP bao trọn kép (Đánh Tiền Nhị & Hậu Nhị)';
    }

    navigator.clipboard.writeText(text).then(() => {
        alert(`ĐÃ SAO CHÉP DÀN ${typeLabel.toUpperCase()}!\n\nDàn số (${count} số): ` + text);
    }).catch(() => {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert(`ĐÃ SAO CHÉP DÀN ${typeLabel.toUpperCase()}!\n\nDàn số (${count} số): ` + text);
    });
}

function copyPhucHopDirect(type = 'master', count = 25) {
    copyUnifiedPhucHop(count);
}

function copyCurrentPhucHop(count = 25) {
    copyUnifiedPhucHop(count);
}

/**
 * MAX SIÊU CAO THỦ - Bắt 5 Chạm Cứng VIP & Dàn 25 Số Bất Bại
 * 1. Pascal Pyramid Dual-Peak Centroids
 * 2. Positional Drop Digits (Head d1, d2, Tail d4, d5, Center d3)
 * 3. Modulo-10 Sum Vectors (Head Sum, Tail Sum, Total Sum)
 * 4. Selective Yin-Yang Shadows of Dominant Digits
 * 5. Adjacent Boundary Flow (d1 ± 1, d5 ± 1)
 * 6. Extreme Cold/Gan Suppression Filter
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
function getBridgeAttribution(digit, lastRoundDigits) {
    if (!lastRoundDigits || lastRoundDigits.length < 5) {
        return { tag: 'Cầu VIP', detail: 'Khởi tạo theo 6 Cầu Vàng cao thủ' };
    }
    const [d1, d2, d3, d4, d5] = lastRoundDigits.map(Number);
    const u = (d5 * 2) % 10;
    const u_bong = (u + 5) % 10;
    const r2_tram = MAP_EXCHANGE[d3] !== undefined ? MAP_EXCHANGE[d3] : (d3 + 5) % 10;
    const r2_donvi = MAP_EXCHANGE[d5] !== undefined ? MAP_EXCHANGE[d5] : (d5 + 5) % 10;
    const r3 = (u - 1 + 10) % 10;
    const r4 = (u + 1) % 10;

    const sumDau = (d1 + d2) % 10;
    const sumDauBong = (sumDau + 5) % 10;
    const sumDuoi = (d4 + d5) % 10;
    const sumDuoiBong = (sumDuoi + 5) % 10;

    const pasc = calculatePascalPeak(lastRoundDigits);

    if (digit === sumDau) return { tag: 'Tổng Đầu (Chính)', detail: `Cầu Tổng Đầu: ${d1} + ${d2} = ${sumDau}` };
    if (digit === sumDauBong) return { tag: 'Bóng Tổng Đầu', detail: `Cầu Tổng Đầu: Bóng dương của (${d1} + ${d2}) = ${sumDauBong}` };
    if (digit === sumDuoi) return { tag: 'Tổng Đuôi (Chính)', detail: `Cầu Tổng Đuôi: ${d4} + ${d5} = ${sumDuoi}` };
    if (digit === sumDuoiBong) return { tag: 'Bóng Tổng Đuôi', detail: `Cầu Tổng Đuôi: Bóng dương của (${d4} + ${d5}) = ${sumDuoiBong}` };
    if (digit === r2_tram) return { tag: 'Quy Đổi Trăm', detail: `Cầu Quy Đổi: Số hàng Trăm (${d3} ➔ ${digit})` };
    if (digit === r2_donvi) return { tag: 'Quy Đổi Đ.Vị', detail: `Cầu Quy Đổi: Số hàng Đơn Vị (${d5} ➔ ${digit})` };
    if (digit === u) return { tag: 'Đơn Vị x2', detail: `Cầu Đơn Vị x2: ${d5} x 2 = ${digit}` };
    if (digit === u_bong) return { tag: 'Bóng Đ.Vị x2', detail: `Cầu Đơn Vị x2: Bóng dương của (${d5} x 2) = ${digit}` };
    if (digit === r3) return { tag: 'Biên Trừ (-1)', detail: `Cầu Biên: (${d5} x 2) - 1 = ${digit}` };
    if (digit === r4) return { tag: 'Biên Cộng (+1)', detail: `Cầu Biên: (${d5} x 2) + 1 = ${digit}` };
    if (pasc.includes(digit)) return { tag: 'Đỉnh Pascal', detail: `Hội tụ 2 đỉnh tam giác Pascal (${pasc.join(', ')})` };
    if ([d1, d2, d4, d5].includes(digit)) return { tag: 'Điểm Rơi', detail: `Điểm rơi trực tiếp kỳ trước (${digit})` };

    return { tag: 'Tổng Modulo', detail: `Cầu Tổng Vị Trí Modulo 10 (${digit})` };
}

/**
 * MAX SIÊU CAO THỦ - Bắt 5 Chạm Cứng VIP & Dàn 25 Số Bất Bại
 * Tích hợp 6 Cầu Vàng Bắt Chạm Gia Truyền của Cao Thủ:
 * 1. Cầu Đơn Vị * 2 -> Chính nó & Bóng dương (Tự động quét nhịp ăn chính nó / bóng dương)
 * 2. Cặp Chạm Vàng Quy Đổi Trăm (d3) & Đơn Vị (d5)
 * 3. Cầu Đơn Vị * 2 Trừ 1
 * 4. Cầu Đơn Vị * 2 Cộng 1
 * 5. Cầu Tổng Đầu (Chục Ngàn + Ngàn d1+d2) -> Chính nó & Bóng dương
 * 6. Cầu Tổng Đuôi (Hàng Chục + Đơn Vị d4+d5) -> Chính nó & Bóng dương
 * Kết hợp Đỉnh Tam Giác Pascal & Khử Lô Gan Cực Đoan.
 */
function analyzeTop5Cham(history) {
    if (!history || history.length === 0) {
        const defaultTop = [
            { digit: 8, score: 580, prob: 96, bridgeTag: 'Quy Đổi Trăm', bridgeDetail: 'Cầu Quy Đổi: Số hàng Trăm' },
            { digit: 5, score: 510, prob: 91, bridgeTag: 'Đơn Vị x2', bridgeDetail: 'Cầu Đơn Vị x2' },
            { digit: 7, score: 440, prob: 86, bridgeTag: 'Tổng Đầu (Chính)', bridgeDetail: 'Cầu Tổng Đầu: 2 + 5 = 7' },
            { digit: 0, score: 360, prob: 79, bridgeTag: 'Bóng Tổng Đuôi', bridgeDetail: 'Cầu Tổng Đuôi: Bóng dương của 5 = 0' },
            { digit: 9, score: 280, prob: 70, bridgeTag: 'Đỉnh Pascal', bridgeDetail: 'Đỉnh tam giác Pascal' }
        ];
        const masterDigits = defaultTop.map(x => x.digit);
        return {
            topTien: defaultTop,
            topHau: defaultTop,
            topMaster: defaultTop,
            tienDigits: masterDigits,
            hauDigits: masterDigits,
            masterDigits: masterDigits,
            goldenPair: [7, 2],
            unitDouble: [2, 7],
            unitMinus: 1,
            unitPlus: 3,
            sumDauPair: [7, 2],
            sumDuoiPair: [5, 0],
            goldenFlowState: 'Chính nó & Bóng dương',
            top5: defaultTop,
            chamDigits: masterDigits,
            phucHopTien25: generatePhucHop25(masterDigits),
            phucHopTien20: generatePhucHop20(masterDigits),
            phucHopHau25: generatePhucHop25(masterDigits),
            phucHopHau20: generatePhucHop20(masterDigits),
            phucHopMaster25: generatePhucHop25(masterDigits),
            phucHopMaster20: generatePhucHop20(masterDigits),
            phucHop25: generatePhucHop25(masterDigits),
            phucHop20: generatePhucHop20(masterDigits),
            overallProb: 99,
            probTien: 95,
            probHau: 95,
            probMaster: 98,
            reason: 'Khởi tạo dàn 5 chạm hạt nhân chuẩn theo 6 Cầu Vàng cao thủ và ma trận Pascal.'
        };
    }

    const n = history.length;
    const lastRound = history[n - 1];
    const [d1, d2, d3, d4, d5] = lastRound.digits.map(Number);

    const scores = Array(10).fill(0);

    // TRỤ 1: ĐIỂM RƠI TRỰC TIẾP (KỲ T-1)
    scores[d1] += 180; // Số đầu Tiền Nhị
    scores[d2] += 180; // Số thứ 2 Tiền Nhị
    scores[d4] += 180; // Số thứ 4 Hậu Nhị
    scores[d5] += 180; // Số cuối Hậu Nhị
    scores[d3] += 140; // Số trục tâm

    // TRỤ 2: ĐỈNH TAM GIÁC PASCAL (2 SỐ HẠT NHÂN HỘI TỤ)
    const pascPeaks = calculatePascalPeak(lastRound.digits);
    pascPeaks.forEach(p => {
        scores[p] += 200; // Điểm hội tụ hạt nhân
    });

    // TRỤ 3: CẦU ĐƠN VỊ * 2 -> Chính nó (u) & Bóng dương (u_bong)
    const u = (d5 * 2) % 10;
    const u_bong = (u + 5) % 10;
    let hitChinhNo = 0, hitBong = 0;
    for (let k = Math.max(0, n - 4); k < n - 1; k++) {
        const prevD5 = history[k].digits[4];
        const pu = (prevD5 * 2) % 10;
        const pbong = (pu + 5) % 10;
        const nextActual = history[k + 1].digits;
        if (nextActual.includes(pu)) hitChinhNo++;
        if (nextActual.includes(pbong)) hitBong++;
    }
    const scoreChinhNo = hitChinhNo >= hitBong ? 130 : 95;
    const scoreBong = hitBong > hitChinhNo ? 130 : 95;
    scores[u] += scoreChinhNo;
    scores[u_bong] += scoreBong;

    // TRỤ 4: CẶP CHẠM VÀNG QUY ĐỔI TRĂM (d3) & ĐƠN VỊ (d5)
    const r2_tram = MAP_EXCHANGE[d3] !== undefined ? MAP_EXCHANGE[d3] : (d3 + 5) % 10;
    const r2_donvi = MAP_EXCHANGE[d5] !== undefined ? MAP_EXCHANGE[d5] : (d5 + 5) % 10;
    scores[r2_tram] += 140;
    scores[r2_donvi] += 140;

    // TRỤ 5: CẦU BIÊN TRỪ & BIÊN CỘNG
    const r3 = (u - 1 + 10) % 10;
    scores[r3] += 85;
    const r4 = (u + 1) % 10;
    scores[r4] += 85;

    // TRỤ 6: 2 CẦU VÀNG GIA TRUYỀN: TỔNG ĐẦU (d1+d2) & TỔNG ĐUÔI (d4+d5) (CHÍNH NÓ & BÓNG DƯƠNG)
    const sumDau = (d1 + d2) % 10;
    const sumDauBong = (sumDau + 5) % 10;
    let hitDauChinh = 0, hitDauBong = 0;
    for (let k = Math.max(0, n - 4); k < n - 1; k++) {
        const prevDau = (history[k].digits[0] + history[k].digits[1]) % 10;
        const prevDauBong = (prevDau + 5) % 10;
        const nextActual = history[k + 1].digits;
        if (nextActual.includes(prevDau)) hitDauChinh++;
        if (nextActual.includes(prevDauBong)) hitDauBong++;
    }
    const scoreDauChinh = hitDauChinh >= hitDauBong ? 150 : 110;
    const scoreDauBong = hitDauBong > hitDauChinh ? 150 : 110;
    scores[sumDau] += scoreDauChinh;
    scores[sumDauBong] += scoreDauBong;

    const sumDuoi = (d4 + d5) % 10;
    const sumDuoiBong = (sumDuoi + 5) % 10;
    let hitDuoiChinh = 0, hitDuoiBong = 0;
    for (let k = Math.max(0, n - 4); k < n - 1; k++) {
        const prevDuoi = (history[k].digits[3] + history[k].digits[4]) % 10;
        const prevDuoiBong = (prevDuoi + 5) % 10;
        const nextActual = history[k + 1].digits;
        if (nextActual.includes(prevDuoi)) hitDuoiChinh++;
        if (nextActual.includes(prevDuoiBong)) hitDuoiBong++;
    }
    const scoreDuoiChinh = hitDuoiChinh >= hitDuoiBong ? 150 : 110;
    const scoreDuoiBong = hitDuoiBong > hitDuoiChinh ? 150 : 110;
    scores[sumDuoi] += scoreDuoiChinh;
    scores[sumDuoiBong] += scoreDuoiBong;

    // TRỤ 7: BÓNG NGŨ HÀNH ÂM DƯƠNG CHỌN LỌC
    const shadowD1 = getYinYangShadows(d1);
    const shadowD5 = getYinYangShadows(d5);
    scores[shadowD1.duong] += 100;
    scores[shadowD5.duong] += 100;
    scores[shadowD1.am] += 90;

    // TRỤ 8: BẠC NHỚ KỲ T-2 VÀ T-3
    if (n >= 2) {
        history[n - 2].digits.forEach(d => { scores[d] += 50; });
    }
    if (n >= 3) {
        history[n - 3].digits.forEach(d => { scores[d] += 25; });
    }

    // TRỤ 9: BỘ LỌC KHỬ LÔ GAN CỰC ĐOAN (TRỪ ĐIỂM SỐ CÂM)
    for (let digit = 0; digit <= 9; digit++) {
        let roundsSinceSeen = 0;
        for (let i = n - 1; i >= 0; i--) {
            if (history[i].digits.includes(digit)) break;
            roundsSinceSeen++;
        }
        if (roundsSinceSeen >= 8) {
            scores[digit] -= 220; // Gan sâu -> Loại bỏ
        } else if (roundsSinceSeen >= 5) {
            scores[digit] -= 110; // Gan vừa
        }
    }

    // SẮP XẾP VÀ CHỌN TOP 5 CHẠM CÓ ĐIỂM SỐ CAO NHẤT
    const sortedDigits = scores.map((score, digit) => ({ digit, score }))
                               .sort((a, b) => b.score - a.score);

    const baseProbs = [98, 93, 87, 81, 72];
    const topMaster = sortedDigits.slice(0, 5).map((item, idx) => {
        const attr = getBridgeAttribution(item.digit, lastRound.digits);
        return {
            digit: item.digit,
            score: item.score,
            prob: Math.min(99, Math.max(65, baseProbs[idx] + (item.score % 3))),
            bridgeTag: attr.tag,
            bridgeDetail: attr.detail
        };
    });

    const masterDigits = topMaster.map(x => x.digit);
    const phucHopMaster25 = generatePhucHop25(masterDigits);
    const phucHopMaster20 = generatePhucHop20(masterDigits);

    const pascPeak = pascPeaks;
    const goldenFlowState = hitChinhNo >= hitBong ? `Chính nó (${u})` : `Bóng dương (${u_bong})`;
    const flowDauState = hitDauChinh >= hitDauBong ? `Chính (${sumDau})` : `Bóng (${sumDauBong})`;
    const flowDuoiState = hitDuoiChinh >= hitDuoiBong ? `Chính (${sumDuoi})` : `Bóng (${sumDuoiBong})`;

    const reason = `Bắt trúng 5 Chạm VIP [${masterDigits.join(', ')}] qua 6 Cầu Vàng (Cặp Vàng Quy Đổi [${r2_tram},${r2_donvi}], Cầu Đơn Vị x2 [${u},${u_bong}] ưu tiên ${goldenFlowState}, Cầu Tổng Đầu [${sumDau},${sumDauBong}] ưu tiên ${flowDauState}, Cầu Tổng Đuôi [${sumDuoi},${sumDuoiBong}] ưu tiên ${flowDuoiState}, Cầu Biên [${r3},${r4}]), kết hợp Đỉnh Pascal [${pascPeak.join(',')}], Điểm Rơi [${d1},${d2},${d4},${d5}] & Khử Lô Gan. Dàn 25 số bao trọn kép ghép từ 5 Chạm này.`;

    return {
        topTien: topMaster,
        topHau: topMaster,
        topMaster: topMaster,
        tienDigits: masterDigits,
        hauDigits: masterDigits,
        masterDigits: masterDigits,
        goldenPair: [r2_tram, r2_donvi],
        unitDouble: [u, u_bong],
        unitMinus: r3,
        unitPlus: r4,
        sumDauPair: [sumDau, sumDauBong],
        sumDuoiPair: [sumDuoi, sumDuoiBong],
        goldenFlowState,
        top5: topMaster,
        chamDigits: masterDigits,
        phucHopTien25: phucHopMaster25,
        phucHopTien20: phucHopMaster20,
        phucHopHau25: phucHopMaster25,
        phucHopHau20: phucHopMaster20,
        phucHopMaster25: phucHopMaster25,
        phucHopMaster20: phucHopMaster20,
        phucHop25: phucHopMaster25,
        phucHop20: phucHopMaster20,
        overallProb: 99,
        probTien: 95,
        probHau: 95,
        probMaster: 98,
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
            predCham: chamAnalysis.masterDigits,
            predChamList: chamAnalysis.topMaster,
            topTien: chamAnalysis.topTien,
            tienDigits: chamAnalysis.tienDigits,
            topHau: chamAnalysis.topHau,
            hauDigits: chamAnalysis.hauDigits,
            topMaster: chamAnalysis.topMaster,
            masterDigits: chamAnalysis.masterDigits,
            phucHopTien25: chamAnalysis.phucHopTien25,
            phucHopTien20: chamAnalysis.phucHopTien20,
            phucHopHau25: chamAnalysis.phucHopHau25,
            phucHopHau20: chamAnalysis.phucHopHau20,
            phucHopMaster25: chamAnalysis.phucHopMaster25,
            phucHopMaster20: chamAnalysis.phucHopMaster20,
            phucHop25: chamAnalysis.phucHopMaster25,
            phucHop20: chamAnalysis.phucHopMaster20,
            predChamConf: 98,
            probTien: 92,
            probHau: 92,
            probMaster: 96,
            bridgeHealth: bridgeHealth,
            patternName: 'Khởi đầu',
            reason: 'Chưa có lịch sử kỳ quay. Nhập kết quả đầu tiên để AI bắt đầu quét nhịp cầu Tiền/Hậu Nhị và ghép dàn 25 số.'
        };
    }

    const txAnalysis = analyzeBridgePatterns(history, 'tx');
    const clAnalysis = analyzeBridgePatterns(history, 'cl');
    const chamAnalysis = analyzeTop5Cham(history);

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

        predCham: chamAnalysis.masterDigits,
        predChamList: chamAnalysis.topMaster,
        topTien: chamAnalysis.topTien,
        tienDigits: chamAnalysis.tienDigits,
        topHau: chamAnalysis.topHau,
        hauDigits: chamAnalysis.hauDigits,
        topMaster: chamAnalysis.topMaster,
        goldenPair: chamAnalysis.goldenPair || [7, 2],
        unitDouble: chamAnalysis.unitDouble || [2, 7],
        unitMinus: chamAnalysis.unitMinus !== undefined ? chamAnalysis.unitMinus : 1,
        unitPlus: chamAnalysis.unitPlus !== undefined ? chamAnalysis.unitPlus : 3,
        sumDauPair: chamAnalysis.sumDauPair || [7, 2],
        sumDuoiPair: chamAnalysis.sumDuoiPair || [5, 0],
        goldenFlowState: chamAnalysis.goldenFlowState || 'Chính nó & Bóng dương',
        phucHopTien25: chamAnalysis.phucHopTien25,
        phucHopTien20: chamAnalysis.phucHopTien20,
        phucHopHau25: chamAnalysis.phucHopHau25,
        phucHopHau20: chamAnalysis.phucHopHau20,
        phucHopMaster25: chamAnalysis.phucHopMaster25,
        phucHopMaster20: chamAnalysis.phucHopMaster20,
        phucHop25: chamAnalysis.phucHopMaster25,
        phucHop20: chamAnalysis.phucHopMaster20,
        predChamConf: chamAnalysis.overallProb,
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

    // Master 5 Cham & Dàn 25 Số VIP
    const predChamArr = currentPred.masterDigits || currentPred.predCham || [9, 4, 2, 7, 0];
    const hitCham = predChamArr.filter(c => digits.includes(c));
    const isChamHit = hitCham.length > 0;
    const statusCham = isWarmup ? 'Mốc Gốc' : (isChamHit ? 'Trúng' : 'Trượt');
    const statusChamDetail = isWarmup ? 'Mốc Gốc' : (isChamHit ? `Trúng [${hitCham.join(', ')}]` : 'Trượt');

    // Đánh chung Dàn 25 số cho Tiền Nhị (d1 d2) & Hậu Nhị (d4 d5)
    const tienNhiVal = `${digits[0]}${digits[1]}`;
    const hauNhiVal = `${digits[3]}${digits[4]}`;
    const isTienNhiHit = predChamArr.includes(digits[0]) && predChamArr.includes(digits[1]);
    const isHauNhiHit = predChamArr.includes(digits[3]) && predChamArr.includes(digits[4]);
    const isUnified25Hit = isTienNhiHit || isHauNhiHit;

    // Sound effect only after 5 warmup rounds
    if (!isWarmup) {
        playNotificationSound(isTxHup || isClHup || isChamHit || isUnified25Hit);
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
        predCham: predChamArr,
        predChamList: currentPred.predChamList || currentPred.topMaster || [],
        tienDigits: predChamArr,
        topTien: currentPred.topMaster || [],
        hauDigits: predChamArr,
        topHau: currentPred.topMaster || [],
        phucHop25: currentPred.phucHopMaster25 || currentPred.phucHop25 || [],
        predChamConf: currentPred.predChamConf || 96,
        hitCham: hitCham,
        isChamHit: isChamHit,
        tienNhiVal: tienNhiVal,
        isTienNhiHit: isTienNhiHit,
        hauNhiVal: hauNhiVal,
        isHauNhiHit: isHauNhiHit,
        isUnified25Hit: isUnified25Hit,
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

function calculateCapitalPlan(totalCapital = STATE.capital, safeFrames = STATE.safeFrames, betStrategy = STATE.betStrategy, payoutRate = STATE.payoutRate) {
    totalCapital = Math.max(100000, Number(totalCapital) || 30000000);
    safeFrames = Math.max(1, Number(safeFrames) || 5);
    payoutRate = Number(payoutRate) || 99;
    
    const frameBudget = Math.floor(totalCapital / safeFrames);
    const isDual = betStrategy === 'dual';
    const numCount = isDual ? 50 : 25;
    
    let step1PerNum, step2PerNum, step3PerNum;
    
    if (!isDual) {
        // Tỷ lệ chuẩn cho 1 cửa 25 số
        step1PerNum = Math.max(1000, Math.round((frameBudget * 0.0833) / (25 * 1000)) * 1000); // 20k -> 500k
        step2PerNum = Math.max(step1PerNum * 2, Math.round((frameBudget * 0.25) / (25 * 1000)) * 1000); // 60k -> 1.5M
        const rem3 = frameBudget - (step1PerNum * 25) - (step2PerNum * 25);
        step3PerNum = Math.max(step2PerNum * 2, Math.floor(rem3 / (25 * 1000)) * 1000); // 160k -> 4M
    } else {
        // Tỷ lệ chuẩn cho CẢ 2 ĐẦU: 50 số (25 Tiền Nhị + 25 Hậu Nhị)
        // Tay 1: 20k/số -> 500k Tiền + 500k Hậu = 1.000.000đ
        step1PerNum = Math.max(1000, Math.round((frameBudget / 6) / (50 * 1000)) * 1000); 
        // Tay 2: 35k/số -> 875k Tiền + 875k Hậu = 1.750.000đ
        step2PerNum = Math.max(step1PerNum, Math.round((frameBudget * 0.29166) / (50 * 1000)) * 1000);
        // Tay 3: 65k/số -> 1.625k Tiền + 1.625k Hậu = 3.250.000đ -> Khớp tròn 6M!
        const rem3 = frameBudget - (step1PerNum * 50) - (step2PerNum * 50);
        step3PerNum = Math.max(step2PerNum, Math.floor(rem3 / (50 * 1000)) * 1000);
    }

    const bet1Total = step1PerNum * numCount;
    const bet2Total = step2PerNum * numCount;
    const bet3Total = step3PerNum * numCount;
    const totalFrameCost = bet1Total + bet2Total + bet3Total;

    const perHead1 = step1PerNum * 25;
    const perHead2 = step2PerNum * 25;
    const perHead3 = step3PerNum * 25;

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
        isDual,
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
    updateFrameUI();
    updateCapitalUI();
    update10RoundStats();
    updateRoadmap();
    updateHistoryTable();
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

    // UNIFIED 5 CHẠM & DÀN 25 SỐ VIP ELEMENTS
    const chamListMaster = document.getElementById('predChamListMaster');
    const phucHopMasterDisplay = document.getElementById('phucHopMasterListDisplay');
    const predMasterConf = document.getElementById('predMasterConf');
    const topMaster = nextPred.topMaster || nextPred.predChamList || [];
    const phucHopMaster = nextPred.phucHopMaster25 || nextPred.phucHop25 || [];
    const probMaster = nextPred.probMaster || nextPred.predChamConf || 96;

    const insightTextElem = document.getElementById('bridgeInsightText');
    const tagsContainer = document.getElementById('bridgeTagsContainer');

    if (STATE.rounds.length === 0) {
        if (txElem) { txElem.innerText = '--'; txElem.className = 'pred-value'; }
        if (txConfElem) txConfElem.innerText = '0%';
        if (txBarElem) txBarElem.style.width = '0%';

        if (clElem) { clElem.innerText = '--'; clElem.className = 'pred-value'; }
        if (clConfElem) clConfElem.innerText = '0%';
        if (clBarElem) clBarElem.style.width = '0%';

        if (chamListMaster) {
            chamListMaster.innerHTML = topMaster.map((c, idx) => `
                <div class="cham-tag-pill" title="TOP ${idx + 1} - Chạm ${c.digit} (${c.prob}%): ${c.bridgeDetail || ''}">
                    <span class="cham-rank-badge rank-top${idx + 1}">TOP ${idx + 1}</span>
                    <span class="cham-num">C.${c.digit}</span>
                    <span class="cham-prob">${c.prob}%</span>
                    <span class="cham-bridge-name">${c.bridgeTag || 'Cầu Vàng'}</span>
                </div>
            `).join('');
        }
        if (phucHopMasterDisplay) phucHopMasterDisplay.innerText = phucHopMaster.join(', ');
        if (predMasterConf) predMasterConf.innerText = `${probMaster}%`;

        const goldenPairElem = document.getElementById('goldenPairVal');
        const unitDoubleElem = document.getElementById('unitDoubleVal');
        const unitBoundsElem = document.getElementById('unitBoundsVal');
        if (goldenPairElem) goldenPairElem.innerText = `[${(nextPred.goldenPair || [7,2]).join(', ')}]`;
        if (unitDoubleElem) unitDoubleElem.innerText = `[${(nextPred.unitDouble || [2,7]).join(', ')}]`;
        if (unitBoundsElem) unitBoundsElem.innerText = `[${nextPred.unitMinus !== undefined ? nextPred.unitMinus : 1}, ${nextPred.unitPlus !== undefined ? nextPred.unitPlus : 3}]`;

        if (insightTextElem) insightTextElem.innerText = 'Chưa đủ dữ liệu. Vui lòng nhập ít nhất 3 kỳ để hệ thống nhận diện nhịp cầu bệt, cầu 1-1, 1-2, 2-2, bắt 5 chạm vàng và ghép dàn 25 số VIP...';
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

    // Set CL
    if (clElem) {
        clElem.innerText = nextPred.predCl;
        clElem.className = `pred-value ${nextPred.predCl === 'Chẵn' ? 'pred-chan' : 'pred-le'}`;
    }
    if (clConfElem) clConfElem.innerText = `${nextPred.predClConf}%`;
    if (clBarElem) clBarElem.style.width = `${nextPred.predClConf}%`;

    // Calculate 3-round frame range for 5 Cham box
    const frameData = computeFrameHistory(STATE.rounds);
    const activeFrame = frameData.activeFrame;
    let fromNum = 101, toNum = 103, currentTay = 1;
    let rangeString = '';
    let tayString = '';

    if (activeFrame && activeFrame.isWarmup) {
        rangeString = `Đang nạp 5 kỳ gốc (${activeFrame.warmupCount || STATE.rounds.length}/5)`;
        tayString = `(Khung #1 từ Kỳ 6)`;
    } else if (activeFrame && activeFrame.startPeriod && activeFrame.startPeriod !== 'Khởi đầu') {
        const match = String(activeFrame.startPeriod).match(/\d+/);
        if (match) {
            const startN = parseInt(match[0]);
            fromNum = startN + 1;
            toNum = startN + 3;
        } else {
            fromNum = STATE.rounds.length + 1;
            toNum = STATE.rounds.length + 3;
        }
        currentTay = activeFrame.currentTay || 1;
        rangeString = `Kỳ ${fromNum} ➔ Kỳ ${toNum}`;
        tayString = `(Tay ${currentTay}/3)`;
    } else if (STATE.rounds.length > 0) {
        const lastP = STATE.rounds[STATE.rounds.length - 1].period;
        const match = String(lastP).match(/\d+/);
        const startN = match ? parseInt(match[0]) : STATE.rounds.length;
        fromNum = startN + 1;
        toNum = startN + 3;
        currentTay = 1;
        rangeString = `Kỳ ${fromNum} ➔ Kỳ ${toNum}`;
        tayString = `(Tay ${currentTay}/3)`;
    } else {
        rangeString = `Kỳ 101 ➔ Kỳ 103`;
        tayString = `(Tay 1/3)`;
    }

    const predChamRangeText = document.getElementById('predChamRangeText');
    const predChamTayText = document.getElementById('predChamTayText');
    const predFrameSpanText = document.getElementById('predFrameSpanText');

    if (predChamRangeText) predChamRangeText.innerText = rangeString;
    if (predChamTayText) predChamTayText.innerText = tayString;
    if (predFrameSpanText) predFrameSpanText.innerText = `${rangeString} ${tayString}`;

    // Render UNIFIED 5 CHẠM & DÀN 25 SỐ
    if (chamListMaster && topMaster) {
        chamListMaster.innerHTML = topMaster.map((c, idx) => `
            <div class="cham-tag-pill" title="TOP ${idx + 1} - Chạm ${c.digit} (${c.prob}%): ${c.bridgeDetail || ''}">
                <span class="cham-rank-badge rank-top${idx + 1}">TOP ${idx + 1}</span>
                <span class="cham-num">C.${c.digit}</span>
                <span class="cham-prob">${c.prob}%</span>
                <span class="cham-bridge-name">${c.bridgeTag || 'Cầu Vàng'}</span>
            </div>
        `).join('');
    }
    if (phucHopMasterDisplay && phucHopMaster) {
        phucHopMasterDisplay.innerText = phucHopMaster.join(', ');
    }
    if (predMasterConf) predMasterConf.innerText = `${probMaster}%`;

    // Render 6 Golden Rules Breakdown
    const sumDauElem = document.getElementById('sumDauVal');
    const sumDuoiElem = document.getElementById('sumDuoiVal');
    const goldenPairElem = document.getElementById('goldenPairVal');
    const unitDoubleElem = document.getElementById('unitDoubleVal');
    const unitBoundsElem = document.getElementById('unitBoundsVal');

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
        tagsContainer.innerHTML = `
            ${sigTag}
            <span class="bridge-tag tag-bet"><i class="fa-solid fa-wave-square"></i> ${nextPred.predTxPattern || 'Cầu Đang Chạy'}</span>
            <span class="bridge-tag tag-nhip"><i class="fa-solid fa-arrows-split-up-and-left"></i> ${nextPred.predClPattern || 'Nhịp Đồng Bộ'}</span>
            <span class="bridge-tag" style="background:rgba(245,158,11,0.2); color:#fbbf24; border-color:rgba(245,158,11,0.4);"><i class="fa-solid fa-crown text-gold"></i> Dàn 25 Số VIP (${phucHopMaster.length} số - Đánh Tiền & Hậu: ${rangeString})</span>
        `;
    }
}

/* ==========================================================================
   NUÔI DÀN 25 KHUNG 3 KỲ (TRÚNG LÀ DỪNG / ĐỔI DÀN)
   ========================================================================== */

function computeFrameHistory(rounds) {
    const WARMUP_COUNT = 5;

    if (!rounds || rounds.length < WARMUP_COUNT) {
        const warmupLen = rounds ? rounds.length : 0;
        const lastR = (rounds && rounds.length > 0) ? rounds[rounds.length - 1] : null;
        const defaultDigits = lastR ? lastR.digits : [5, 6, 8, 9, 2];
        const defaultCham = (rounds && rounds.length > 0) ? (analyzeTop5Cham(rounds).masterDigits || [8, 5, 7, 0, 9]) : [8, 5, 7, 0, 9];

        return {
            frames: [],
            activeFrame: {
                frameId: 1,
                isWarmup: true,
                warmupCount: warmupLen,
                warmupNeeded: WARMUP_COUNT,
                startPeriod: lastR ? lastR.period : 'Khởi đầu',
                startDigits: defaultDigits,
                cham5: defaultCham,
                dan25: generatePhucHop25(defaultCham),
                dan20: generatePhucHop20(defaultCham),
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
    const historySoFar = rounds.slice(0, WARMUP_COUNT);
    const baseRound = rounds[WARMUP_COUNT - 1]; // Kỳ thứ 5 làm Mốc Gốc Khung #1
    const chamInfo1 = analyzeTop5Cham(historySoFar);
    const cham5Init = chamInfo1.masterDigits;

    let currentFrame = {
        frameId: 1,
        startPeriod: baseRound.period,
        startDigits: baseRound.digits,
        cham5: cham5Init,
        dan25: generatePhucHop25(cham5Init),
        dan20: generatePhucHop20(cham5Init),
        goldenPair: chamInfo1.goldenPair,
        unitDouble: chamInfo1.unitDouble,
        steps: [],
        isResolved: false,
        wonStep: null,
        status: 'running',
        isWarmup: false
    };

    // Đánh giá các kỳ tiếp theo bắt đầu từ Kỳ thứ 6 (index = 5)
    for (let i = WARMUP_COUNT; i < rounds.length; i++) {
        const r = rounds[i];
        const stepNum = currentFrame.steps.length + 1; // Tay 1, 2 hoặc 3
        const tien = `${r.digits[0]}${r.digits[1]}`;
        const hau = `${r.digits[3]}${r.digits[4]}`;
        const hitTien = currentFrame.dan25.includes(tien);
        const hitHau = currentFrame.dan25.includes(hau);
        const isHit = hitTien || hitHau;

        currentFrame.steps.push({
            stepNum,
            period: r.period,
            digits: r.digits,
            tien,
            hau,
            hitTien,
            hitHau,
            isHit
        });

        historySoFar.push(r);

        if (isHit) {
            // TRÚNG KHUNG: Đánh dấu Húp, lưu khung và ĐỔI DÀN NGAY LẬP TỨC từ kỳ vừa trúng này
            currentFrame.isResolved = true;
            currentFrame.wonStep = stepNum;
            currentFrame.status = 'won';
            currentFrame.winType = (hitTien && hitHau) ? 'Cả Tiền & Hậu' : (hitTien ? 'Tiền Nhị' : 'Hậu Nhị');
            frames.push(currentFrame);

            // Khởi tạo Khung Mới từ kết quả kỳ r vừa trúng
            const nextCham = analyzeTop5Cham(historySoFar);
            currentFrame = {
                frameId: frames.length + 1,
                startPeriod: r.period,
                startDigits: r.digits,
                cham5: nextCham.masterDigits,
                dan25: generatePhucHop25(nextCham.masterDigits),
                dan20: generatePhucHop20(nextCham.masterDigits),
                goldenPair: nextCham.goldenPair,
                unitDouble: nextCham.unitDouble,
                steps: [],
                isResolved: false,
                wonStep: null,
                status: 'running',
                isWarmup: false
            };
        } else {
            if (stepNum >= 3) {
                // GÃY KHUNG: Quá 3 tay không trúng -> Chốt Gãy Khung và mở Khung Mới từ kỳ thứ 3
                currentFrame.isResolved = true;
                currentFrame.status = 'lost';
                frames.push(currentFrame);

                // Khởi tạo Khung Mới từ kỳ thứ 3 này
                const nextCham = analyzeTop5Cham(historySoFar);
                currentFrame = {
                    frameId: frames.length + 1,
                    startPeriod: r.period,
                    startDigits: r.digits,
                    cham5: nextCham.masterDigits,
                    dan25: generatePhucHop25(nextCham.masterDigits),
                    dan20: generatePhucHop20(nextCham.masterDigits),
                    goldenPair: nextCham.goldenPair,
                    unitDouble: nextCham.unitDouble,
                    steps: [],
                    isResolved: false,
                    wonStep: null,
                    status: 'running',
                    isWarmup: false
                };
            }
        }
    }

    if (currentFrame) {
        currentFrame.currentTay = currentFrame.steps.length + 1;
    }

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
    let biasAdvice = 'Dàn 25 số đang nổ đồng đều cả Tiền Nhị & Hậu Nhị. Khuyến nghị chia đều vốn!';
    let biasClass = 'bias-equal';

    if (hitHauCount > hitTienCount) {
        biasType = 'hau';
        biasTitle = `THIÊN VỀ HẬU NHỊ (${rateHau}% vs ${rateTien}%)`;
        biasAdvice = `Dàn 25 số đang nổ HẬU NHỊ vượt trội (${hitHauCount}/${totalWon} khung trúng). Khuyến nghị ưu tiên dồn vốn vào 2 số đuôi (Hậu Nhị)!`;
        biasClass = 'bias-hau';
    } else if (hitTienCount > hitHauCount) {
        biasType = 'tien';
        biasTitle = `THIÊN VỀ TIỀN NHỊ (${rateTien}% vs ${rateHau}%)`;
        biasAdvice = `Dàn 25 số đang nổ TIỀN NHỊ vượt trội (${hitTienCount}/${totalWon} khung trúng). Khuyến nghị ưu tiên dồn vốn vào 2 số đầu (Tiền Nhị)!`;
        biasClass = 'bias-tien';
    } else if (totalWon > 0) {
        biasTitle = `CÂN BẰNG ĐỒNG BỘ (${rateTien}% ⇌ ${rateHau}%)`;
        biasAdvice = `Dàn 25 số đang nổ cân bằng hoàn hảo (${hitTienCount} Tiền - ${hitHauCount} Hậu). Khuyến nghị vào đều vốn cả Tiền & Hậu!`;
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
                activeTitle.innerHTML = `<i class="fa-solid fa-crosshairs text-gold"></i> NUÔI DÀN 25 KHUNG 3 KỲ - KHUNG #${active.frameId || 1}`;
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
                if (active.startPeriod && active.startPeriod !== 'Khởi đầu') {
                    originElem.innerHTML = `
                        <span><i class="fa-solid fa-flag-checkered text-cyan"></i> Mốc Gốc: <b>Kỳ ${active.startPeriod} [${(active.startDigits || []).join('')}]</b></span>
                        <span style="margin-left: 8px;"><i class="fa-solid fa-crosshairs text-gold"></i> Đang Đánh Cho: <b class="text-green">${nextPeriodVal} (TAY ${tay}/3)</b></span>
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

        if (chamPillsElem && active.cham5) {
            chamPillsElem.innerHTML = active.cham5.map((d, idx) => {
                const attr = getBridgeAttribution(d, active.startDigits);
                return `
                    <div class="cham-tag-pill" title="TOP ${idx + 1} - Chạm ${d}: ${attr.detail}">
                        <span class="cham-rank-badge rank-top${idx + 1}">TOP ${idx + 1}</span>
                        <span class="cham-num">C.${d}</span>
                        <span class="cham-bridge-name">${attr.tag}</span>
                    </div>
                `;
            }).join('');
        }

        if (danDisplay && active.dan25) {
            danDisplay.innerText = active.dan25.join(', ');
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

    if (totalFramesBadge) totalFramesBadge.innerText = `${stats.totalDone} Khung Đã Xong`;
    if (fStatWinRate) fStatWinRate.innerText = `${stats.winRate}%`;
    if (fStatWinRatio) fStatWinRatio.innerText = `${stats.totalWon}/${stats.totalDone} Khung`;
    if (fStatStep1) fStatStep1.innerText = `${stats.rateStep1}%`;
    if (fStatStep1Ratio) fStatStep1Ratio.innerText = `${stats.wonStep1} Khung`;
    if (fStatStep2) fStatStep2.innerText = `${stats.rateStep2}%`;
    if (fStatStep2Ratio) fStatStep2Ratio.innerText = `${stats.wonStep2} Khung`;
    if (fStatStep3) fStatStep3.innerText = `${stats.rateStep3}%`;
    if (fStatStep3Ratio) fStatStep3Ratio.innerText = `${stats.wonStep3} Khung`;

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

                const chamPills = f.cham5.map((d, idx) => `
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
                            <span style="font-size:0.82rem; color:var(--text-dim);">5 Chạm:</span>
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
 * Fast clipboard copy for active frame 25/20 numbers
 */
function copyActiveFrameDan(count = 25) {
    const frameData = computeFrameHistory(STATE.rounds);
    const active = frameData.activeFrame;
    if (!active) return;

    let numbers = active.dan25;
    let label = '25 số VIP bao trọn kép';
    if (count === 20) {
        numbers = active.dan20 || generatePhucHop20(active.cham5);
        label = '20 số VIP bỏ kép';
    }

    const text = numbers.join(', ');
    navigator.clipboard.writeText(text).then(() => {
        alert(`ĐÃ SAO CHÉP DÀN NUÔI KHUNG (${label.toUpperCase()}) - TAY ${active.currentTay}/3!\n\nDàn số (${numbers.length} số): ` + text);
    }).catch(() => {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert(`ĐÃ SAO CHÉP DÀN NUÔI KHUNG (${label.toUpperCase()}) - TAY ${active.currentTay}/3!\n\nDàn số (${numbers.length} số): ` + text);
    });
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

    // --- 3. TIỀN NHỊ METRICS & BADGES (25 SỐ ĐẦU) ---
    const tienNhiHupElem = document.getElementById('tienNhiHupCount');
    const tienNhiGayElem = document.getElementById('tienNhiGayCount');
    const tienNhiRateElem = document.getElementById('tienNhiWinRate');
    const tienNhiBadgesGrid = document.getElementById('last10BadgesTienNhi');

    let tienNhiHup = 0;
    let tienNhiGay = 0;
    last10.forEach(r => {
        const isHit = (r.isTienNhiHit !== undefined) ? r.isTienNhiHit : false;
        if (isHit) tienNhiHup++;
        else tienNhiGay++;
    });

    if (tienNhiHupElem) tienNhiHupElem.innerText = tienNhiHup;
    if (tienNhiGayElem) tienNhiGayElem.innerText = tienNhiGay;
    const tienRate = last10.length > 0 ? Math.round((tienNhiHup / last10.length) * 100) : 0;
    if (tienNhiRateElem) tienNhiRateElem.innerText = `${tienRate}%`;

    if (tienNhiBadgesGrid) {
        tienNhiBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            tienNhiBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = (r.isTienNhiHit !== undefined) ? r.isTienNhiHit : false;
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const val = r.tienNhiVal || `${r.digits[0]}${r.digits[1]}`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">[${val}] ${isWin ? '✓' : '✗'}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | Tiền Nhị [${val}] ➔ ${isWin ? 'HÚP ✓ (Trúng trong 25 số VIP)' : 'GÃY ✗'}`;
            tienNhiBadgesGrid.appendChild(badge);
        });
    }

    // --- 4. HẬU NHỊ METRICS & BADGES (25 SỐ ĐUÔI) ---
    const hauNhiHupElem = document.getElementById('hauNhiHupCount');
    const hauNhiGayElem = document.getElementById('hauNhiGayCount');
    const hauNhiRateElem = document.getElementById('hauNhiWinRate');
    const hauNhiBadgesGrid = document.getElementById('last10BadgesHauNhi');

    let hauNhiHup = 0;
    let hauNhiGay = 0;
    last10.forEach(r => {
        const isHit = (r.isHauNhiHit !== undefined) ? r.isHauNhiHit : false;
        if (isHit) hauNhiHup++;
        else hauNhiGay++;
    });

    if (hauNhiHupElem) hauNhiHupElem.innerText = hauNhiHup;
    if (hauNhiGayElem) hauNhiGayElem.innerText = hauNhiGay;
    const hauRate = last10.length > 0 ? Math.round((hauNhiHup / last10.length) * 100) : 0;
    if (hauNhiRateElem) hauNhiRateElem.innerText = `${hauRate}%`;

    if (hauNhiBadgesGrid) {
        hauNhiBadgesGrid.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            hauNhiBadgesGrid.appendChild(emptyDiv);
        }
        last10.forEach(r => {
            const isWin = (r.isHauNhiHit !== undefined) ? r.isHauNhiHit : false;
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            const val = r.hauNhiVal || `${r.digits[3]}${r.digits[4]}`;
            badge.innerHTML = `
                <span class="badge-status-title">${isWin ? 'HÚP' : 'GÃY'}</span>
                <span class="badge-res-val">[${val}] ${isWin ? '✓' : '✗'}</span>
                <span class="badge-round-num">${r.period}</span>
            `;
            badge.title = `Kỳ ${r.period} | Hậu Nhị [${val}] ➔ ${isWin ? 'HÚP ✓ (Trúng trong 25 số VIP)' : 'GÃY ✗'}`;
            hauNhiBadgesGrid.appendChild(badge);
        });
    }

    // --- 5. BẮT 5 CHẠM THEO THỨ TỰ TỶ LỆ (% CAO ➔ THẤP) ---
    const chamHupElem = document.getElementById('chamHupCount');
    const chamRateElem = document.getElementById('chamWinRate');
    const chamStreakElem = document.getElementById('chamStreakStatus');

    const cham1HupElem = document.getElementById('cham1HupCount');
    const cham1RateElem = document.getElementById('cham1Rate');
    const cham1BadgesGrid = document.getElementById('last10BadgesCham1');

    const cham2HupElem = document.getElementById('cham2HupCount');
    const cham2RateElem = document.getElementById('cham2Rate');
    const cham2BadgesGrid = document.getElementById('last10BadgesCham2');

    const cham3HupElem = document.getElementById('cham3HupCount');
    const cham3RateElem = document.getElementById('cham3Rate');
    const cham3BadgesGrid = document.getElementById('last10BadgesCham3');

    const cham4HupElem = document.getElementById('cham4HupCount');
    const cham4RateElem = document.getElementById('cham4Rate');
    const cham4BadgesGrid = document.getElementById('last10BadgesCham4');

    const cham5HupElem = document.getElementById('cham5HupCount');
    const cham5RateElem = document.getElementById('cham5Rate');
    const cham5BadgesGrid = document.getElementById('last10BadgesCham5');

    let chamHup = 0;
    let cham1Hup = 0;
    let cham2Hup = 0;
    let cham3Hup = 0;
    let cham4Hup = 0;
    let cham5Hup = 0;

    const tierData = {
        tier1: [],
        tier2: [],
        tier3: [],
        tier4: [],
        tier5: []
    };

    last10.forEach(r => {
        const defaultCham = [9, 4, 2, 7, 0];
        const defaultProb = [87, 76, 68, 58, 45];
        const chamArr = (r.predCham && r.predCham.length >= 5) ? r.predCham : (r.predCham || defaultCham);
        
        for (let t = 0; t < 5; t++) {
            const digit = (chamArr[t] !== undefined) ? chamArr[t] : defaultCham[t];
            const prob = (r.predChamList && r.predChamList[t]) ? r.predChamList[t].prob : defaultProb[t];
            const hit = r.digits.includes(digit);
            if (t === 0 && hit) cham1Hup++;
            if (t === 1 && hit) cham2Hup++;
            if (t === 2 && hit) cham3Hup++;
            if (t === 3 && hit) cham4Hup++;
            if (t === 4 && hit) cham5Hup++;
            tierData[`tier${t+1}`].push({ digit, prob, hit, period: r.period });
        }

        const isAnyChamHit = chamArr.some(c => r.digits.includes(c));
        if (isAnyChamHit) chamHup++;
    });

    if (chamHupElem) chamHupElem.innerText = `${chamHup}/${last10.length}`;
    const chamRate = last10.length > 0 ? Math.round((chamHup / last10.length) * 100) : 0;
    if (chamRateElem) chamRateElem.innerText = `${chamRate}%`;

    const tierCounts = [cham1Hup, cham2Hup, cham3Hup, cham4Hup, cham5Hup];
    const hupElems = [cham1HupElem, cham2HupElem, cham3HupElem, cham4HupElem, cham5HupElem];
    const rateElems = [cham1RateElem, cham2RateElem, cham3RateElem, cham4RateElem, cham5RateElem];

    for (let t = 0; t < 5; t++) {
        if (hupElems[t]) hupElems[t].innerText = tierCounts[t];
        const rate = last10.length > 0 ? Math.round((tierCounts[t] / last10.length) * 100) : 0;
        if (rateElems[t]) rateElems[t].innerText = `${rate}%`;
    }

    function renderTierBadges(gridElem, dataList, tierLabel) {
        if (!gridElem) return;
        gridElem.innerHTML = '';
        for (let i = 0; i < emptyCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-badge-slot';
            emptyDiv.innerText = '-';
            gridElem.appendChild(emptyDiv);
        }
        dataList.forEach(item => {
            const isWin = item.hit;
            const badge = document.createElement('div');
            badge.className = `tracker-badge ${isWin ? 'badge-hup' : 'badge-gay'}`;
            badge.innerHTML = `
                <span>${isWin ? 'TRÚNG' : 'TRƯỢT'}</span>
                <span class="badge-res-val">Chạm ${item.digit}</span>
                <span class="badge-round-num">${item.period}</span>
            `;
            badge.title = `Kỳ ${item.period} | ${tierLabel}: Chạm ${item.digit} (${item.prob}%) ➔ ${isWin ? 'TRÚNG (Có số này)' : 'TRƯỢT (Không có số này)'}`;
            gridElem.appendChild(badge);
        });
    }

    renderTierBadges(cham1BadgesGrid, tierData.tier1, 'TOP 1 (% Cao Nhất)');
    renderTierBadges(cham2BadgesGrid, tierData.tier2, 'TOP 2 (% Thứ 2)');
    renderTierBadges(cham3BadgesGrid, tierData.tier3, 'TOP 3 (% Thứ 3)');
    renderTierBadges(cham4BadgesGrid, tierData.tier4, 'TOP 4 (% Thứ 4)');
    renderTierBadges(cham5BadgesGrid, tierData.tier5, 'TOP 5 (% Thứ 5)');

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

        const lastChamHit = playableRounds[playableRounds.length - 1].isChamHit;
        let chamStreak = 0;
        for (let j = playableRounds.length - 1; j >= 0; j--) {
            if (playableRounds[j].isChamHit === lastChamHit) chamStreak++;
            else break;
        }
        if (chamStreakElem) {
            chamStreakElem.innerHTML = lastChamHit ? `<span class="text-green">Đang Trúng ${chamStreak} tay</span>` : `<span class="text-red">Trượt ${chamStreak} tay</span>`;
        }
    } else {
        if (txStreakElem) txStreakElem.innerHTML = '<span class="text-dim">Chờ Kỳ 6</span>';
        if (clStreakElem) clStreakElem.innerHTML = '<span class="text-dim">Chờ Kỳ 6</span>';
        if (chamStreakElem) chamStreakElem.innerHTML = '<span class="text-dim">Chờ Kỳ 6</span>';
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
            txStatusBadge = r.statusTx === 'Húp'
                ? `<span class="status-pill-hup" title="Đoán đúng ${r.predTx}"><i class="fa-solid fa-check"></i> HÚP (${r.predTx})</span>`
                : `<span class="status-pill-gay" title="Đoán ${r.predTx} nhưng ra ${r.actualTx}"><i class="fa-solid fa-xmark"></i> GÃY (Đoán ${r.predTx} ➔ Ra ${r.actualTx})</span>`;

            clStatusBadge = r.statusCl === 'Húp'
                ? `<span class="status-pill-hup" title="Đoán đúng ${r.predCl}"><i class="fa-solid fa-check"></i> HÚP (${r.predCl})</span>`
                : `<span class="status-pill-gay" title="Đoán ${r.predCl} nhưng ra ${r.actualCl}"><i class="fa-solid fa-xmark"></i> GÃY (Đoán ${r.predCl} ➔ Ra ${r.actualCl})</span>`;
        }

        // Đối soát 5 Chạm
        let chamStatusBadge = '';
        if (isWarmup) {
            chamStatusBadge = `<div class="table-cham-results"><span class="status-pill-warmup"><i class="fa-solid fa-seedling"></i> Mốc Gốc</span></div>`;
        } else {
            const hitArr = chamArr.filter(c => r.digits.includes(c));
            const isDanHit = hitArr.length > 0;
            let miniHitsHtml = '';
            for (let t = 0; t < 5; t++) {
                const digit = (chamArr[t] !== undefined) ? chamArr[t] : defaultCham[t];
                const hit = r.digits.includes(digit);
                miniHitsHtml += `<span class="status-mini-cham ${hit ? 'cham-hit' : 'cham-miss'}" title="Top ${t+1} Chạm ${digit}">T${t+1}:${hit ? '✓' : '✗'}</span>`;
            }

            chamStatusBadge = `
                <div class="table-cham-results">
                    ${isDanHit ? `<span class="status-pill-trung"><i class="fa-solid fa-check"></i> TRÚNG [${hitArr.join(',')}]</span>` : `<span class="status-pill-truot"><i class="fa-solid fa-xmark"></i> TRƯỢT</span>`}
                    <div style="display:flex; gap:2px; margin-top:2px; flex-wrap:wrap; justify-content:center;">
                        ${miniHitsHtml}
                    </div>
                </div>
            `;
        }

        // Đối soát Tiền Nhị & Hậu Nhị (25 số phức hợp)
        const tienVal = `${r.digits[0]}${r.digits[1]}`;
        const isTienHit = (r.isTienNhiHit !== undefined) ? r.isTienNhiHit : (chamArr.includes(r.digits[0]) && chamArr.includes(r.digits[1]));
        
        const hauVal = `${r.digits[3]}${r.digits[4]}`;
        const isHauHit = (r.isHauNhiHit !== undefined) ? r.isHauNhiHit : (chamArr.includes(r.digits[3]) && chamArr.includes(r.digits[4]));

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
            if (parsed.capital !== undefined) STATE.capital = Number(parsed.capital) || 30000000;
            if (parsed.safeFrames !== undefined) STATE.safeFrames = Number(parsed.safeFrames) || 5;
            // Luôn ưu tiên mặc định 'dual' (Cả 2 đầu: 50 số Tiền Nhị & Hậu Nhị)
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

