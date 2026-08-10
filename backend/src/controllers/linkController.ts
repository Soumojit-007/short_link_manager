import { Request, Response, NextFunction } from 'express';
import { linkService } from '../services/linkService';
import { isValidUrl } from '../utils/validation';
import { AppError } from '../utils/errorHandler';

export class LinkController {
  async createLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { destinationUrl, slug, clickCap } = req.body;
      
      if (!destinationUrl || !isValidUrl(destinationUrl)) {
        throw new AppError('Invalid destination URL', 400);
      }
      
      if (clickCap !== undefined && (typeof clickCap !== 'number' || clickCap <= 0 || !Number.isInteger(clickCap))) {
        throw new AppError('Invalid click cap', 400);
      }

      const link = await linkService.createLink(destinationUrl, slug, clickCap);
      res.status(201).json(link);
    } catch (error) {
      next(error);
    }
  }

  async getLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';

      const result = await linkService.getLinks(page, limit, search);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLink(req: Request, res: Response, next: NextFunction) {
    try {
      const link = await linkService.getLink(req.params.id);
      res.json(link);
    } catch (error) {
      next(error);
    }
  }

  async disableLink(req: Request, res: Response, next: NextFunction) {
    try {
      const link = await linkService.disableLink(req.params.id);
      res.json(link);
    } catch (error) {
      next(error);
    }
  }

  async deleteLink(req: Request, res: Response, next: NextFunction) {
    try {
      await linkService.deleteLink(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await linkService.getStats(req.params.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async redirect(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      const referrer = req.headers.referer || null;
      
      const destinationUrl = await linkService.handleRedirect(slug, referrer);
      res.redirect(302, destinationUrl);
    } catch (error) {
      // According to assignment, return 410 Gone for disabled/capped/not found links
      if (error instanceof AppError && error.statusCode === 410) {
        res.status(410).json({ error: 'This link is no longer available' });
      } else {
        next(error);
      }
    }
  }
}

export const linkController = new LinkController();
