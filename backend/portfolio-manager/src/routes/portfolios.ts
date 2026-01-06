import { Router } from 'express';
import portfolioController from '../controllers/portfolioController';

const router = Router();

/**
 * @route   GET /api/v1/portfolios
 * @desc    Get all portfolios (optionally filter by user_id)
 * @access  Public (should be protected in production)
 * @query   user_id - Optional user ID filter
 */
router.get('/', portfolioController.getAll);

/**
 * @route   GET /api/v1/portfolios/:id
 * @desc    Get portfolio by ID
 * @access  Public (should be protected in production)
 */
router.get('/:id', portfolioController.validateId, portfolioController.getById);

/**
 * @route   POST /api/v1/portfolios
 * @desc    Create a new portfolio
 * @access  Public (should be protected in production)
 * @body    { user_id, name, description?, currency? }
 */
router.post('/', portfolioController.validateCreate, portfolioController.create);

/**
 * @route   PUT /api/v1/portfolios/:id
 * @desc    Update portfolio
 * @access  Public (should be protected in production)
 * @body    { name?, description?, currency?, is_active? }
 */
router.put('/:id', portfolioController.validateUpdate, portfolioController.update);

/**
 * @route   DELETE /api/v1/portfolios/:id
 * @desc    Delete portfolio (soft delete)
 * @access  Public (should be protected in production)
 */
router.delete('/:id', portfolioController.validateId, portfolioController.delete);

export default router;
