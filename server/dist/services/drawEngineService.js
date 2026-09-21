"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawEngineService = exports.DrawEngineError = void 0;
const drawRepository_1 = require("../repositories/drawRepository");
const scoreRepository_1 = require("../repositories/scoreRepository");
const winnerRepository_1 = require("../repositories/winnerRepository");
const prizePoolService_1 = require("./prizePoolService");
const types_1 = require("../../../shared/types");
const db_1 = require("../db");
class DrawEngineError extends Error {
    errorCode;
    statusCode;
    constructor(message, errorCode = 'DRAW_ERROR', statusCode = 400) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.name = 'DrawEngineError';
    }
}
exports.DrawEngineError = DrawEngineError;
exports.drawEngineService = {
    /**
     * Generates 5 unique winning numbers (1-45).
     * 'random': uniform random sampling.
     * 'algorithmic': weighted sampling based on frequency of scores in subscriber pool.
     */
    generateNumbers(method = 'random', allScores = []) {
        const selected = new Set();
        if (method === 'random' || allScores.length === 0) {
            while (selected.size < 5) {
                const num = Math.floor(Math.random() * (types_1.SCORE_MAX - types_1.SCORE_MIN + 1)) + types_1.SCORE_MIN;
                selected.add(num);
            }
        }
        else {
            // Algorithmic: weighted based on score frequency
            const freqMap = {};
            for (let i = types_1.SCORE_MIN; i <= types_1.SCORE_MAX; i++)
                freqMap[i] = 1; // Base pseudo-count
            for (const score of allScores) {
                if (score >= types_1.SCORE_MIN && score <= types_1.SCORE_MAX) {
                    freqMap[score] = (freqMap[score] || 1) + 3; // Weight subscriber submitted scores
                }
            }
            while (selected.size < 5) {
                let totalWeight = 0;
                for (let i = types_1.SCORE_MIN; i <= types_1.SCORE_MAX; i++) {
                    if (!selected.has(i)) {
                        totalWeight += freqMap[i];
                    }
                }
                let rand = Math.random() * totalWeight;
                for (let i = types_1.SCORE_MIN; i <= types_1.SCORE_MAX; i++) {
                    if (selected.has(i))
                        continue;
                    rand -= freqMap[i];
                    if (rand <= 0) {
                        selected.add(i);
                        break;
                    }
                }
            }
        }
        return Array.from(selected).sort((a, b) => a - b);
    },
    /**
     * Evaluates match between user numbers and draw winning numbers.
     */
    evaluateMatch(userNumbers, winningNumbers) {
        const winningSet = new Set(winningNumbers);
        const matchedNumbers = userNumbers.filter(n => winningSet.has(n)).sort((a, b) => a - b);
        const matchCount = matchedNumbers.length;
        let prizeTier = null;
        if (matchCount === 5)
            prizeTier = 'five_match';
        else if (matchCount === 4)
            prizeTier = 'four_match';
        else if (matchCount === 3)
            prizeTier = 'three_match';
        return { matchedNumbers, matchCount, prizeTier };
    },
    /**
     * Runs draw simulation without modifying public results.
     */
    simulateDraw(drawId, method, customNumbers) {
        const draw = drawRepository_1.drawRepository.getById(drawId);
        if (!draw) {
            throw new DrawEngineError('Draw not found', 'DRAW_NOT_FOUND');
        }
        if (draw.status === 'published' || draw.status === 'completed') {
            throw new DrawEngineError('Cannot re-simulate a published or completed draw.', 'DRAW_ALREADY_PUBLISHED');
        }
        const effectiveMethod = method || draw.method || 'random';
        // 1. Get all active subscribers with their 5 latest scores
        const activeSubscribers = db_1.db.prepare(`
      SELECT p.id, p.full_name, p.email
      FROM profiles p
      JOIN subscriptions s ON p.id = s.user_id
      WHERE s.status = 'active'
    `).all();
        // Collect all scores for algorithmic weighting
        const allSubscriberScores = [];
        const subscriberEntries = [];
        for (const sub of activeSubscribers) {
            const userScores = scoreRepository_1.scoreRepository.getByUserId(sub.id);
            if (userScores.length === 5) {
                const numbers = userScores.map(s => s.score);
                allSubscriberScores.push(...numbers);
                subscriberEntries.push({
                    userId: sub.id,
                    userName: sub.full_name,
                    numbers,
                });
            }
        }
        // 2. Generate winning numbers
        let winningNumbers;
        if (customNumbers && customNumbers.length === 5) {
            winningNumbers = [...customNumbers].sort((a, b) => a - b);
        }
        else {
            winningNumbers = this.generateNumbers(effectiveMethod, allSubscriberScores);
        }
        // 3. Evaluate each entry
        const evaluatedEntries = subscriberEntries.map(e => {
            const evaluation = this.evaluateMatch(e.numbers, winningNumbers);
            return {
                ...e,
                ...evaluation,
            };
        });
        const tier5Matches = evaluatedEntries.filter(e => e.prizeTier === 'five_match');
        const tier4Matches = evaluatedEntries.filter(e => e.prizeTier === 'four_match');
        const tier3Matches = evaluatedEntries.filter(e => e.prizeTier === 'three_match');
        // 4. Calculate prize pool and payouts
        const distribution = prizePoolService_1.prizePoolService.calculateFullDistribution(activeSubscribers.length, draw.jackpot_rollover_cents, {
            tier5: tier5Matches.length,
            tier4: tier4Matches.length,
            tier3: tier3Matches.length,
        });
        // 5. Build simulated winner list
        const simulatedWinners = [
            ...tier5Matches.map(m => ({
                userId: m.userId,
                userName: m.userName,
                matchedNumbers: m.matchedNumbers,
                matchCount: m.matchCount,
                prizeTier: 'five_match',
                prizeAmountCents: distribution.tier5PayoutPerWinnerCents,
            })),
            ...tier4Matches.map(m => ({
                userId: m.userId,
                userName: m.userName,
                matchedNumbers: m.matchedNumbers,
                matchCount: m.matchCount,
                prizeTier: 'four_match',
                prizeAmountCents: distribution.tier4PayoutPerWinnerCents,
            })),
            ...tier3Matches.map(m => ({
                userId: m.userId,
                userName: m.userName,
                matchedNumbers: m.matchedNumbers,
                matchCount: m.matchCount,
                prizeTier: 'three_match',
                prizeAmountCents: distribution.tier3PayoutPerWinnerCents,
            })),
        ];
        // Update draw status to simulation with simulated winning numbers
        drawRepository_1.drawRepository.updateDraw(drawId, {
            status: 'simulation',
            method: effectiveMethod,
            winningNumbers,
            totalPrizePoolCents: distribution.totalPoolCents,
        });
        const simulation = {
            drawId,
            drawNumber: draw.draw_number,
            monthYear: draw.month_year,
            method: effectiveMethod,
            winningNumbers,
            totalSubscribers: activeSubscribers.length,
            totalEntries: subscriberEntries.length,
            rolloverInCents: draw.jackpot_rollover_cents,
            totalPrizePoolCents: distribution.totalPoolCents,
            tier5Winners: tier5Matches.length,
            tier4Winners: tier4Matches.length,
            tier3Winners: tier3Matches.length,
            tier5PayoutPerWinnerCents: distribution.tier5PayoutPerWinnerCents,
            tier4PayoutPerWinnerCents: distribution.tier4PayoutPerWinnerCents,
            tier3PayoutPerWinnerCents: distribution.tier3PayoutPerWinnerCents,
            rolloverOutCents: distribution.rolloverOutCents,
            winners: simulatedWinners,
        };
        drawRepository_1.drawRepository.saveDrawResult(drawId, simulation, false);
        return simulation;
    },
    /**
     * Publishes simulated draw results to production and locks them.
     * Creates draw_entries, winners, and prize_pools records.
     * Prevents accidental duplicate publishing!
     */
    publishDraw(drawId, adminId) {
        const draw = drawRepository_1.drawRepository.getById(drawId);
        if (!draw) {
            throw new DrawEngineError('Draw not found', 'DRAW_NOT_FOUND');
        }
        if (draw.status === 'published' || draw.status === 'completed' || draw.published_at) {
            throw new DrawEngineError('This draw has already been published and cannot be republished.', 'DUPLICATE_PUBLISH', 409);
        }
        if (!draw.winning_numbers || draw.winning_numbers.length !== 5) {
            throw new DrawEngineError('Please run a simulation or configure 5 winning numbers before publishing.', 'NO_WINNING_NUMBERS');
        }
        const winningNumbers = draw.winning_numbers;
        // Execute atomic transaction for publishing
        const publishTx = db_1.db.transaction(() => {
            // 1. Gather active subscribers
            const activeSubscribers = db_1.db.prepare(`
        SELECT p.id, p.full_name
        FROM profiles p
        JOIN subscriptions s ON p.id = s.user_id
        WHERE s.status = 'active'
      `).all();
            const entriesToSave = [];
            const winnersToCreate = [];
            for (const sub of activeSubscribers) {
                const userScores = scoreRepository_1.scoreRepository.getByUserId(sub.id);
                if (userScores.length === 5) {
                    const numbers = userScores.map(s => s.score);
                    const evaluation = this.evaluateMatch(numbers, winningNumbers);
                    entriesToSave.push({
                        drawId,
                        userId: sub.id,
                        numbers,
                        matchedNumbers: evaluation.matchedNumbers,
                        matchCount: evaluation.matchCount,
                        prizeTier: evaluation.prizeTier,
                        isWinner: evaluation.prizeTier !== null,
                    });
                }
            }
            // 2. Count winners per tier
            const tier5Count = entriesToSave.filter(e => e.prizeTier === 'five_match').length;
            const tier4Count = entriesToSave.filter(e => e.prizeTier === 'four_match').length;
            const tier3Count = entriesToSave.filter(e => e.prizeTier === 'three_match').length;
            // 3. Compute prize distribution
            const distribution = prizePoolService_1.prizePoolService.calculateFullDistribution(activeSubscribers.length, draw.jackpot_rollover_cents, { tier5: tier5Count, tier4: tier4Count, tier3: tier3Count });
            // 4. Save entries
            drawRepository_1.drawRepository.saveEntries(entriesToSave);
            // Fetch saved entries to get their generated IDs
            const savedEntries = drawRepository_1.drawRepository.getEntriesForDraw(drawId);
            const entryMap = new Map(savedEntries.map(e => [e.user_id, e.id]));
            // 5. Create winners with status 'pending'
            for (const entry of entriesToSave) {
                if (entry.prizeTier) {
                    let prizeAmountCents = 0;
                    if (entry.prizeTier === 'five_match')
                        prizeAmountCents = distribution.tier5PayoutPerWinnerCents;
                    else if (entry.prizeTier === 'four_match')
                        prizeAmountCents = distribution.tier4PayoutPerWinnerCents;
                    else if (entry.prizeTier === 'three_match')
                        prizeAmountCents = distribution.tier3PayoutPerWinnerCents;
                    const entryId = entryMap.get(entry.userId);
                    winnerRepository_1.winnerRepository.createWinner({
                        drawId,
                        userId: entry.userId,
                        entryId,
                        prizeTier: entry.prizeTier,
                        prizeAmountCents,
                    });
                }
            }
            // 6. Save prize pool record
            drawRepository_1.drawRepository.savePrizePool({
                draw_id: drawId,
                total_pool_cents: distribution.totalPoolCents,
                subscriber_contribution_cents: distribution.subscriberContributionCents,
                rollover_in_cents: distribution.rolloverInCents,
                rollover_out_cents: distribution.rolloverOutCents,
                tier_5_pool_cents: distribution.tier5PoolCents,
                tier_4_pool_cents: distribution.tier4PoolCents,
                tier_3_pool_cents: distribution.tier3PoolCents,
                tier_5_winner_count: tier5Count,
                tier_4_winner_count: tier4Count,
                tier_3_winner_count: tier3Count,
                tier_5_payout_per_winner_cents: distribution.tier5PayoutPerWinnerCents,
                tier_4_payout_per_winner_cents: distribution.tier4PayoutPerWinnerCents,
                tier_3_payout_per_winner_cents: distribution.tier3PayoutPerWinnerCents,
            });
            // 7. Update draw status to published
            const now = new Date().toISOString();
            drawRepository_1.drawRepository.updateDraw(drawId, {
                status: 'published',
                publishedAt: now,
                publishedBy: adminId,
                totalPrizePoolCents: distribution.totalPoolCents,
            });
            drawRepository_1.drawRepository.saveDrawResult(drawId, {
                publishedAt: now,
                publishedBy: adminId,
                winningNumbers,
                distribution,
                winnerCount: entriesToSave.filter(e => e.prizeTier).length,
            }, true);
            // Carry unclaimed jackpot into a next-month draft if one does not exist
            if (distribution.rolloverOutCents > 0) {
                const [year, month] = draw.month_year.split('-').map(Number);
                const next = new Date(Date.UTC(year, month, 1));
                const nextMonthYear = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
                const existingNext = db_1.db.prepare('SELECT id FROM draws WHERE month_year = ?').get(nextMonthYear);
                if (!existingNext) {
                    drawRepository_1.drawRepository.createDraw({
                        drawDate: next.toISOString(),
                        monthYear: nextMonthYear,
                        method: draw.method,
                        jackpotRolloverCents: distribution.rolloverOutCents,
                    });
                }
            }
            return drawId;
        });
        publishTx();
        return drawRepository_1.drawRepository.getById(drawId);
    }
};
