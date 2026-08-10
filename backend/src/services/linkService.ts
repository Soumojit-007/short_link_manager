import prisma from '../repositories/db';
import { generateSlug } from '../utils/validation';
import { AppError } from '../utils/errorHandler';

export class LinkService {
  async createLink(destinationUrl: string, customSlug?: string, clickCap?: number) {
    let slug = customSlug;
    if (slug) {
      const existing = await prisma.link.findUnique({ where: { slug } });
      if (existing) {
        throw new AppError('Custom slug already exists', 409);
      }
    } else {
      let isUnique = false;
      while (!isUnique) {
        slug = generateSlug();
        const existing = await prisma.link.findUnique({ where: { slug } });
        if (!existing) isUnique = true;
      }
    }

    return prisma.link.create({
      data: {
        destinationUrl,
        slug: slug as string,
        clickCap: clickCap || null,
      },
    });
  }

  async getLinks(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { slug: { contains: search, mode: 'insensitive' as const } },
            { destinationUrl: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, totalItems] = await Promise.all([
      prisma.link.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.link.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getLink(id: string) {
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) throw new AppError('Link not found', 404);
    return link;
  }

  async disableLink(id: string) {
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) throw new AppError('Link not found', 404);
    
    return prisma.link.update({
      where: { id },
      data: { disabled: true },
    });
  }

  async deleteLink(id: string) {
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) throw new AppError('Link not found', 404);
    
    await prisma.link.delete({ where: { id } });
  }

  async getStats(id: string) {
    // 7-day UTC stats including 0-click days
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) throw new AppError('Link not found', 404);

    const now = new Date();
    const stats: { date: string; clicks: number }[] = [];

    // Pre-fill 7 days with 0 clicks
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const dateString = d.toISOString().split('T')[0];
      stats.push({ date: dateString, clicks: 0 });
    }

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const clicks = await prisma.click.groupBy({
      by: ['timestamp'],
      where: {
        linkId: id,
        timestamp: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
    });

    // Aggregate raw timestamps into daily buckets
    clicks.forEach((c) => {
      const dateString = c.timestamp.toISOString().split('T')[0];
      const dayStat = stats.find(s => s.date === dateString);
      if (dayStat) {
        dayStat.clicks += c._count._all;
      }
    });

    return stats;
  }

  async handleRedirect(slug: string, referrer: string | null) {
    // Atomic update: only increment if below cap and not disabled
    // Prisma raw query is used for precise conditional update
    const result: any[] = await prisma.$queryRaw`
      UPDATE "Link"
      SET "clickCount" = "clickCount" + 1
      WHERE slug = ${slug}
        AND disabled = false
        AND ("clickCap" IS NULL OR "clickCount" < "clickCap")
      RETURNING *;
    `;

    if (result.length === 0) {
      // It's either missing, disabled, or capped
      const existing = await prisma.link.findUnique({ where: { slug } });
      if (!existing || existing.disabled || (existing.clickCap !== null && existing.clickCount >= existing.clickCap)) {
        throw new AppError('Gone', 410);
      }
      // Should not be reached unless race condition weirdness
      throw new AppError('Gone', 410);
    }

    const updatedLink = result[0];

    // Asynchronously insert click to not block response
    prisma.click.create({
      data: {
        linkId: updatedLink.id,
        referrer: referrer || null,
      }
    }).catch(console.error);

    return updatedLink.destinationUrl;
  }
}

export const linkService = new LinkService();
