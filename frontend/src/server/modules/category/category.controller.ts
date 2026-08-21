// ============================================================
// CATEGORY CONTROLLER — HTTP Handlers
// Handles category-related HTTP requests
// ============================================================

import { Request, Response } from 'express';
import { CategoryService } from './category.service';

export const CategoryController = {
  /**
   * GET /categories
   *
   * Get all categories with product count
   *
   * Response: 200 OK with categories array
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.getAllWithProductCount();

      res.status(200).json({
        success: true,
        data: {
          items: categories,
        },
      });
    } catch (error) {
      console.error('[CategoryController] getCategories error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch categories',
        },
      });
    }
  },

  /**
   * GET /categories/:id
   *
   * Get category by ID with product count
   *
   * Response: 200 OK with category, 404 if not found
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category ID',
          },
        });
        return;
      }

      const category = await CategoryService.getByIdWithProductCount(id);

      if (!category) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      console.error('[CategoryController] getCategoryById error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch category',
        },
      });
    }
  },
} as const;
