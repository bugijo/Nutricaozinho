import { Router } from 'express';
import { ingredientsRouter } from './ingredients.routes.js';
import { customersRouter } from './customers.routes.js';
import { petsRouter } from './pets.routes.js';
import { dietsRouter } from './diets.routes.js';
import { batchesRouter } from './batches.routes.js';
import { shoppingListRouter } from './shoppingList.routes.js';
import { alertsRouter } from './alerts.routes.js';
import { settingsRouter } from './settings.routes.js';

export const apiRouter = Router();

apiRouter.use('/ingredients', ingredientsRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/pets', petsRouter);
apiRouter.use('/diets', dietsRouter);
apiRouter.use('/batches', batchesRouter);
apiRouter.use('/shopping-list', shoppingListRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/settings', settingsRouter);
