import { Router } from 'express';
import { linkController } from '../controllers/linkController';

const router = Router();

router.post('/', linkController.createLink.bind(linkController));
router.get('/', linkController.getLinks.bind(linkController));
router.get('/:id', linkController.getLink.bind(linkController));
router.patch('/:id/disable', linkController.disableLink.bind(linkController));
router.delete('/:id', linkController.deleteLink.bind(linkController));
router.get('/:id/stats', linkController.getStats.bind(linkController));

export default router;
