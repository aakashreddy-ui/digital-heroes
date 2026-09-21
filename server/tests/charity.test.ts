import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase } from '../src/db';
import { charityService } from '../src/services/charityService';
import { charityRepository } from '../src/repositories/charityRepository';
import { donationRepository } from '../src/repositories/donationRepository';
import { userRepository } from '../src/repositories/userRepository';

describe('Charity Contributions and Independent Donations', () => {
  let sampleCharityId: string;
  let testUserId: string;

  beforeAll(async () => {
    await initDatabase();
    const user = userRepository.create({
      email: `charity_test_${Date.now()}@test.com`,
      password_hash: 'hash',
      full_name: 'Charity Tester',
    });
    testUserId = user.id;

    let charities = charityRepository.getAll();
    if (charities.length === 0) {
      const c = charityRepository.create({
        name: 'Test Charity Alliance',
        slug: `test-charity-${Date.now()}`,
        mission: 'Testing charity mission',
        description: 'Testing charity description',
        category: 'Community',
        logo_url: 'https://test.com/logo.png',
        hero_image_url: 'https://test.com/hero.png',
        is_featured: true,
        is_active: true,
        upcoming_events: [],
        impact_metrics: [],
      });
      sampleCharityId = c.id;
    } else {
      sampleCharityId = charities[0].id;
    }
  });

  it('rejects charity contribution percentage below 10%', () => {
    expect(() => {
      charityService.setUserCharitySelection(testUserId, sampleCharityId, 5);
    }).toThrowError(/at least 10%/);

    expect(() => {
      charityService.setUserCharitySelection(testUserId, sampleCharityId, 0);
    }).toThrowError(/at least 10%/);

    expect(() => {
      charityService.setUserCharitySelection(testUserId, sampleCharityId, -1);
    }).toThrowError(/at least 10%/);
  });

  it('accepts valid charity selection with 10% minimum or higher percentage', () => {
    const sel10 = charityService.setUserCharitySelection(testUserId, sampleCharityId, 10);
    expect(sel10.contribution_percentage).toBe(10);
    expect(sel10.charity_id).toBe(sampleCharityId);

    const sel35 = charityService.setUserCharitySelection(testUserId, sampleCharityId, 35);
    expect(sel35.contribution_percentage).toBe(35);
  });

  it('rejects contribution percentage above 100%', () => {
    expect(() => {
      charityService.setUserCharitySelection(testUserId, sampleCharityId, 105);
    }).toThrowError(/cannot exceed 100%/);
  });

  it('maintains independent donations separate from gameplay', () => {
    const donation = charityService.createIndependentDonation({
      userId: testUserId,
      charityId: sampleCharityId,
      amountCents: 5000, // $50.00
      donorName: 'Generous Donor',
      donorEmail: 'generous@charity.org',
    });

    expect(donation.amount_cents).toBe(5000);
    expect(donation.is_independent).toBe(true);
    expect(donation.status).toBe('succeeded');

    // Independent donations appear in independent donation repository
    const userDonations = donationRepository.getByUserId(testUserId);
    expect(userDonations.some(d => d.id === donation.id)).toBe(true);
  });
});
