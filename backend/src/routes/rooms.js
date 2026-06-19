const router = require('express').Router();
const { createRoom, getRoomByJoinCode, getRoomById, deleteRoom } = require('../controllers/roomController');
const requireAuth = require('../middleware/auth');
const requiresOwner = require('../middleware/requiresOwner');
const validate = require('../middleware/validate');
const { z } = require('zod');

const VIBES = ['chill', 'hype', 'study', 'party', 'road-trip'];
const createSchema = z.object({
  name: z.string().min(1).max(60),
  vibe: z.enum(VIBES).optional(),
});

router.post('/',              requireAuth, validate(createSchema), createRoom);
router.get('/code/:joinCode', requireAuth, getRoomByJoinCode);
router.get('/:id',            requireAuth, getRoomById);
router.delete('/:id',         requireAuth, requiresOwner, deleteRoom);

module.exports = router;
