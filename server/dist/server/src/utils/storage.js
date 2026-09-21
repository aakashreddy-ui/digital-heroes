"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicProofUrl = publicProofUrl;
const config_1 = require("../config");
/**
 * Proof files are stored on disk by default.
 * When Supabase credentials are present, the URL prefix can point at a Storage bucket.
 */
function publicProofUrl(filename) {
    if (config_1.config.supabaseUrl) {
        return `${config_1.config.supabaseUrl}/storage/v1/object/public/winner-proofs/${filename}`;
    }
    return `/uploads/proofs/${filename}`;
}
