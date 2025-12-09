#!/usr/bin/env node
import sequelize from '../db.js';
import { Sequelize } from 'sequelize';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connection OK');

    const qi = sequelize.getQueryInterface();

    // Alter column to allow NULL values
    await qi.changeColumn('recipes', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    console.log('✅ recipes.userId column altered to allow NULL');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to alter column:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
