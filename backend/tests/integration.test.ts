import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/repositories/db';

describe('Short Link Manager Integration Tests', () => {
  beforeAll(async () => {
    // Clear the database before tests
    await prisma.click.deleteMany();
    await prisma.link.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let createdLinkId = '';
  let createdSlug = '';

  it('should create a valid short link', async () => {
    const res = await request(app)
      .post('/api/links')
      .send({ destinationUrl: 'https://example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('slug');
    expect(res.body.destinationUrl).toBe('https://example.com');
    expect(res.body.clickCap).toBeNull();
    
    createdLinkId = res.body.id;
    createdSlug = res.body.slug;
  });

  it('should create a short link with a custom slug and cap', async () => {
    const res = await request(app)
      .post('/api/links')
      .send({ destinationUrl: 'https://google.com', slug: 'my-google', clickCap: 5 });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('my-google');
    expect(res.body.clickCap).toBe(5);
  });

  it('should return 409 Conflict if custom slug already exists', async () => {
    const res = await request(app)
      .post('/api/links')
      .send({ destinationUrl: 'https://yahoo.com', slug: 'my-google' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Custom slug already exists');
  });

  it('should reject malformed URLs', async () => {
    const res = await request(app)
      .post('/api/links')
      .send({ destinationUrl: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid destination URL');
  });

  it('should reject non http/https URLs', async () => {
    const res = await request(app)
      .post('/api/links')
      .send({ destinationUrl: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
  });

  it('should redirect and track a click', async () => {
    const res = await request(app).get(`/r/${createdSlug}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com');

    // Verify click count was incremented
    const link = await prisma.link.findUnique({ where: { slug: createdSlug } });
    expect(link?.clickCount).toBe(1);

    // Wait slightly for async click record to insert
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    const click = await prisma.click.findFirst({ where: { linkId: createdLinkId } });
    expect(click).toBeDefined();
  });

  it('should enforce click cap accurately under concurrency', async () => {
    // Create a link with cap = 3
    const capRes = await request(app)
      .post('/api/links')
      .send({ destinationUrl: 'https://testcap.com', slug: 'cap-test', clickCap: 3 });
    
    const capSlug = capRes.body.slug;

    // Fire 10 simultaneous requests
    const promises = Array.from({ length: 10 }).map(() => request(app).get(`/r/${capSlug}`));
    const responses = await Promise.all(promises);

    const redirects = responses.filter(r => r.status === 302);
    const gones = responses.filter(r => r.status === 410);

    // Exactly 3 should succeed, 7 should fail with 410
    expect(redirects.length).toBe(3);
    expect(gones.length).toBe(7);

    const updatedLink = await prisma.link.findUnique({ where: { slug: capSlug } });
    expect(updatedLink?.clickCount).toBe(3);
  });

  it('should disable a link', async () => {
    // Disable the initially created link
    const patchRes = await request(app).patch(`/api/links/${createdLinkId}/disable`);
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.disabled).toBe(true);

    // Verify redirect returns 410
    const redirectRes = await request(app).get(`/r/${createdSlug}`);
    expect(redirectRes.status).toBe(410);
    expect(redirectRes.body.error).toBe('This link is no longer available');
  });

  it('should retrieve 7-day stats even if disabled', async () => {
    const statsRes = await request(app).get(`/api/links/${createdLinkId}/stats`);
    expect(statsRes.status).toBe(200);
    expect(Array.isArray(statsRes.body)).toBe(true);
    expect(statsRes.body.length).toBe(7);
    
    // The last day (today) should have at least 1 click
    expect(statsRes.body[6].clicks).toBeGreaterThanOrEqual(1);
  });

  it('should list links with server-side pagination and search', async () => {
    const res = await request(app).get('/api/links?page=1&limit=10&search=google');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1); // Only my-google
    expect(res.body.meta.totalItems).toBe(1);
  });

  it('should cascade delete a link and its clicks', async () => {
    const delRes = await request(app).delete(`/api/links/${createdLinkId}`);
    expect(delRes.status).toBe(204);

    const linkCheck = await prisma.link.findUnique({ where: { id: createdLinkId } });
    expect(linkCheck).toBeNull();

    const clicksCheck = await prisma.click.findMany({ where: { linkId: createdLinkId } });
    expect(clicksCheck.length).toBe(0);
  });
});
