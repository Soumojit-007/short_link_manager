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

      if (
        clickCap !== undefined &&
        (typeof clickCap !== 'number' ||
          clickCap <= 0 ||
          !Number.isInteger(clickCap))
      ) {
        throw new AppError('Invalid click cap', 400);
      }

      const link = await linkService.createLink(
        destinationUrl,
        slug,
        clickCap
      );

      res.status(201).json(link);
    } catch (error) {
      next(error);
    }
  }

  async getLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const page =
        typeof req.query.page === 'string'
          ? parseInt(req.query.page, 10)
          : 1;

      const limit =
        typeof req.query.limit === 'string'
          ? parseInt(req.query.limit, 10)
          : 10;

      const search =
        typeof req.query.search === 'string'
          ? req.query.search
          : '';

      const result = await linkService.getLinks(page, limit, search);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        throw new AppError('Invalid link ID', 400);
      }

      const link = await linkService.getLink(id);

      res.json(link);
    } catch (error) {
      next(error);
    }
  }

  async disableLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        throw new AppError('Invalid link ID', 400);
      }

      const link = await linkService.disableLink(id);

      res.json(link);
    } catch (error) {
      next(error);
    }
  }

  async deleteLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        throw new AppError('Invalid link ID', 400);
      }

      await linkService.deleteLink(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (typeof id !== 'string') {
        throw new AppError('Invalid link ID', 400);
      }

      const stats = await linkService.getStats(id);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async redirect(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      if (typeof slug !== 'string') {
        throw new AppError('Invalid slug', 400);
      }

      const referrer =
        typeof req.headers.referer === 'string'
          ? req.headers.referer
          : null;

      const destinationUrl = await linkService.handleRedirect(
        slug,
        referrer
      );

      res.redirect(302, destinationUrl);
    } catch (error) {
      // Assignment requires 410 Gone for unavailable links.
      if (error instanceof AppError && error.statusCode === 410) {
        res.status(410).json({
          error: 'This link is no longer available',
        });
      } else {
        next(error);
      }
    }
  }
}

export const linkController = new LinkController();