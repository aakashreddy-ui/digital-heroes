"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = void 0;
const analyticsRepository_1 = require("../repositories/analyticsRepository");
const error_1 = require("../middleware/error");
const db_1 = require("../db");
exports.analyticsController = {
    getOverview(_req, res, next) {
        try {
            const overview = analyticsRepository_1.analyticsRepository.getOverviewMetrics();
            const charityBreakdown = analyticsRepository_1.analyticsRepository.getCharityImpactBreakdown();
            const activity = analyticsRepository_1.analyticsRepository.getRecentActivity();
            // Score distribution histogram (bins 1-10, 11-20, 21-30, 31-40, 41-45)
            const scores = db_1.db.prepare('SELECT score FROM scores').all();
            const bins = [
                { bin: '1-10', count: 0 },
                { bin: '11-20', count: 0 },
                { bin: '21-30', count: 0 },
                { bin: '31-35', count: 0 },
                { bin: '36-40', count: 0 },
                { bin: '41-45', count: 0 },
            ];
            for (const s of scores) {
                if (s.score <= 10)
                    bins[0].count++;
                else if (s.score <= 20)
                    bins[1].count++;
                else if (s.score <= 30)
                    bins[2].count++;
                else if (s.score <= 35)
                    bins[3].count++;
                else if (s.score <= 40)
                    bins[4].count++;
                else
                    bins[5].count++;
            }
            return (0, error_1.sendSuccess)(res, {
                metrics: overview,
                charityBreakdown,
                activity,
                scoreDistribution: bins,
            }, 'Analytics overview');
        }
        catch (err) {
            next(err);
        }
    }
};
